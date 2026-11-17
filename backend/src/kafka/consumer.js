// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: APACHE KAFKA EVENT CONSUMER & DIAGNOSTIC WORKER
// Consumes telemetry events, updates concept mastery matrix & feeds live WebSocket
// ============================================================================

const { Kafka, logLevel } = require('kafkajs');
const { inMemoryStore } = require('../config/database');

let consumer = null;
let broadcastCallback = null;

function setBroadcastCallback(cb) {
  broadcastCallback = cb;
}

async function initKafkaConsumer() {
  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

  try {
    const kafka = new Kafka({
      clientId: 'haps-diagnostic-worker',
      brokers,
      logLevel: logLevel.NOTHING,
      retry: { initialRetryTime: 300, retries: 2 }
    });

    consumer = kafka.consumer({ groupId: 'haps-analytics-group' });
    await consumer.connect();
    await consumer.subscribe({
      topics: ['telemetry.question-timer', 'telemetry.assessment-submit'],
      fromBeginning: false
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          processTelemetryEvent(payload);
        } catch (e) {
          console.error('[KAFKA CONSUMER ERROR] JSON Parse fail:', e.message);
        }
      }
    });

    console.log('[KAFKA CONSUMER] Subscribed to telemetry topics.');
  } catch (err) {
    console.warn('[KAFKA CONSUMER] Kafka consumer offline. Processing events via in-memory stream dispatcher.');
  }
}

/**
 * Core Diagnostic Algorithm: Maps raw telemetry to Concept Mastery Status
 */
function processTelemetryEvent(event) {
  const { data } = event;
  const { studentId, questionId, timeSpentSeconds, attemptStatus, subtopic, topic, benchmarkSeconds = 120, hintsUsed = 0 } = data;

  if (!studentId || !subtopic) return;

  const isCorrect = attemptStatus === 'CORRECT';
  const speedRatio = timeSpentSeconds / (benchmarkSeconds || 120);

  // Find or create concept mastery record in store
  let masteryRecord = inMemoryStore.conceptMastery.find(
    (c) => c.student_id === studentId && (c.subtopic === subtopic || c.topic === topic)
  );

  if (!masteryRecord) {
    masteryRecord = {
      student_id: studentId,
      topic: topic || 'Physics Core',
      subtopic: subtopic,
      mastery_status: 'NEEDS_RECAP',
      mastery_score: 50.0,
      accuracy: 50.0,
      avg_time_sec: timeSpentSeconds,
      attempts: 0
    };
    inMemoryStore.conceptMastery.push(masteryRecord);
  }

  // Update rolling stats
  masteryRecord.attempts += 1;
  const oldAccuracyWeight = (masteryRecord.attempts - 1) / masteryRecord.attempts;
  const currentAccuracy = isCorrect ? 100 : 0;
  masteryRecord.accuracy = Math.round(masteryRecord.accuracy * oldAccuracyWeight + currentAccuracy / masteryRecord.attempts);
  masteryRecord.avg_time_sec = Math.round((masteryRecord.avg_time_sec + timeSpentSeconds) / 2);

  // Evaluate Mastery Formula
  // M = 0.6 * Accuracy + 0.3 * (1 - speed penalty) - 0.1 * hints
  let speedPenalty = Math.max(0, (speedRatio - 1.0) * 20);
  let hintPenalty = hintsUsed * 10;
  let score = masteryRecord.accuracy * 0.7 - speedPenalty - hintPenalty;
  masteryRecord.mastery_score = Math.max(5, Math.min(100, Math.round(score)));

  // Categorize
  if (masteryRecord.accuracy >= 80 && speedRatio <= 1.3 && hintsUsed === 0) {
    masteryRecord.mastery_status = 'MASTERED';
  } else if (masteryRecord.accuracy < 50 || speedRatio > 2.0 || hintsUsed >= 2) {
    masteryRecord.mastery_status = 'CRITICAL_WEAKNESS';
  } else {
    masteryRecord.mastery_status = 'NEEDS_RECAP';
  }

  console.log(`[DIAGNOSTIC WORKER] Student: ${studentId} | Subtopic: ${subtopic} -> ${masteryRecord.mastery_status} (${masteryRecord.mastery_score}%)`);

  // Broadcast to live Teacher Dashboard via WebSocket
  if (broadcastCallback) {
    broadcastCallback({
      type: 'CONCEPT_MASTERY_UPDATE',
      studentId,
      subtopic,
      status: masteryRecord.mastery_status,
      score: masteryRecord.mastery_score,
      timeSpent: timeSpentSeconds,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  initKafkaConsumer,
  processTelemetryEvent,
  setBroadcastCallback
};
