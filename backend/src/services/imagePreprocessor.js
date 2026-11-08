// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: LOCAL IMAGE PREPROCESSOR & QUALITY GATE
// Zero-Cost Local Image Optimization, Blur/Exposure Detection & Normalization
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const config = require('../config/visionModels.config');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const ORIGINALS_DIR = path.join(UPLOADS_DIR, 'originals');
const PROCESSED_DIR = path.join(UPLOADS_DIR, 'processed');

// Ensure storage directories exist
[UPLOADS_DIR, ORIGINALS_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Calculates a quick variance of Laplacian approximation on a grayscale raw buffer
 * to estimate edge sharpness and detect blur.
 */
function calculateSharpnessScore(rawBuffer, width, height) {
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  // Sample stride to run efficiently in ~5ms
  const stride = 2;
  for (let y = 1; y < height - 1; y += stride) {
    for (let x = 1; x < width - 1; x += stride) {
      const idx = y * width + x;
      // Discrete Laplacian 3x3 kernel center: 4 * center - top - bottom - left - right
      const center = rawBuffer[idx];
      const top = rawBuffer[idx - width];
      const bottom = rawBuffer[idx + width];
      const left = rawBuffer[idx - 1];
      const right = rawBuffer[idx + 1];

      const lap = 4 * center - (top + bottom + left + right);
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return Math.max(0, variance);
}

/**
 * Calculates average brightness (0-255) from raw grayscale pixels.
 */
function calculateBrightness(rawBuffer) {
  let sum = 0;
  const step = 4;
  let count = 0;
  for (let i = 0; i < rawBuffer.length; i += step) {
    sum += rawBuffer[i];
    count++;
  }
  return count > 0 ? sum / count : 128;
}

/**
 * Preprocesses a raw sheet page upload, verifies quality gates, and outputs clean JPEG.
 * @param {Buffer|string} input Image Buffer, File Path, or base64 Data URL
 * @param {object} options Optional parameters (e.g. pageIndex, originalFilename)
 * @returns {Promise<{ passed: boolean, originalPath: string, processedPath: string, imageHash: string, width: number, height: number, base64Data: string }>}
 */
async function preprocessSheetPage(input, options = {}) {
  let inputBuffer;
  const pageLabel = options.pageIndex !== undefined ? `Page ${options.pageIndex + 1}` : 'Uploaded sheet';

  // 1. Resolve Input to Buffer
  if (Buffer.isBuffer(input)) {
    inputBuffer = input;
  } else if (typeof input === 'string') {
    if (input.startsWith('data:image')) {
      const base64Clean = input.replace(/^data:image\/[a-z]+;base64,/, '');
      inputBuffer = Buffer.from(base64Clean, 'base64');
    } else if (fs.existsSync(input)) {
      inputBuffer = fs.readFileSync(input);
    } else {
      throw new Error(`Invalid image input for ${pageLabel}: file path not found.`);
    }
  } else {
    throw new Error(`Invalid input type for ${pageLabel}: expected Buffer or base64 string.`);
  }

  // 2. Compute SHA-256 Hash for Idempotency & Deduplication
  const imageHash = crypto.createHash('sha256').update(inputBuffer).digest('hex');
  const originalFilename = `${imageHash}_raw.jpg`;
  const processedFilename = `${imageHash}_proc.jpg`;
  const originalPath = path.join(ORIGINALS_DIR, originalFilename);
  const processedPath = path.join(PROCESSED_DIR, processedFilename);

  // If already processed and cached on disk, return immediately
  if (fs.existsSync(processedPath) && fs.existsSync(originalPath)) {
    const cachedBuffer = fs.readFileSync(processedPath);
    const meta = await sharp(cachedBuffer).metadata();
    return {
      passed: true,
      originalPath,
      processedPath,
      imageHash,
      width: meta.width || 1800,
      height: meta.height || 2400,
      base64Data: cachedBuffer.toString('base64'),
      mimeType: 'image/jpeg',
      cached: true
    };
  }

  // 3. Save Original Image (unmodified copy stored for teacher inspection & review)
  if (!fs.existsSync(originalPath)) {
    fs.writeFileSync(originalPath, inputBuffer);
  }

  // 4. Inspect Metadata & Extract Raw Grayscale Pixels for Quality Gate
  let sharpInstance = sharp(inputBuffer).rotate(); // Auto-rotate via EXIF
  const metadata = await sharpInstance.metadata();

  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width < config.imageQuality.minDimensionPx || height < config.imageQuality.minDimensionPx) {
    return {
      passed: false,
      code: 'IMAGE_TOO_SMALL',
      error: `${pageLabel} resolution (${width}x${height}px) is too small. Please upload a clear photo of at least 800px.`,
      originalPath,
      imageHash
    };
  }

  // Downsample to 600px width for fast local edge variance and brightness checks
  const checkWidth = 600;
  const checkHeight = Math.round((height / width) * checkWidth);
  const rawGrayscale = await sharp(inputBuffer)
    .rotate()
    .resize(checkWidth, checkHeight)
    .grayscale()
    .raw()
    .toBuffer();

  const brightness = calculateBrightness(rawGrayscale);
  const sharpness = calculateSharpnessScore(rawGrayscale, checkWidth, checkHeight);

  // Quality Gate: Check Exposure
  if (brightness < config.imageQuality.minBrightness) {
    return {
      passed: false,
      code: 'IMAGE_TOO_DARK',
      error: `${pageLabel} is underexposed / too dark (brightness ${Math.round(brightness)}/255). Please retake under proper ambient lighting.`,
      originalPath,
      imageHash
    };
  }

  if (brightness > config.imageQuality.maxBrightness) {
    return {
      passed: false,
      code: 'IMAGE_TOO_BRIGHT',
      error: `${pageLabel} is overexposed / washed out with flash reflection. Please turn off camera flash and retake.`,
      originalPath,
      imageHash
    };
  }

  // Quality Gate: Check Blur
  if (sharpness < config.imageQuality.blurVarianceThreshold) {
    return {
      passed: false,
      code: 'IMAGE_BLURRY',
      error: `${pageLabel} appears blurry or out of focus (sharpness score ${sharpness.toFixed(1)} < ${config.imageQuality.blurVarianceThreshold}). Please retake with a steady camera.`,
      originalPath,
      imageHash
    };
  }

  // 5. Image Normalization: Resize to target dimension (1500–2000px), enhance contrast
  const targetLongEdge = config.imageQuality.targetDimensionPx;
  const isLandscape = width > height;
  const resizeOptions = isLandscape
    ? { width: targetLongEdge, withoutEnlargement: true }
    : { height: targetLongEdge, withoutEnlargement: true };

  const processedBuffer = await sharp(inputBuffer)
    .rotate()
    .resize(resizeOptions)
    .normalize() // Stretch contrast to make faint pencil/pen strokes clearly legible
    .jpeg({ quality: config.imageQuality.jpegQuality, chromaSubsampling: '4:4:4' })
    .toBuffer();

  fs.writeFileSync(processedPath, processedBuffer);

  const processedMeta = await sharp(processedBuffer).metadata();

  return {
    passed: true,
    originalPath,
    processedPath,
    imageHash,
    width: processedMeta.width,
    height: processedMeta.height,
    base64Data: processedBuffer.toString('base64'),
    mimeType: 'image/jpeg',
    cached: false
  };
}

module.exports = {
  preprocessSheetPage,
  calculateSharpnessScore,
  calculateBrightness,
  ORIGINALS_DIR,
  PROCESSED_DIR
};
