const WebSocket = require('ws');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function benchmarkGeminiLiveLatency() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not defined');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  console.log('Generating ephemeral auth token...');
  const token = await ai.authTokens.create({
    config: {
      uses: 5,
      expireTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(Date.now() + 120 * 1000).toISOString()
    }
  });

  const rawModel = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-latest';
  const model = rawModel.startsWith('models/') ? rawModel : `models/${rawModel}`;
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.name)}`;

  console.log(`Connecting WebSocket to ${model}...`);
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  console.log('WebSocket connected. Sending setup message with thinkingBudget: 0...');
  const setupMsg = {
    setup: {
      model,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Puck'
            }
          }
        },
        thinkingConfig: {
          thinkingBudget: 0
        }
      },
      systemInstruction: {
        parts: [{ text: 'You are an Indian school tutor. Give short 1-sentence answers in friendly Hinglish.' }]
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          prefixPaddingMs: 100,
          silenceDurationMs: 350
        },
        activityHandling: 'START_OF_ACTIVITY_INTERRUPTS'
      }
    }
  };

  ws.send(JSON.stringify(setupMsg));

  await new Promise((resolve, reject) => {
    const onMsg = (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.setupComplete) {
        ws.removeListener('message', onMsg);
        resolve();
      } else if (parsed.error) {
        ws.removeListener('message', onMsg);
        reject(new Error(parsed.error.message));
      }
    };
    ws.on('message', onMsg);
  });

  console.log('Setup handshake complete! Now sending student question and timing response...');
  const startPromptTime = Date.now();
  let firstAudioTime = null;
  let totalAudioBytes = 0;
  let outputText = '';

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    const content = msg.serverContent;
    if (!content) return;

    if (content.outputTranscription?.text) {
      outputText += content.outputTranscription.text;
    }

    for (const part of content.modelTurn?.parts || []) {
      if (part.inlineData?.data) {
        if (!firstAudioTime) {
          firstAudioTime = Date.now();
          console.log(`FIRST AUDIO CHUNK RECEIVED IN: ${firstAudioTime - startPromptTime}ms!`);
        }
        totalAudioBytes += Buffer.from(part.inlineData.data, 'base64').length;
      }
    }

    if (content.turnComplete) {
      const turnEndTime = Date.now();
      console.log(`TURN COMPLETE in ${turnEndTime - startPromptTime}ms`);
      console.log(`Total Spoken Audio: ${totalAudioBytes} bytes (PCM 24kHz)`);
      console.log(`Tutor Transcript: "${outputText.trim()}"`);
      ws.close();
    }
  });

  // Send student question
  ws.send(JSON.stringify({
    clientContent: {
      turns: [{
        role: 'user',
        parts: [{ text: 'Sir, what is the unit of electric potential difference?' }]
      }],
      turnComplete: true
    }
  }));

  await new Promise((resolve) => ws.on('close', resolve));
  console.log('Latency benchmark finished successfully!');
}

benchmarkGeminiLiveLatency().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
