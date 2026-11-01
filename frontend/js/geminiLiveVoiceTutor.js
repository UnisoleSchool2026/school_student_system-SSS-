/**
 * ============================================================================
 * UNISOLE AI SCHOOL - REAL-TIME FULL-DUPLEX VOICE ASSISTANT ENGINE
 * Powered by Google Gemini Multimodal Live API (WebSockets)
 * Features:
 *  - Full-Duplex Universal 16kHz PCM Ingest (Auto-Resampled) & 24kHz PCM Egress
 *  - Instant Hands-Free Natural Interruption via Server-Side VAD
 *  - Sub-2s Turnaround with Zero Thinking Budget Constraint
 *  - Continuous Multi-Question Navigation (Maintains Live Session on Switch)
 *  - Live Mic & Speaker Waveform Audio Visualizers
 * ============================================================================
 */

(function (window) {
  'use strict';

  function bytesToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let offset = 0; offset < len; offset += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, Math.min(offset + 0x8000, len)));
    }
    return btoa(binary);
  }

  function floatToPcm16(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return new Uint8Array(output.buffer);
  }

  // Universal high-quality linear downsampler to 16000Hz PCM
  function downsampleTo16000(inputSamples, inputSampleRate) {
    if (!inputSamples || inputSamples.length === 0) return new Float32Array(0);
    if (inputSampleRate === 16000) return inputSamples;
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(inputSamples.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetInput = 0;
    while (offsetResult < result.length) {
      const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetInput; i < nextOffsetInput && i < inputSamples.length; i++) {
        accum += inputSamples[i];
        count++;
      }
      result[offsetResult] = count > 0 ? (accum / count) : 0;
      offsetResult++;
      offsetInput = nextOffsetInput;
    }
    return result;
  }

  async function parseSocketMessage(data) {
    if (typeof data === 'string') return JSON.parse(data);
    if (data instanceof Blob) {
      const text = await data.text();
      return JSON.parse(text);
    }
    if (data instanceof ArrayBuffer) {
      const text = new TextDecoder().decode(data);
      return JSON.parse(text);
    }
    return JSON.parse(data.toString());
  }

  class GeminiLiveVoiceTutorEngine {
    constructor() {
      this.socket = null;
      this.audioContext = null;
      this.inputStream = null;
      this.mediaStreamSource = null;
      this.processor = null;
      this.muteGain = null;
      this.outputGain = null;
      this.inputAnalyser = null;
      this.outputAnalyser = null;
      this.sources = [];
      this.scheduledEnd = 0;
      this.status = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED
      this.activeQuestionId = null;
      this.activeQuestionData = null;
      this.callbacks = {};
      this.levelAnimationId = null;
      this.isStreamingVoice = false;
      this.lastVoiceAt = 0;
      this.preAudioBuffer = [];

      this.currentInputText = '';
      this.currentOutputText = '';
      this._setupResolve = null;
      this._setupReject = null;
    }

    getStatus() {
      return this.status;
    }

    getActiveQuestionId() {
      return this.activeQuestionId;
    }

    isSessionActive() {
      return this.status === 'CONNECTED' || this.status === 'CONNECTING';
    }

    setCallbacks(callbacks = {}) {
      this.callbacks = Object.assign({}, this.callbacks, callbacks);
    }

    stopPlayback() {
      for (const source of this.sources) {
        try {
          source.stop();
        } catch (e) {
          // Source may have already ended
        }
      }
      this.sources = [];
      if (this.audioContext) {
        this.scheduledEnd = this.audioContext.currentTime;
      }
      if (this.callbacks.onInterrupted) {
        this.callbacks.onInterrupted();
      }
    }

    playAudioChunk(base64Audio) {
      if (!this.audioContext || !this.outputGain) return;
      try {
        const binary = atob(base64Audio);
        const pcm = new Int16Array(binary.length / 2);
        for (let i = 0; i < pcm.length; i++) {
          pcm[i] = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
        }

        // Gemini egress rate is 24000Hz PCM
        const audioBuffer = this.audioContext.createBuffer(1, pcm.length, 24000);
        const channel = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcm.length; i++) {
          channel[i] = pcm[i] / 0x8000;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputGain);

        const startAt = Math.max(this.audioContext.currentTime, this.scheduledEnd);
        source.start(startAt);
        this.scheduledEnd = startAt + audioBuffer.duration;
        this.sources.push(source);

        source.onended = () => {
          this.sources = this.sources.filter(candidate => candidate !== source);
        };
      } catch (err) {
        console.error('[GEMINI LIVE] Play audio error:', err);
      }
    }

    handleServerMessage(message) {
      if (message.setupComplete) {
        console.log('[GEMINI LIVE] Setup handshake confirmed by server.');
        if (this._setupResolve) {
          this._setupResolve();
          this._setupResolve = null;
        }
        return;
      }

      if (message.error) {
        console.error('[GEMINI LIVE] Server error message:', message.error);
        if (this._setupReject) {
          this._setupReject(new Error(message.error.message || 'Gemini Live setup rejected'));
          this._setupReject = null;
        }
        if (this.callbacks.onError) {
          this.callbacks.onError(new Error(message.error.message || 'Gemini error'));
        }
        return;
      }

      const content = message.serverContent;
      if (!content) return;

      // Real-time server-side voice activity interruption
      if (content.interrupted) {
        console.log('[GEMINI LIVE] Interruption detected! Pausing tutor playback.');
        this.stopPlayback();
      }

      // Input transcription (student speech)
      const inputText = content.inputTranscription?.text || content.interimInputTranscription?.text;
      if (inputText) {
        this.currentInputText += inputText;
        if (this.callbacks.onTranscript) {
          this.callbacks.onTranscript({
            role: 'student',
            text: this.currentInputText,
            isInterim: !content.turnComplete
          });
        }
      }

      // Output transcription (tutor speech)
      const outputText = content.outputTranscription?.text;
      if (outputText) {
        this.currentOutputText += outputText;
        if (this.callbacks.onTranscript) {
          this.callbacks.onTranscript({
            role: 'tutor',
            text: this.currentOutputText,
            isInterim: !content.turnComplete
          });
        }
      }

      // Turn Complete
      if (content.turnComplete) {
        if (this.callbacks.onTurnComplete) {
          this.callbacks.onTurnComplete({
            studentText: this.currentInputText,
            tutorText: this.currentOutputText
          });
        }
        this.currentInputText = '';
        this.currentOutputText = '';
      }

      // Play audio model turn
      for (const part of content.modelTurn?.parts || []) {
        if (part.inlineData?.data) {
          this.playAudioChunk(part.inlineData.data);
        }
      }
    }

    async startSession({
      questionId,
      questionText = '',
      solutionText = '',
      chapterName = '',
      topic = '',
      teachingPlan = null,
      apiBaseUrl = '',
      callbacks = {}
    }) {
      if (this.isSessionActive()) {
        this.stopSession();
      }

      this.activeQuestionId = questionId;
      this.activeQuestionData = { questionId, questionText, solutionText, chapterName, topic, teachingPlan };
      this.callbacks = callbacks;
      this.status = 'CONNECTING';
      if (this.callbacks.onStatusChange) this.callbacks.onStatusChange('CONNECTING');

      try {
        // 1. Fetch ephemeral auth token from backend
        const tokenRes = await fetch(`${apiBaseUrl}/api/voice-tutor/gemini-live-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!tokenRes.ok) {
          const errData = await tokenRes.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${tokenRes.status}`);
        }

        const { token, model, wsUrl } = await tokenRes.json();
        const liveWsUrl = wsUrl || `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`;

        // 2. Setup Unified AudioContext (Native hardware rate to avoid sample rate mismatch)
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx({ latencyHint: 'interactive' });
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        // Setup Output Nodes
        this.outputGain = this.audioContext.createGain();
        this.outputAnalyser = this.audioContext.createAnalyser();
        this.outputAnalyser.fftSize = 256;
        this.outputGain.connect(this.outputAnalyser);
        this.outputAnalyser.connect(this.audioContext.destination);

        // Setup Microphone Stream
        this.inputStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.inputStream);
        this.inputAnalyser = this.audioContext.createAnalyser();
        this.inputAnalyser.fftSize = 256;
        this.mediaStreamSource.connect(this.inputAnalyser);

        // Setup Audio Processor
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        this.mediaStreamSource.connect(this.processor);

        // Connect processor to zero-gain mute node to ensure continuous execution without feedback
        this.muteGain = this.audioContext.createGain();
        this.muteGain.gain.value = 0;
        this.processor.connect(this.muteGain);
        this.muteGain.connect(this.audioContext.destination);

        this.isStreamingVoice = false;
        this.lastVoiceAt = 0;
        this.preAudioBuffer = [];

        this.processor.onaudioprocess = (event) => {
          if (this.socket?.readyState !== WebSocket.OPEN) return;
          const rawSamples = event.inputBuffer.getChannelData(0);

          // Audio energy check for client VAD on raw input
          let energy = 0;
          for (let i = 0; i < rawSamples.length; i++) {
            energy += rawSamples[i] * rawSamples[i];
          }
          const rms = Math.sqrt(energy / rawSamples.length);
          const isVoice = rms > 0.016;
          const now = performance.now();

          // Resample to 16000Hz PCM for Gemini Live
          const samples16k = downsampleTo16000(rawSamples, this.audioContext.sampleRate);
          const pcmBytes = floatToPcm16(samples16k);
          const base64Chunk = bytesToBase64(pcmBytes);

          if (isVoice) {
            // Student started speaking or is actively speaking
            if (!this.isStreamingVoice) {
              this.isStreamingVoice = true;
              // Flush pre-buffer so first syllables are never clipped
              while (this.preAudioBuffer.length > 0) {
                const preChunk = this.preAudioBuffer.shift();
                this.socket.send(JSON.stringify({
                  realtimeInput: {
                    audio: {
                      data: preChunk,
                      mimeType: 'audio/pcm;rate=16000'
                    }
                  }
                }));
              }
            }
            this.lastVoiceAt = now;

            // Stream active voice chunk
            this.socket.send(JSON.stringify({
              realtimeInput: {
                audio: {
                  data: base64Chunk,
                  mimeType: 'audio/pcm;rate=16000'
                }
              }
            }));
          } else if (this.isStreamingVoice) {
            // Silence detected after active voice
            if ((now - this.lastVoiceAt) <= 350) {
              // Within conversational grace window (inter-word pause)
              this.socket.send(JSON.stringify({
                realtimeInput: {
                  audio: {
                    data: base64Chunk,
                    mimeType: 'audio/pcm;rate=16000'
                  }
                }
              }));
            } else {
              // Pause has exceeded 350ms: speech turn is finished!
              this.isStreamingVoice = false;
              this.socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
            }
          } else {
            // Continuous idle silence: retain last 2 chunks (~250ms) in ring buffer for natural onset padding
            this.preAudioBuffer.push(base64Chunk);
            if (this.preAudioBuffer.length > 2) {
              this.preAudioBuffer.shift();
            }
          }
        };

        // 3. Open WebSocket
        const socket = new WebSocket(liveWsUrl);
        this.socket = socket;

        const setupPromise = new Promise((resolve, reject) => {
          this._setupResolve = resolve;
          this._setupReject = reject;
        });

        socket.onopen = () => {
          console.log('[GEMINI LIVE] WebSocket opened, dispatching setup configuration...');
          const systemPrompt = `You are Dr. Vikram Sharma, a premier Indian school faculty mentor (top Delhi/Kota senior faculty) teaching a student live in front of an interactive classroom smartboard.
Pedagogical Rules:
1. Teach like a real human teacher standing in front of a whiteboard:
   - Start naturally: "Dekho beta, look at this question... Pehle question ko dhyan se samajhte hain."
   - Refer to the smartboard visual elements: "Left side board par humne iska problem statement aur visual diagram draw kiya hai... Incline angle aur rolling condition note karo."
   - Guide the solution steps: "Ab right side board par Step 1 note karo... governing formula apply karte hain... Step 2 mein values substitute karke solve karte hain... Aur yeh raha final answer!"
2. Tone: Warm, energetic, encouraging, natural Hinglish (smooth mix of conversational Hindi and clear English, using natural phrases like 'Dekho bacho', 'Dhyan se samjho', 'Chalo board par note karte hain').
3. Keep spoken explanation crisp, intuitive, and concise (around 4 to 5 spoken sentences) so the student absorbs each step without cognitive overload.
4. Real-time full-duplex interruption: Whenever the student speaks or asks a doubt (e.g. 'Sir, minus sign kyu aaya?' or 'Why friction?'), pause immediately, say 'Haan beta, bilkul sahi doubt pucha...', explain the exact reason clearly, and encourage them!
5. When the student switches to a new question, warmly transition and teach the new question with the whiteboard.`;

          const setupMsg = {
            setup: {
              model: model || 'models/gemini-2.5-flash-native-audio-latest',
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
                parts: [{ text: systemPrompt }]
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

          socket.send(JSON.stringify(setupMsg));
        };

        socket.onmessage = async (event) => {
          try {
            const msg = await parseSocketMessage(event.data);
            this.handleServerMessage(msg);
          } catch (err) {
            console.error('[GEMINI LIVE] Message parse error:', err);
          }
        };

        socket.onerror = (err) => {
          console.error('[GEMINI LIVE] Socket error:', err);
          if (this.callbacks.onError) this.callbacks.onError(err);
        };

        socket.onclose = (event) => {
          console.log(`[GEMINI LIVE] Socket closed (code ${event.code})`);
          if (this.status !== 'DISCONNECTED') {
            this.stopSession();
          }
        };

        // 4. Await setupComplete handshake
        await setupPromise;

        // 5. Visualizer level reporting loop
        const inputData = new Uint8Array(this.inputAnalyser.frequencyBinCount);
        const outputData = new Uint8Array(this.outputAnalyser.frequencyBinCount);
        let lastReportAt = 0;

        const reportLevels = () => {
          if (!this.isSessionActive()) return;
          if (this.inputAnalyser) this.inputAnalyser.getByteTimeDomainData(inputData);
          if (this.outputAnalyser) this.outputAnalyser.getByteTimeDomainData(outputData);

          const calcRms = (data) => {
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              const val = (data[i] - 128) / 128;
              sum += val * val;
            }
            return Math.min(1, Math.sqrt(sum / data.length) * 3.5);
          };

          const now = performance.now();
          if (now - lastReportAt >= 33) {
            if (this.callbacks.onAudioLevel) {
              this.callbacks.onAudioLevel(calcRms(inputData), calcRms(outputData));
            }
            lastReportAt = now;
          }
          this.levelAnimationId = requestAnimationFrame(reportLevels);
        };
        this.levelAnimationId = requestAnimationFrame(reportLevels);

        this.status = 'CONNECTED';
        if (this.callbacks.onStatusChange) this.callbacks.onStatusChange('CONNECTED');

        // 6. Give the current question as the role of user asking it
        const cleanQ = (questionText || '')
          .replace(/\$+/g, '')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
          .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
          .trim();

        let boardContext = '';
        if (teachingPlan && teachingPlan.solution) {
          const s1 = teachingPlan.solution.step1 || {};
          const s2 = teachingPlan.solution.step2 || {};
          const s3 = teachingPlan.solution.step3 || {};
          const diagTitle = teachingPlan.diagram?.title || 'Physical System Schematic';
          const tip = teachingPlan.examTip || 'Verify unit dimensions and boundary conditions';

          boardContext = `
The interactive classroom smartboard is synchronized and already displays:
[LEFT BOARD]:
- Question Statement & Analysis (${teachingPlan.questionHeader?.chapter || chapterName || 'Senior Secondary STEM'})
- Visual Schematic: ${diagTitle} (Teacher Note: "${teachingPlan.diagram?.spokenScript || 'Observe physical system forces and axes'}")
- Teacher Exam Tip: "${tip}"

[RIGHT BOARD]:
- Card 1: ${s1.title} -> ${s1.formula}
  Board Explanation: ${s1.explanation}
  Teacher Script: "${s1.spokenScript || s1.teacherNote || ''}"
- Card 2: ${s2.title} -> ${s2.formula}
  Board Explanation: ${s2.explanation}
  Teacher Script: "${s2.spokenScript || s2.teacherNote || ''}"
- Card 3: ${s3.title} -> ${s3.formula}
  Board Explanation: ${s3.explanation}
  Teacher Script: "${s3.spokenScript || s3.teacherNote || ''}"
`;
        }

        const userPrompt = `Question to teach and solve: "${cleanQ}"\n${boardContext}
Sir, please teach me this live in front of the smartboard like a real teacher in warm, encouraging Kota/Delhi faculty Hinglish.
Give appropriate time to explain each concept progressively:
1. First, point to the Left Board Diagram and explain the physical setup and given variables (~7 seconds).
2. Then transition to Step 1 on the Right Board: explain the governing law and formula (~8 seconds).
3. Then transition to Step 2: walk through the algebraic substitution step-by-step (~10 seconds).
4. Finally conclude with Step 3: state the verified final answer and golden exam tip (~8 seconds).
Make sure what you speak matches the exact concepts shown on my board!`;

        this.sendUserText(userPrompt, cleanQ);

        return true;
      } catch (err) {
        console.error('[GEMINI LIVE] Failed to start live session:', err);
        this.stopSession();
        if (this.callbacks.onError) this.callbacks.onError(err);
        throw err;
      }
    }

    updateTeachingPlan(plan) {
      if (this.activeQuestionData) {
        this.activeQuestionData.teachingPlan = plan;
      }
    }

    switchToQuestion({
      questionId,
      questionText = '',
      solutionText = '',
      chapterName = '',
      topic = '',
      teachingPlan = null
    }) {
      if (!this.isSessionActive()) return false;
      this.activeQuestionId = questionId;
      this.activeQuestionData = { questionId, questionText, solutionText, chapterName, topic, teachingPlan };

      // Stop any audio playing for the previous question
      this.stopPlayback();

      const cleanQ = (questionText || '')
        .replace(/\$+/g, '')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
        .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
        .trim();

      let boardContext = '';
      if (teachingPlan && teachingPlan.solution) {
        const s1 = teachingPlan.solution.step1 || {};
        const s2 = teachingPlan.solution.step2 || {};
        const s3 = teachingPlan.solution.step3 || {};
        const diagTitle = teachingPlan.diagram?.title || 'Physical System Schematic';
        const tip = teachingPlan.examTip || 'Verify unit dimensions and boundary conditions';

        boardContext = `
The interactive smartboard is synchronized and displays:
[LEFT BOARD]:
- Visual Schematic: ${diagTitle} (Teacher Note: "${teachingPlan.diagram?.spokenScript || ''}")
- Teacher Exam Tip: "${tip}"

[RIGHT BOARD]:
- Card 1: ${s1.title} -> ${s1.formula}
  Board Explanation: ${s1.explanation}
  Teacher Script: "${s1.spokenScript || s1.teacherNote || ''}"
- Card 2: ${s2.title} -> ${s2.formula}
  Board Explanation: ${s2.explanation}
  Teacher Script: "${s2.spokenScript || s2.teacherNote || ''}"
- Card 3: ${s3.title} -> ${s3.formula}
  Board Explanation: ${s3.explanation}
  Teacher Script: "${s3.spokenScript || s3.teacherNote || ''}"
`;
      }

      const nextQuestionPrompt = `Moving to next question: "${cleanQ}"\n${boardContext}
Sir, please teach me this new question on the smartboard step-by-step in friendly Hinglish matching what is written on the board. Give appropriate time to explain the diagram first, then Step 1, Step 2, and Step 3!`;
      this.sendUserText(nextQuestionPrompt, cleanQ);

      if (this.callbacks.onQuestionSwitched) {
        this.callbacks.onQuestionSwitched(questionId);
      }
      return true;
    }

    sendUserText(text, displayText = null) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        throw new Error('Gemini Live session is not active');
      }
      this.stopPlayback();
      if (this.callbacks.onTranscript) {
        this.callbacks.onTranscript({
          role: 'student',
          text: displayText || text,
          isInterim: false
        });
      }
      this.socket.send(JSON.stringify({
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{ text }]
          }],
          turnComplete: true
        }
      }));
    }

    commitTurn() {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.isStreamingVoice = false;
        this.socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      }
    }

    interrupt() {
      this.stopPlayback();
    }

    mute(isMuted) {
      if (this.outputGain) {
        this.outputGain.gain.value = isMuted ? 0 : 1;
      }
    }

    stopSession() {
      this.stopPlayback();
      this.isStreamingVoice = false;
      this.preAudioBuffer = [];
      if (this.levelAnimationId) {
        cancelAnimationFrame(this.levelAnimationId);
        this.levelAnimationId = null;
      }
      if (this.processor) {
        try { this.processor.disconnect(); } catch (e) {}
        this.processor = null;
      }
      if (this.muteGain) {
        try { this.muteGain.disconnect(); } catch (e) {}
        this.muteGain = null;
      }
      if (this.mediaStreamSource) {
        try { this.mediaStreamSource.disconnect(); } catch (e) {}
        this.mediaStreamSource = null;
      }
      if (this.inputStream) {
        this.inputStream.getTracks().forEach(track => track.stop());
        this.inputStream = null;
      }
      if (this.socket) {
        try { this.socket.close(); } catch (e) {}
        this.socket = null;
      }

      this.status = 'DISCONNECTED';
      const prevQId = this.activeQuestionId;
      this.activeQuestionId = null;
      this.activeQuestionData = null;

      if (this.callbacks.onStatusChange) {
        this.callbacks.onStatusChange('DISCONNECTED', prevQId);
      }
    }
  }

  // Expose global singleton
  window.geminiLiveVoiceTutor = new GeminiLiveVoiceTutorEngine();
})(typeof window !== 'undefined' ? window : this);
