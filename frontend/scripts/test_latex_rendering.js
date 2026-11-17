/**
 * Complete test of LaTeX parsing, HTML entity decoding, delimiter normalization, and rendering
 */

function decodeHtmlEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function renderLatexString(rawText, katexMock) {
  if (!rawText || typeof rawText !== 'string') return '';

  let content = rawText;

  // 1. Clean up LLM trailing/leading slash artifacts on display equations
  // e.g. '\]\' -> '\]' and ':\ \[' -> ':\n\[' and ',\ \[' -> ',\n\['
  content = content.replace(/\\\]\\/g, '\\]');
  content = content.replace(/(:|,)\s*\\\\\s*(?=\\\[|\$\$)/g, '$1\n');
  content = content.replace(/\\\\\s*(?=\\\[|\$\$)/g, '\n');

  // 2. Render Display Math: $$...$$ or \[...\]
  // Match $$...$$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    try {
      return katexMock.renderToString(cleanTex, { displayMode: true, throwOnError: false });
    } catch (e) {
      return `<div class="katex-display-error">${cleanTex}</div>`;
    }
  });

  // Match \[...\] (and optional trailing \)
  content = content.replace(/\\\[([\s\S]*?)\\\](?:\\)?/g, (match, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    try {
      return katexMock.renderToString(cleanTex, { displayMode: true, throwOnError: false });
    } catch (e) {
      return `<div class="katex-display-error">${cleanTex}</div>`;
    }
  });

  // 3. Render Inline Math: \(...\) or $...$
  // Match \(...\)
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    try {
      return katexMock.renderToString(cleanTex, { displayMode: false, throwOnError: false });
    } catch (e) {
      return `<span class="katex-inline-error">${cleanTex}</span>`;
    }
  });

  // Match $...$ (ensure not preceded/followed by another $)
  content = content.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, tex) => {
    const cleanTex = decodeHtmlEntities(tex.trim());
    try {
      const rendered = katexMock.renderToString(cleanTex, { displayMode: false, throwOnError: false });
      return `${prefix}${rendered}`;
    } catch (e) {
      return `${prefix}<span class="katex-inline-error">${cleanTex}</span>`;
    }
  });

  // 4. Format line breaks in derivation text:
  // Convert newlines to <br/> while avoiding duplicate <br/> around display math
  content = content.replace(/\n\s*\n/g, '<br/><br/>');
  content = content.replace(/\n/g, '<br/>');

  return content;
}

// Test with the exact user prompt
const userSnippet = `An object is placed $30\\,\\text{cm}$ in front of a concave mirror whose focal length is $-15\\,\\text{cm}$. Using the mirror formula, calculate the image distance $v$ (in cm).
Step-by-Step Mathematical Derivation:
Benchmark: 90s
For a spherical mirror, the mirror formula is \\[\\frac{1}{f}=\\frac{1}{v}+\\frac{1}{u}\\]\\ Using the sign convention (real object in front of the mirror):\\ \\[f=-15\\,\\text{cm},\\quad u=-30\\,\\text{cm}\\]\\ Substituting,\\ \\[\\frac{1}{v}=\\frac{1}{f}-\\frac{1}{u}=\\frac{1}{-15}-\\frac{1}{-30}= -\\frac{1}{15}+\\frac{1}{30}= -\\frac{2-1}{30}= -\\frac{1}{30}\\]\\ Hence, \\[v=-30\\,\\text{cm}\\]\\ The negative sign indicates that the image is real and formed on the same side as the object.`;

const katexMock = {
  renderToString: (tex, opts) => {
    return opts.displayMode 
      ? `<div class="katex-display">[DISPLAY MATH: ${tex}]</div>`
      : `<span class="katex-inline">[INLINE: ${tex}]</span>`;
  }
};

const output = renderLatexString(userSnippet, katexMock);
console.log('--- RENDERED OUTPUT ---');
console.log(output);

// Assert all math parts were processed
const displayCount = (output.match(/class="katex-display"/g) || []).length;
const inlineCount = (output.match(/class="katex-inline"/g) || []).length;

console.log(`\nDisplay math blocks rendered: ${displayCount} (expected: 4)`);
console.log(`Inline math blocks rendered: ${inlineCount} (expected: 3: $30\\,\\text{cm}$, $-15\\,\\text{cm}$, $v$)`);

if (displayCount === 4 && inlineCount === 3 && !output.includes('\\[') && !output.includes('\\]')) {
  console.log('✅ 100% PERFECT: All LaTeX formulas parsed and converted to KaTeX!');
} else {
  console.error('❌ Failed to parse all formulas cleanly.');
}
