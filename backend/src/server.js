// ============================================================================
// UNISOLE AI SCHOOL: PRIMARY API GATEWAY & WEBSOCKET SERVER
// Unisole AI School Scholar Assistant
// ============================================================================

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const { initDatabase } = require('./config/database');
const persistence = require('./services/persistence');
const { securityHeaders, rateLimit, notFound, errorHandler } = require('./middleware/security');
const { initKafkaProducer } = require('./kafka/producer');
const { initKafkaConsumer, setBroadcastCallback } = require('./kafka/consumer');

const questionsRouter = require('./routes/questions');
const telemetryRouter = require('./routes/telemetry');
const analyticsRouter = require('./routes/analytics');
const handwrittenRouter = require('./routes/handwritten');
const reportsRouter = require('./routes/reports');
const uploadRouter = require('./routes/upload');
const notificationsRouter = require('./routes/notifications');
const assessmentsRouter = require('./routes/assessments');
const curriculumRouter = require('./routes/curriculum');
const voiceTutorRouter = require('./routes/voiceTutor');
const tenantRouter = require('./routes/tenant');
const contentRouter = require('./routes/content');
const modulesRouter = require('./routes/modules');
const teacherDppRouter = require('./routes/dpp');
const studyBoardRouter = require('./routes/studyBoard');
const doubtsRouter = require('./routes/doubts');
const noticesRouter = require('./routes/notices');
const mistakesRouter = require('./routes/mistakes');
const tutorRouter = require('./routes/tutor');
const ncertReadingEngineRouter = require('./routes/ncertReadingEngine');

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware (CORS configured for decoupled frontend origins)
const defaultLocalOrigins = [
  'http://localhost:3008',
  'http://127.0.0.1:3008',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const envOriginsRaw = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
  .filter(Boolean)
  .join(',');
const allowAllOrigins = !envOriginsRaw || envOriginsRaw.split(',').map(s => s.trim()).includes('*');
const allowedOrigins = new Set([
  ...defaultLocalOrigins,
  ...envOriginsRaw.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(s => s && s !== '*')
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowAllOrigins) return callback(null, true);
    const clean = origin.replace(/\/+$/, '');
    if (allowedOrigins.has(clean)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true
}));
app.use(securityHeaders);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
// Per-IP limits: generous for normal use, stricter for routes that call AI services or read uploads.
app.use('/api', rateLimit({ windowMs: 60000, max: Number(process.env.RATE_LIMIT_PER_MINUTE) || 600, name: 'general' }));
const costlyLimiter = rateLimit({ windowMs: 60000, max: Number(process.env.RATE_LIMIT_AI_PER_MINUTE) || 40, name: 'ai' });
['/api/questions/inject', '/api/questions/generate-ai', '/api/questions/generate-llm', '/api/study-board/doubt', '/api/tutor', '/api/study-board/lesson', '/api/voice-tutor', '/api/handwritten', '/api/upload'].forEach(p => app.use(p, costlyLimiter));
// NCERT Reading Engine is mounted at /api/v1 and /v1: /v1 also gets the general limit; PDF upload and AI study aids are costly.
app.use('/v1', rateLimit({ windowMs: 60000, max: Number(process.env.RATE_LIMIT_PER_MINUTE) || 600, name: 'general-v1' }));
app.use(/^\/(?:api\/)?v1\/admin\/(?:books\/upload|topics\/[^/]+\/ai-study)/, costlyLimiter);
// Save changed school data to PostgreSQL after every request that can change it.
app.use(persistence.middleware);

// WebSocket Client Hub for Real-time Classroom Telemetry
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`[WEBSOCKET] Client connected. Total active streams: ${wsClients.size}`);

  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    message: 'Connected to HAPS-AI Real-Time Telemetry Stream Bus',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming student telemetry stream over WebSocket
  ws.on('message', (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw.toString());
      console.log(`[WEBSOCKET INCOMING] Type: ${msg.type} from student ${msg.studentId || 'anon'}`);

      // Broadcast student telemetry to all connected teacher screens
      broadcastToClients({
        ...msg,
        broadcastTime: new Date().toISOString()
      });
    } catch (err) {
      console.error('[WEBSOCKET MSG PARSE ERROR]', err.message);
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`[WEBSOCKET] Client disconnected. Remaining: ${wsClients.size}`);
  });
});

// Broadcast helper for Kafka consumer events
function broadcastToClients(data) {
  const messageStr = JSON.stringify(data);
  for (const client of wsClients) {
    if (client.readyState === 1) { // OPEN
      client.send(messageStr);
    }
  }
}

setBroadcastCallback(broadcastToClients);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Unisole AI School Scholar Assistant API Gateway',
    school: 'Unisole AI School',
    curriculumSupport: ['HP_BOARD', 'CBSE', 'JEE_MAIN', 'JEE_ADVANCED', 'NEET', 'OLYMPIAD'],
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    activeWebSockets: wsClients.size,
    storage: persistence.status()
  });
});

// Mount Routes
app.use('/api/questions', questionsRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/handwritten', handwrittenRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/curriculum', curriculumRouter);
app.use('/api/voice-tutor', voiceTutorRouter);
// Multi-tenant dual-mode (Board vs Competitive) registry, canonical content & workspace modules
app.use('/api', tenantRouter);
app.use('/api/content', contentRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/dpp', teacherDppRouter);
app.use('/api/study-board', studyBoardRouter);
app.use('/api/doubts', doubtsRouter);
app.use('/api/notices', noticesRouter);
app.use('/api/mistakes', mistakesRouter);
app.use('/api/tutor', tutorRouter);
// NCERT Reading Engine API (https://github.com/moktagithub005/Ncert_reading_engine)
app.use('/api/v1', ncertReadingEngineRouter);
app.use('/v1', ncertReadingEngineRouter);

// Standalone Backend API Gateway Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Unisole AI School Scholar Assistant API & WebSocket Gateway',
    mode: 'standalone-backend',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// 404 + error handling (JSON, no internals in production)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

async function bootstrap() {
  console.log('------------------------------------------------------------');
  console.log('BOOTSTRAPPING HAPS-AI SCHOLAR ASSISTANT (STAGING/PROD)');
  console.log('------------------------------------------------------------');

  initDatabase();
  // Load saved school data from PostgreSQL before accepting requests.
  await persistence.init();

  server.listen(PORT, async () => {
    console.log(`[SERVER] HAPS-AI Gateway listening on port ${PORT}`);
    console.log(`[SERVER] Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`[SERVER] WebSocket server live at ws://localhost:${PORT}`);

    // Kafka is optional. It is used only when KAFKA_ENABLED=true (or brokers are set and it is not switched off).
    const kafkaOn = String(process.env.KAFKA_ENABLED || '').toLowerCase();
    if (kafkaOn === 'true' || (kafkaOn !== 'false' && process.env.KAFKA_BROKERS)) {
      try {
        await initKafkaProducer();
        await initKafkaConsumer();
      } catch (e) {
        console.warn('[SERVER] Kafka optional connection notice:', e.message);
      }
    } else {
      console.log('[SERVER] Kafka disabled: live events use the in-process stream.');
    }
  });
}

// Graceful shutdown: stop accepting requests, save pending changes, close the database pool.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[SERVER] ${signal} received. Saving data and shutting down...`);
  const force = setTimeout(() => process.exit(1), 10000);
  if (force.unref) force.unref();
  try { wss.clients.forEach(c => c.terminate()); } catch (e) { /* ignore */ }
  server.close(async () => {
    await persistence.shutdown();
    process.exit(0);
  });
}
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Unhandled promise rejection:', reason && reason.stack ? reason.stack : reason);
});

if (require.main === module) {
  ['SIGTERM', 'SIGINT'].forEach(sig => process.on(sig, () => shutdown(sig)));
  bootstrap().catch(err => {
    console.error('[SERVER] Startup failed:', err.message);
    process.exit(1);
  });
} else {
  initDatabase();
}

module.exports = { app, server };
