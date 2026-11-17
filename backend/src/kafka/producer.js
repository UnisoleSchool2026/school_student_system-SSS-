// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: APACHE KAFKA EVENT PRODUCER
// Publishes sub-second question timer ticks, attempt submissions, and OCR tasks
// ============================================================================

const { Kafka, logLevel } = require('kafkajs');

let producer = null;
let isKafkaActive = false;
const eventLog = [];

async function initKafkaProducer() {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

  try {
    const kafka = new Kafka({
      clientId: 'haps-api-producer',
      brokers,
      logLevel: logLevel.NOTHING,
      retry: {
        initialRetryTime: 300,
        retries: 2
      }
    });

    producer = kafka.producer();
    await producer.connect();
    isKafkaActive = true;
    console.log('[KAFKA PRODUCER] Connected to Kafka brokers:', brokers);
  } catch (err) {
    console.warn('[KAFKA PRODUCER] Kafka broker unavailable. Running with resilient In-Memory Event Streaming Bus.');
    isKafkaActive = false;
  }
}

/**
 * Emit an event to Kafka or fallback event stream
 * @param {string} topic e.g., 'telemetry.question-timer', 'telemetry.assessment-submit'
 * @param {string} key Partition key (typically student_id)
 * @param {object} message Event payload
 */
async function emitEvent(topic, key, message) {
  const timestamp = new Date().toISOString();
  const payload = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    topic,
    timestamp,
    key,
    data: message
  };

  eventLog.unshift(payload);
  if (eventLog.length > 200) eventLog.pop(); // Keep recent 200 events

  if (isKafkaActive && producer) {
    try {
      await producer.send({
        topic,
        messages: [
          {
            key: String(key),
            value: JSON.stringify(payload),
            headers: { 'source-system': 'haps-ai-scholar-gateway' }
          }
        ]
      });
      return payload;
    } catch (err) {
      console.warn(`[KAFKA PRODUCER ERROR] Failed to send to ${topic}:`, err.message);
    }
  }

  // Fallback broadcast log
  console.log(`[EVENT STREAM -> ${topic}] Student: ${key} | Action: ${message.action || 'TelemetryEvent'}`);
  return payload;
}

function getRecentEvents() {
  return eventLog;
}

module.exports = {
  initKafkaProducer,
  emitEvent,
  getRecentEvents
};
