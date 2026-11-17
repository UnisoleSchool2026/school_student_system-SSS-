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
      this.currentSpokenPhase = -1;
      this.recentSpokenWindow = '';
      this.voiceFramesCount = 0;
      this.requestedVoice = null;
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
        this.detectAndSyncPedagogicalPhase(outputText);
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
        this.recentSpokenWindow = '';
      }

      // Play audio model turn
      for (const part of content.modelTurn?.parts || []) {
        if (part.inlineData?.data) {
          this.playAudioChunk(part.inlineData.data);
        }
      }
    }

    detectAndSyncPedagogicalPhase(newChunk) {
      if (!newChunk) return;
      this.recentSpokenWindow = ((this.recentSpokenWindow || '') + ' ' + newChunk).slice(-350);

      const win = this.recentSpokenWindow.toLowerCase();
      let detectedPhase = -1;

      // Phase 3: Final evaluated answer, takeaway & exam tip
      if (/(?:step\s*(?:3|three|teesra)|final\s*(?:answer|result|value|solution)|answer\s*note\s*karo|exam\s*tip|conclu(?:de|sion)|golden\s*tip|takeaway)/i.test(win)) {
        detectedPhase = 3;
      }
      // Phase 2: Step 2, values substitution & step-by-step calculation
      else if (/(?:step\s*(?:2|two|doosra)|substitut(?:e|ing|ion)|value\s*(?:put|substitute|rakh)|calculat(?:e|ing|ion)|derivation|simplif(?:y|ying)|solve\s*karte\s*hain)/i.test(win)) {
        detectedPhase = 2;
      }
      // Phase 1: Step 1, governing law, formula, core principle
      else if (/(?:step\s*(?:1|one|pehla)|governing\s*(?:law|formula|principle)|formula\s*apply|primary\s*law|pehla\s*step|basic\s*formula|equation\s*note)/i.test(win)) {
        detectedPhase = 1;
      }
      // Phase 0: Visual diagram, schematic, given variables setup
      else if (/(?:diagram|left\s*(?:side|board|panel)|figure|schematic|given\s*(?:values?|parameters?)|pehle\s*(?:diagram|visual|dekho)|observe\s*karo)/i.test(win)) {
        detectedPhase = 0;
      }

      if (detectedPhase !== -1 && detectedPhase !== this.currentSpokenPhase) {
        this.currentSpokenPhase = detectedPhase;
        const phaseNames = [
          'Visual Concept Model & Setup',
          'Governing Principles & Primary Law',
          'Derivation & Step-by-Step Working',
          'Evaluated Solution & Takeaway'
        ];
        console.log(`[GEMINI LIVE SYNC] Smartboard phase synced to Concept ${detectedPhase} (${phaseNames[detectedPhase]})`);
        if (this.callbacks.onPhaseChange) {
          this.callbacks.onPhaseChange(detectedPhase, phaseNames[detectedPhase]);
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
      facultyName = '',
      subjectName = '',
      voice = null,
      apiBaseUrl = '',
      callbacks = {}
    }) {
      if (this.isSessionActive()) {
        this.stopSession();
      }

      this.activeQuestionId = questionId;
      this.facultyName = facultyName || teachingPlan?.teacherName || 'Faculty Mentor';
      this.subjectName = subjectName || teachingPlan?.subject || 'Senior Secondary STEM';
      this.requestedVoice = voice || null;
      this.activeQuestionData = { questionId, questionText, solutionText, chapterName, topic, teachingPlan, facultyName: this.facultyName, subjectName: this.subjectName };
      this.callbacks = Object.assign({}, this.callbacks, callbacks);
      this.status = 'CONNECTING';
      if (this.callbacks.onStatusChange) this.callbacks.onStatusChange('CONNECTING');

      try {
        const resolvedBase = (apiBaseUrl || (typeof window !== 'undefined' && typeof window.getHapsApiBaseUrl === 'function' ? window.getHapsApiBaseUrl() : '')).replace(/\/+$/, '');
        // 1. Fetch ephemeral auth token from backend
        const tokenRes = await fetch(`${resolvedBase}/api/voice-tutor/gemini-live-token`, {
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

        // Setup Audio Processor with low-latency 2048 buffer
        this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
        this.mediaStreamSource.connect(this.processor);

        // Connect processor to zero-gain mute node to ensure continuous execution without feedback
        this.muteGain = this.audioContext.createGain();
        this.muteGain.gain.value = 0;
        this.processor.connect(this.muteGain);
        this.muteGain.connect(this.audioContext.destination);

        this.isStreamingVoice = false;
        this.lastVoiceAt = 0;
        this.voiceFramesCount = 0;
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
            this.voiceFramesCount = (this.voiceFramesCount || 0) + 1;
            // Immediate local barge-in if student speaks while tutor is actively playing
            if (this.voiceFramesCount >= 2 && this.sources.length > 0) {
              console.log('[GEMINI LIVE] Local barge-in detected! Halting tutor audio immediately.');
              this.stopPlayback();
            }

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
            this.voiceFramesCount = 0;
            // Silence detected after active voice
            if ((now - this.lastVoiceAt) <= 450) {
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
              // Pause has exceeded 450ms: speech turn is finished!
              this.isStreamingVoice = false;
              this.socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
            }
          } else {
            this.voiceFramesCount = 0;
            // Continuous idle silence: retain last 3 chunks in ring buffer for natural onset padding
            this.preAudioBuffer.push(base64Chunk);
            if (this.preAudioBuffer.length > 3) {
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
          const teacherName = this.facultyName || 'Faculty Mentor';
          const subjName = this.subjectName || 'STEM';
          const diagDesc = teachingPlan?.diagram?.title || 'System Visual Schematic';
          const diagSpoken = teachingPlan?.diagram?.spokenScript || `Dekho beta, left side board par humne visual diagram draw kiya hai... ${diagDesc} observe karo.`;

          const femaleFacultyNames = ['Sunita', 'Ananya', 'Meenakshi', 'Pooja', 'Riya', 'Kavya', 'Simran', 'Tanvi', 'Suhani'];
          const isFemaleFaculty = femaleFacultyNames.some(f => teacherName.includes(f));
          const voiceName = this.requestedVoice || (isFemaleFaculty ? 'Aoede' : 'Puck');

          const systemPrompt = `You are ${teacherName}, an elite senior Indian faculty mentor (${subjName} Department) teaching a student live in front of an interactive classroom smartboard.

Pedagogical and Vocal Instructions:
1. Spoken Language & Style:
   - Speak in natural, warm, conversational Hinglish (Hindi-first Hinglish using Roman script phrases).
   - Use genuine conversational markers: "Dekho beta", "Dhyan se note karo", "Haan bilkul", "Pehle question ko achhi tarah samajhte hain", "Chalo board par note karte hain".
   - Keep answers voice-friendly, energetic, encouraging, and human.
2. Spoken Math Pronunciation:
   - NEVER read out raw LaTeX codes, symbols, or backslashes like \\frac, \\sqrt, ^, or _.
   - Speak mathematical formulas phonetically and naturally:
     - 1/f = 1/v + 1/u as "one over f equals one over v plus one over u"
     - v = u + at as "v equals u plus a t"
     - F = ma as "force equals mass into acceleration"
     - cm as "centimeters", m/s as "meters per second"
3. Classroom Smartboard Reference & Visual Diagram Grounding:
   - Phase 1: Point to and explain the exact physical diagram on the Left Board (${diagDesc}): "${diagSpoken}"
   - Phase 2: Guide Step 1 on the Right Board: "Ab right side board par Step 1 note karo... governing formula apply karte hain..."
   - Phase 3: Walk through Step 2 calculation: "Step 2 mein values substitute karke step-by-step simplify karte hain..."
   - Phase 4: Conclude with Step 3: "Aur Step 3 mein yeh raha hamara verified final answer aur golden exam tip!"
4. Concise Spoken Delivery:
   - Keep each spoken step crisp (around 3 to 4 spoken sentences) so the student absorbs each concept without cognitive overload.
5. Real-Time Interruption Handling:
   - When the student speaks or asks a doubt, pause immediately, say "Haan beta, bilkul sahi doubt pucha aapne...", explain the exact reason clearly and encouragingly in 2 to 3 sentences, and invite them back to continue!`;

          const setupMsg = {
            setup: {
              model: model || 'models/gemini-2.5-flash-native-audio-latest',
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: voiceName
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
                  prefixPaddingMs: 150,
                  silenceDurationMs: 650
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
          console.warn('[GEMINI LIVE] Socket error:', err);
          if (this._setupReject) {
            const rej = this._setupReject;
            this._setupReject = null;
            this._setupResolve = null;
            rej(err instanceof Error ? err : new Error('Gemini Live WebSocket connection failed'));
          }
          if (this.callbacks.onError) this.callbacks.onError(err);
        };

        socket.onclose = (event) => {
          console.log(`[GEMINI LIVE] Socket closed (code ${event.code})`);
          if (this._setupReject) {
            const rej = this._setupReject;
            this._setupReject = null;
            this._setupResolve = null;
            rej(new Error(`Gemini Live socket closed before setup (code ${event.code})`));
          }
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

        const subjName = this.subjectName || 'STEM';
        const userPrompt = `Question to teach and solve: "${cleanQ}"\n${boardContext}
Please teach me this live in front of the smartboard like an authentic senior ${subjName} faculty member in warm, encouraging Hinglish.
Give appropriate time to explain each concept progressively:
1. First, point to the Left Board Diagram and explain the ${subjName} setup and given variables (~7 seconds).
2. Then transition to Step 1 on the Right Board: explain the governing law and formula (~8 seconds).
3. Then transition to Step 2: walk through the substitution and calculation step-by-step (~10 seconds).
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

    highlightAndExplainStep(stepIndex) {
      if (!this.isSessionActive()) return false;
      const stepLabels = [
        'Visual Concept Diagram & Given Setup on the Left Board',
        'Step 1: Governing Principles & Core Law on the Right Board',
        'Step 2: Step-by-Step Substitution & Mathematical Derivation',
        'Step 3: Final Evaluated Answer & Strategic Exam Tip'
      ];
      const targetLabel = stepLabels[stepIndex] || `Step ${stepIndex + 1}`;
      this.currentSpokenPhase = stepIndex;

      const prompt = `Student has clicked on "${targetLabel}" on the smartboard. Please immediately explain this specific part on the board clearly and encouragingly in natural conversational Hinglish in 2 to 3 sentences.`;
      this.sendUserText(prompt, `Focusing on ${targetLabel}`);
      return true;
    }

    toggleLiveSession(options = {}) {
      if (this.isSessionActive()) {
        this.stopSession();
        return false;
      } else {
        this.startSession(options);
        return true;
      }
    }

    sendUserText(text, displayText = null) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.warn('[GEMINI LIVE] sendUserText skipped: socket not open');
        return false;
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
      this.currentSpokenPhase = -1;
      this.recentSpokenWindow = '';
      this.voiceFramesCount = 0;
      this.requestedVoice = null;
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
