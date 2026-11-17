/* =============================================================================
   LIVE TUTOR CLIENT (2026-11-17)
   Talks to Gemini Live (native audio) for the Study Board's voice teacher.
   - The backend (/api/tutor/live-session) returns a short-lived WebSocket URL
     and the full session setup (teacher instructions, language, voice, tools).
   - Teacher's voice: 24 kHz PCM, played gap-free through Web Audio.
   - Student's voice (optional, "Speak"): 16 kHz PCM; speaking while the
     teacher talks cuts the teacher off at once (barge-in).
   - Board tools (show_diagram, write_on_board, continue_lesson) are passed to
     the page through onTool and answered automatically.
   Usage: var t = new LiveTutor({ onState, onTranscript, onTool, onTurnComplete,
          onInterrupted, onSpeaking, onError }); await t.start(body); t.say(text);
   ========================================================================== */
(function (global) {
  'use strict';

  function bytesToBase64(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.byteLength; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 0x8000, bytes.byteLength)));
    return btoa(binary);
  }
  function floatToPcm16(input) {
    var out = new Int16Array(input.length);
    for (var i = 0; i < input.length; i++) { var s = Math.max(-1, Math.min(1, input[i])); out[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
    return new Uint8Array(out.buffer);
  }
  function downsample(input, rate) {
    if (rate === 16000) return input;
    var ratio = rate / 16000;
    var out = new Float32Array(Math.round(input.length / ratio));
    var pos = 0;
    for (var i = 0; i < out.length; i++) {
      var next = Math.round((i + 1) * ratio);
      var sum = 0, n = 0;
      for (var j = pos; j < next && j < input.length; j++) { sum += input[j]; n++; }
      out[i] = n ? sum / n : 0;
      pos = next;
    }
    return out;
  }
  function parse(data) {
    if (typeof data === 'string') return Promise.resolve(JSON.parse(data));
    if (data instanceof Blob) return data.text().then(JSON.parse);
    return Promise.resolve(JSON.parse(new TextDecoder().decode(data)));
  }

  function LiveTutor(cb) {
    this.cb = cb || {};
    this.ws = null;
    this.ctx = null;
    this.gain = null;
    this.sources = [];
    this.playEnd = 0;
    this.state = 'idle'; // idle | connecting | ready | closed
    this.mic = null;
    this.muted = false; // drop teacher audio until the current turn ends (after a local interruption)
    this.outText = '';
    this.inText = '';
    this.speakingTimer = null;
  }

  LiveTutor.prototype.emit = function (name) {
    var fn = this.cb[name];
    if (typeof fn === 'function') { try { return fn.apply(null, Array.prototype.slice.call(arguments, 1)); } catch (e) { if (global.console) console.error('[LIVE TUTOR] ' + name + ' failed', e); } }
    return undefined;
  };
  LiveTutor.prototype.setState = function (s) { this.state = s; this.emit('onState', s); };

  LiveTutor.prototype.start = function (body) {
    var self = this;
    if (this.state === 'ready' || this.state === 'connecting') return Promise.resolve();
    this.setState('connecting');
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new AC({ latencyHint: 'interactive' });
    var resume = this.ctx.state === 'suspended' ? this.ctx.resume() : Promise.resolve();
    var base = typeof global.getApiBaseUrl === 'function' ? global.getApiBaseUrl() : '';
    return resume.then(function () {
      self.gain = self.ctx.createGain();
      self.gain.connect(self.ctx.destination);
      return fetch(base + '/api/tutor/live-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        if (!r.ok || !b.success) throw new Error(b.error || ('The voice teacher could not start (' + r.status + ').'));
        return b;
      });
    }).then(function (b) {
      return new Promise(function (resolve, reject) {
        var ws;
        try { ws = new WebSocket(b.wsUrl); } catch (e) { reject(new Error('Could not connect to the voice service.')); return; }
        self.ws = ws;
        var settled = false;
        var timer = setTimeout(function () { if (!settled) { settled = true; reject(new Error('The voice service did not answer in time.')); try { ws.close(); } catch (e) { /* ignore */ } } }, 15000);
        ws.onopen = function () { ws.send(JSON.stringify({ setup: b.setup })); };
        ws.onmessage = function (ev) {
          parse(ev.data).then(function (msg) {
            if (msg.setupComplete && !settled) { settled = true; clearTimeout(timer); self.setState('ready'); resolve(); return; }
            self.handle(msg);
          }).catch(function () { /* ignore bad frames */ });
        };
        ws.onerror = function () { if (!settled) { settled = true; clearTimeout(timer); reject(new Error('The voice service connection failed.')); } };
        ws.onclose = function (ev) {
          clearTimeout(timer);
          if (!settled) { settled = true; reject(new Error('The voice service closed the connection' + (ev.reason ? ': ' + ev.reason : '.'))); }
          self.stopAudio();
          self.micOff();
          if (self.state !== 'closed') { self.setState('closed'); self.emit('onClosed', ev.reason || ''); }
        };
      });
    }).catch(function (err) {
      self.setState('idle');
      throw err;
    });
  };

  LiveTutor.prototype.handle = function (msg) {
    var self = this;
    if (msg.error) { this.emit('onError', new Error(msg.error.message || 'Voice service error')); return; }
    if (msg.toolCall && msg.toolCall.functionCalls) {
      var responses = msg.toolCall.functionCalls.map(function (call) {
        var result = self.emit('onTool', call.name, call.args || {});
        return { id: call.id, name: call.name, response: { result: result === undefined ? 'done' : result } };
      });
      this.send({ toolResponse: { functionResponses: responses } });
      return;
    }
    var c = msg.serverContent;
    if (!c) return;
    if (this.skipOld) {
      // The student asked something while the teacher was talking: the rest of that old answer is dropped.
      if (c.interrupted || c.turnComplete) { this.skipOld = false; clearTimeout(this.skipTimer); this.turnActive = false; this.outText = ''; }
      return;
    }
    if ((c.modelTurn && c.modelTurn.parts) || c.outputTranscription) this.turnActive = true;
    if (c.interrupted) {
      this.turnActive = false;
      this.stopAudio();
      this.duck(false);
      this.outText = '';
      this.emit('onInterrupted');
    }
    var input = (c.inputTranscription && c.inputTranscription.text) || '';
    if (input) {
      this.inText += input;
      this.emit('onTranscript', 'student', this.inText, false);
    }
    var output = (c.outputTranscription && c.outputTranscription.text) || '';
    if (output && !this.muted) {
      this.outText += output;
      this.emit('onTranscript', 'teacher', this.outText, false);
    }
    ((c.modelTurn && c.modelTurn.parts) || []).forEach(function (p) {
      if (p.inlineData && p.inlineData.data && !self.muted) self.play(p.inlineData.data);
    });
    if (c.turnComplete) {
      this.turnActive = false;
      var said = this.outText;
      var heard = this.inText;
      this.outText = '';
      this.inText = '';
      this.muted = false;
      if (this.ducked) this.duck(false);
      if (heard) this.emit('onTranscript', 'student', heard, true);
      if (said) this.emit('onTranscript', 'teacher', said, true);
      // Report the end of the turn when the voice has actually finished playing.
      var wait = Math.max(0, (this.playEnd - (this.ctx ? this.ctx.currentTime : 0)) * 1000);
      setTimeout(function () { self.emit('onTurnComplete', said); }, wait + 150);
    }
  };

  LiveTutor.prototype.play = function (b64) {
    if (!this.ctx || !this.gain) return;
    var bin = atob(b64);
    var n = bin.length >> 1;
    var buf = this.ctx.createBuffer(1, n, 24000);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < n; i++) { var v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); if (v >= 0x8000) v -= 0x10000; ch[i] = v / 0x8000; }
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.gain);
    var at = Math.max(this.ctx.currentTime + 0.02, this.playEnd);
    src.start(at);
    this.playEnd = at + buf.duration;
    this.sources.push(src);
    var self = this;
    src.onended = function () { self.sources = self.sources.filter(function (s) { return s !== src; }); };
    this.speaking(true);
  };

  LiveTutor.prototype.speaking = function (on) {
    var self = this;
    clearTimeout(this.speakingTimer);
    if (on) {
      if (!this.isSpeaking) { this.isSpeaking = true; this.emit('onSpeaking', true); }
      var left = Math.max(0, (this.playEnd - this.ctx.currentTime) * 1000);
      this.speakingTimer = setTimeout(function () { self.isSpeaking = false; self.emit('onSpeaking', false); }, left + 120);
    } else if (this.isSpeaking) {
      this.isSpeaking = false;
      this.emit('onSpeaking', false);
    }
  };

  // Stops the teacher's voice now. With drop=true the rest of the current answer is skipped too.
  LiveTutor.prototype.stopAudio = function (drop) {
    this.sources.forEach(function (s) { try { s.stop(); } catch (e) { /* already ended */ } });
    this.sources = [];
    if (this.ctx) this.playEnd = this.ctx.currentTime;
    if (drop) this.muted = true;
    this.speaking(false);
  };

  // Lowers the teacher's voice while the student may be starting to talk. The server decides if it
  // really was speech (it then sends "interrupted"); if it was only noise, the voice comes back.
  LiveTutor.prototype.duck = function (on) {
    if (!this.gain || !this.ctx) return;
    this.ducked = on;
    this.gain.gain.setTargetAtTime(on ? 0.12 : 1, this.ctx.currentTime, 0.04);
  };

  LiveTutor.prototype.send = function (obj) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
  };

  // Sends a typed message (a board part to explain, or a typed doubt) as a complete turn.
  // interrupt=true: the teacher is cut off first (used for doubts asked while the teacher talks).
  LiveTutor.prototype.say = function (text, interrupt) {
    var self = this;
    if (interrupt && this.turnActive) {
      this.stopAudio();
      this.skipOld = true;
      clearTimeout(this.skipTimer);
      this.skipTimer = setTimeout(function () { self.skipOld = false; }, 3000);
    }
    this.muted = false;
    this.outText = '';
    this.inText = '';
    this.duck(false);
    this.send({ clientContent: { turns: [{ role: 'user', parts: [{ text: String(text) }] }], turnComplete: true } });
  };

  // Microphone: streams 16 kHz PCM while the student is talking (simple voice gate with pre-roll).
  LiveTutor.prototype.micOn = function () {
    var self = this;
    if (this.mic) return Promise.resolve();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('This browser cannot use the microphone.'));
    return navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (stream) {
      var src = self.ctx.createMediaStreamSource(stream);
      var proc = self.ctx.createScriptProcessor(2048, 1, 1);
      var mute = self.ctx.createGain();
      mute.gain.value = 0;
      src.connect(proc);
      proc.connect(mute);
      mute.connect(self.ctx.destination);
      var talking = false, lastVoice = 0, loud = 0, pre = [], floor = 0.004, duckTimer = null;
      proc.onaudioprocess = function (ev) {
        if (!self.ws || self.ws.readyState !== 1) return;
        var data = ev.inputBuffer.getChannelData(0);
        var e = 0;
        for (var i = 0; i < data.length; i++) e += data[i] * data[i];
        var rms = Math.sqrt(e / data.length);
        // Voice = clearly louder than the room's background noise (fans, traffic), which is tracked slowly.
        var voice = rms > Math.max(0.018, floor * 3.2);
        if (!voice) floor = floor * 0.95 + rms * 0.05; else floor = floor * 0.999 + rms * 0.001;
        var chunk = bytesToBase64(floatToPcm16(downsample(data, self.ctx.sampleRate)));
        var now = performance.now();
        var msg = function (d) { return { realtimeInput: { audio: { data: d, mimeType: 'audio/pcm;rate=16000' } } }; };
        if (voice) {
          loud += 1;
          // ~120 ms of steady voice while the teacher talks: lower the teacher's voice at once.
          if (loud >= 3 && self.sources.length && !self.ducked) {
            self.duck(true);
            clearTimeout(duckTimer);
            duckTimer = setTimeout(function () { if (self.ducked) self.duck(false); }, 1600);
          }
          if (!talking) { talking = true; while (pre.length) self.send(msg(pre.shift())); self.emit('onStudentTalking', true); }
          lastVoice = now;
          self.send(msg(chunk));
        } else if (talking) {
          loud = 0;
          if (now - lastVoice < 600) self.send(msg(chunk));
          else { talking = false; self.send({ realtimeInput: { audioStreamEnd: true } }); self.emit('onStudentTalking', false); }
        } else {
          loud = 0;
          pre.push(chunk);
          if (pre.length > 4) pre.shift();
        }
      };
      self.mic = { stream: stream, src: src, proc: proc, mute: mute };
    });
  };

  LiveTutor.prototype.micOff = function () {
    if (!this.mic) return;
    try { this.mic.proc.disconnect(); this.mic.src.disconnect(); this.mic.mute.disconnect(); } catch (e) { /* ignore */ }
    this.mic.stream.getTracks().forEach(function (t) { t.stop(); });
    this.mic = null;
  };

  LiveTutor.prototype.stop = function () {
    this.micOff();
    this.stopAudio();
    this.setState('closed');
    if (this.ws) { try { this.ws.close(1000, 'done'); } catch (e) { /* ignore */ } }
    this.ws = null;
  };

  global.LiveTutor = LiveTutor;
})(window);
