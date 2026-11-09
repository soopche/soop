import {
  ARCANE_SWORD_EXPIRING_SOUND_URL,
  ARCANE_SWORD_EXPIRING_VOLUME_SCALE,
  matchVoiceSpell,
  SpellId,
} from './spells';

const SPELL_SOUND_URLS: Record<SpellId, string> = {
  incendio: '/assets/aistudio/yodguard-fire-magic-6-378641_516418a9.mp3',
  glacius:
    '/assets/aistudio/traian1984-cartoon-balloon-being-blown-up-02-186982__mp3cut.net__42b96018.mp3',
  expelliarmus:
    '/assets/aistudio/dragon-studio-lightning-strike-386161__mp3cut.net__f7f59231.mp3',
  stupefy:
    '/assets/aistudio/chrysalyn-cinematic-whoosh-transition-impact-562431__mp3cut.net__71f0bc9b.mp3',
  wingardium: '/assets/aistudio/universfield-swoosh-012-352858__mp3cut.net__9b028f3f.mp3',
  engorgio: '/assets/aistudio/yodguard-dark-magic-6-378652_d4ce77f8.mp3',
  vera_verto: '/assets/aistudio/yodguard-healing-magic-4-378668_53afd51f.mp3',
  teleport: '/assets/aistudio/floraphonic-bang-smoke-cloud-1-184061_62b8e2bb.mp3',
  campfire_teleport: '/assets/aistudio/freesound_community-soul-steal-02-43483_18447f4c.mp3',
  arcane_sword: '/assets/aistudio/yodguard-spear_thrust-1-382402_08fb73db.mp3',
  cooldown_reset:
    '/assets/aistudio/freesound_community-vibratetimeeffect4-37261__mp3cut.net__f1156262.mp3',
};

interface DecodedSpellSound {
  buffer: AudioBuffer;
  trimStartSec: number;
}

class ArcaneAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rawSpellData: Partial<Record<SpellId, ArrayBuffer>> = {};
  private decodedSpellBuffers: Partial<Record<SpellId, DecodedSpellSound>> = {};
  private decodingPromises: Partial<Record<SpellId, Promise<DecodedSpellSound | null>>> = {};
  private rawSwordExpiringData: ArrayBuffer | null = null;
  private decodedSwordExpiringBuffer: DecodedSpellSound | null = null;
  private decodingSwordExpiringPromise: Promise<DecodedSpellSound | null> | null = null;
  private activeSwordExpiringSource: AudioBufferSourceNode | null = null;
  public muted = false;
  public masterVolume = 0.85;

  constructor() {
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      // Pre-fetch all spell MP3s into memory immediately on load so there is zero network latency
      (Object.keys(SPELL_SOUND_URLS) as SpellId[]).forEach((spellId) => {
        const url = SPELL_SOUND_URLS[spellId];
        if (!url) return;
        fetch(url)
          .then((res) => (res.ok ? res.arrayBuffer() : null))
          .then((buf) => {
            if (buf) {
              this.rawSpellData[spellId] = buf;
              if (this.ctx) {
                this.decodeSpellBuffer(spellId, this.ctx);
              }
            }
          })
          .catch(() => {});
      });

      // Pre-fetch Arcane Sword 5-second expiration warning sound
      fetch(ARCANE_SWORD_EXPIRING_SOUND_URL)
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((buf) => {
          if (buf) {
            this.rawSwordExpiringData = buf;
            if (this.ctx) {
              this.decodeSwordExpiringBuffer(this.ctx);
            }
          }
        })
        .catch(() => {});
    }
  }

  /**
   * Finds the exact timestamp (in seconds) where audible sound begins in the buffer,
   * stripping any leading MP3 silence/pre-roll (up to 0.65s) so spell audio fires at 0ms.
   */
  private computeLeadingSilenceOffset(buffer: AudioBuffer): number {
    const sampleRate = buffer.sampleRate;
    const maxScanSamples = Math.min(buffer.length, Math.floor(sampleRate * 0.65));
    const threshold = 0.018;
    let firstActiveSample = maxScanSamples;

    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < maxScanSamples; i++) {
        if (Math.abs(data[i]) >= threshold) {
          if (i < firstActiveSample) {
            firstActiveSample = i;
          }
          break;
        }
      }
    }

    if (firstActiveSample >= maxScanSamples) {
      return 0;
    }
    // Step back 2ms before threshold crossing to keep the natural attack transient intact
    const safeSample = Math.max(0, firstActiveSample - Math.floor(sampleRate * 0.002));
    return safeSample / sampleRate;
  }

  private decodeSpellBuffer(spellId: SpellId, ctx: AudioContext): Promise<DecodedSpellSound | null> {
    if (this.decodedSpellBuffers[spellId]) {
      return Promise.resolve(this.decodedSpellBuffers[spellId]!);
    }
    if (this.decodingPromises[spellId]) {
      return this.decodingPromises[spellId]!;
    }
    const raw = this.rawSpellData[spellId];
    if (!raw) {
      return Promise.resolve(null);
    }
    // Slice a copy of the ArrayBuffer because decodeAudioData detaches its input buffer
    const copy = raw.slice(0);
    const promise = ctx
      .decodeAudioData(copy)
      .then((audioBuffer) => {
        const entry: DecodedSpellSound = {
          buffer: audioBuffer,
          trimStartSec: this.computeLeadingSilenceOffset(audioBuffer),
        };
        this.decodedSpellBuffers[spellId] = entry;
        return entry;
      })
      .catch(() => null);
    this.decodingPromises[spellId] = promise;
    return promise;
  }

  private decodeSwordExpiringBuffer(ctx: AudioContext): Promise<DecodedSpellSound | null> {
    if (this.decodedSwordExpiringBuffer) {
      return Promise.resolve(this.decodedSwordExpiringBuffer);
    }
    if (this.decodingSwordExpiringPromise) {
      return this.decodingSwordExpiringPromise;
    }
    if (!this.rawSwordExpiringData) {
      return Promise.resolve(null);
    }
    const copy = this.rawSwordExpiringData.slice(0);
    const promise = ctx
      .decodeAudioData(copy)
      .then((audioBuffer) => {
        const entry: DecodedSpellSound = {
          buffer: audioBuffer,
          trimStartSec: this.computeLeadingSilenceOffset(audioBuffer),
        };
        this.decodedSwordExpiringBuffer = entry;
        return entry;
      })
      .catch(() => null);
    this.decodingSwordExpiringPromise = promise;
    return promise;
  }

  private ensureContext(): { ctx: AudioContext; out: AudioNode } | null {
    if (this.muted || this.masterVolume <= 0.001) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.ctx.destination);
        // Immediately decode all pre-fetched spell buffers on the shared AudioContext
        (Object.keys(SPELL_SOUND_URLS) as SpellId[]).forEach((id) => {
          if (this.rawSpellData[id] && this.ctx) {
            this.decodeSpellBuffer(id, this.ctx);
          }
        });
        if (this.rawSwordExpiringData && this.ctx) {
          this.decodeSwordExpiringBuffer(this.ctx);
        }
      }
    }
    if (!this.ctx || !this.masterGain) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.masterGain.gain.setValueAtTime(
      this.muted ? 0 : this.masterVolume,
      this.ctx.currentTime
    );
    return { ctx: this.ctx, out: this.masterGain };
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        mute ? 0 : this.masterVolume,
        this.ctx.currentTime
      );
      if (mute && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      } else if (!mute && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.masterVolume,
        this.ctx.currentTime
      );
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  private pitchJitter(baseFreq: number): number {
    return baseFreq * (0.95 + Math.random() * 0.1);
  }

  public playSpellCast(spellId: SpellId, qualityPercent = 90) {
    if (this.muted) return;
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;

    const decoded = this.decodedSpellBuffers[spellId];
    if (decoded) {
      const source = ctx.createBufferSource();
      source.buffer = decoded.buffer;
      source.playbackRate.setValueAtTime(0.96 + Math.random() * 0.08, now);

      const gain = ctx.createGain();
      const vol = Math.min(0.7, Math.max(0.28, 0.42 + (qualityPercent / 100) * 0.22));
      gain.gain.setValueAtTime(vol, now);

      source.connect(gain);
      gain.connect(out);
      source.onended = () => {
        gain.disconnect();
      };
      // Start immediately at `now` skipping any leading silence in the MP3!
      source.start(now, decoded.trimStartSec);
      return;
    }

    // If raw data arrived but hasn't finished decoding yet, kick off decode for next cast
    // and play instant zero-latency Web Audio synth right now (never play a delayed sound 0.5s later!)
    if (this.rawSpellData[spellId]) {
      this.decodeSpellBuffer(spellId, ctx);
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseMap: Record<SpellId, number> = {
      incendio: 310,
      wingardium: 440,
      expelliarmus: 360,
      stupefy: 330,
      vera_verto: 520,
      engorgio: 380,
      glacius: 580,
      teleport: 480,
      campfire_teleport: 420,
      arcane_sword: 400,
      cooldown_reset: 500,
    };

    const base = this.pitchJitter(baseMap[spellId] || 360);
    const boost = 0.85 + (qualityPercent / 100) * 0.35;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45 * boost, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + 0.19);

    osc.connect(gain);
    gain.connect(out);

    osc.onended = () => {
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public stopArcaneSwordExpiringSound() {
    if (this.activeSwordExpiringSource) {
      try {
        this.activeSwordExpiringSource.stop();
      } catch {
        // Ignore if already stopped
      }
      this.activeSwordExpiringSource = null;
    }
  }

  /**
   * Plays the Arcane Sword 5-second remaining warning sound at 30% quieter volume (ARCANE_SWORD_EXPIRING_VOLUME_SCALE = 0.7).
   */
  public playArcaneSwordExpiringSound() {
    if (this.muted) return;
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;

    this.stopArcaneSwordExpiringSound();

    const startPlayback = (decoded: DecodedSpellSound) => {
      if (this.muted) return;
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      source.buffer = decoded.buffer;

      const gain = ctx.createGain();
      // 30% quieter than normal / reference volume (0.62 * 0.7 = 0.434)
      const vol = 0.62 * ARCANE_SWORD_EXPIRING_VOLUME_SCALE;
      gain.gain.setValueAtTime(vol, now);

      source.connect(gain);
      gain.connect(out);
      this.activeSwordExpiringSource = source;
      source.onended = () => {
        if (this.activeSwordExpiringSource === source) {
          this.activeSwordExpiringSource = null;
        }
        gain.disconnect();
      };
      source.start(now, decoded.trimStartSec);
    };

    if (this.decodedSwordExpiringBuffer) {
      startPlayback(this.decodedSwordExpiringBuffer);
      return;
    }

    if (this.rawSwordExpiringData) {
      this.decodeSwordExpiringBuffer(ctx).then((decoded) => {
        if (decoded) {
          startPlayback(decoded);
        }
      });
    }
  }

  public playPetImpact(isKill = false) {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = this.pitchJitter(isKill ? 310 : 260);
    const dur = 0.055;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + dur);

    // Very quiet and simple blip for pet attacks so it never distracts
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.linearRampToValueAtTime(0, now + dur);

    osc.connect(gain);
    gain.connect(out);
    osc.onended = () => {
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + dur + 0.005);
  }

  public playHeavyImpact(isKill = false) {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const startFreq = this.pitchJitter(isKill ? 220 : 180);
    const dur = isKill ? 0.2 : 0.14;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + dur);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + dur);

    osc.connect(gain);
    gain.connect(out);
    osc.onended = () => {
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  public playPickupChime() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.pitchJitter(freq), now + idx * 0.05);
      gain.gain.setValueAtTime(0.08, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0, now + idx * 0.05 + 0.14);
      osc.connect(gain);
      gain.connect(out);
      osc.onended = () => {
        gain.disconnect();
      };
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  }

  public playCatPurrMeow() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.22);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
    gain.gain.linearRampToValueAtTime(0, now + 0.23);
    osc.connect(gain);
    gain.connect(out);
    osc.onended = () => {
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playEnemyTelegraph() {
    // Intentionally silent: avoids continuous background humming when multiple enemies/totems are active
  }

  public playPlayerHurt() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.16);
    osc.connect(gain);
    gain.connect(out);
    osc.onended = () => {
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playVictoryFanfare() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;
    const chord = [440, 554.37, 659.25];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.09, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(out);
      osc.onended = () => {
        gain.disconnect();
      };
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.29);
    });
  }

  public playDefeatSting() {
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;
    const notes = [330, 261.63, 196];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);
      gain.gain.setValueAtTime(0.09, now + i * 0.11);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.11 + 0.24);
      osc.connect(gain);
      gain.connect(out);
      osc.onended = () => {
        gain.disconnect();
      };
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.25);
    });
  }
}

export const audioEngine = new ArcaneAudioEngine();

export interface VoiceRecognitionCallbacks {
  onSpellRecognized: (spellId: SpellId, transcript: string, quality: number) => void;
  onTranscriptUpdate: (transcript: string) => void;
  onStatusChange: (listening: boolean, supported: boolean, error?: string) => void;
}

/**
 * Push-To-Talk Voice Spell Recognizer:
 * Never listens continuously in the background! Only opens microphone when the player holds/presses Push-To-Talk [V].
 */
export class VoiceSpellRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private isListening = false;
  private callbacks: VoiceRecognitionCallbacks;
  private hasDispatchedThisSession = false;

  constructor(callbacks: VoiceRecognitionCallbacks) {
    this.callbacks = callbacks;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  public startPushToTalk() {
    if (typeof window === 'undefined') return;
    const w = window as unknown as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (w.SpeechRecognition || w.webkitSpeechRecognition) as any;
    if (!SpeechRec) {
      this.callbacks.onStatusChange(false, false, 'Web Speech API недоступен');
      return;
    }

    if (this.isListening) return;
    this.hasDispatchedThisSession = false;

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = 'ru-RU';
      // Push-To-Talk: single utterance mode so mic turns off after speaking
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onStatusChange(true, true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onresult = (event: any) => {
        if (this.hasDispatchedThisSession) return;
        let latestTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          latestTranscript += transcript + ' ';
          const matched = matchVoiceSpell(transcript);
          if (matched.spellId) {
            this.hasDispatchedThisSession = true;
            this.callbacks.onSpellRecognized(
              matched.spellId,
              transcript.trim(),
              matched.voiceQuality
            );
            this.stop();
            return;
          }
        }
        if (latestTranscript.trim()) {
          this.callbacks.onTranscriptUpdate(latestTranscript.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onerror = (event: any) => {
        const errCode = String(event?.error || '');
        this.isListening = false;
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          this.callbacks.onStatusChange(
            false,
            true,
            'Микрофон заблокирован браузером — используйте кнопки слов'
          );
        } else {
          this.callbacks.onStatusChange(false, true);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onStatusChange(false, true);
      };

      this.recognition.start();
    } catch {
      this.isListening = false;
      this.callbacks.onStatusChange(false, true, 'Не удалось включить микрофон');
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.callbacks.onStatusChange(false, this.isSupported());
  }
}
