import {
  ARCANE_SWORD_EXPIRING_SOUND_URL,
  ARCANE_SWORD_EXPIRING_VOLUME_SCALE,
  matchVoiceSpell,
  ReagentId,
  SpellId,
} from './spells';

// STRICT FILE ORDER MAPPING (1 to 4):
export const TREE_CHOP_SOUND_URL =
  '/assets/aistudio/alexzavesa-boards-fall-1-468371__mp3cut.net__ce1023b3.mp3';
export const HERB_PICK_SOUND_URL =
  '/assets/aistudio/universfield-funny-cartoon-cry-144756__mp3cut.net__60580c85.mp3';
export const CAMPFIRE_LOOP_SOUND_URL =
  '/assets/aistudio/dragon-studio-fire-crackling-sounds-427410_cf6be12a.mp3';
export const WALL_ACTION_SOUND_URL =
  '/assets/aistudio/dragon-studio-falling-tree-356127_f4a3367d.mp3';

type WorldSfxKey = 'tree_chop' | 'herb_pick' | 'campfire_loop' | 'wall_action';

const WORLD_SFX_URLS: Record<WorldSfxKey, string> = {
  tree_chop: TREE_CHOP_SOUND_URL,
  herb_pick: HERB_PICK_SOUND_URL,
  campfire_loop: CAMPFIRE_LOOP_SOUND_URL,
  wall_action: WALL_ACTION_SOUND_URL,
};

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

export const AUDIO_PREFS_STORAGE_KEY = 'vox_arcanum_audio_prefs_v1';

export interface AudioPrefs {
  muted: boolean;
  masterVolume: number; // 0..1
}

export function loadAudioPrefs(
  storage?: Pick<Storage, 'getItem'> | null
): AudioPrefs {
  const defaults: AudioPrefs = { muted: false, masterVolume: 0.85 };
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;
  if (!targetStorage) return defaults;

  try {
    const raw = targetStorage.getItem(AUDIO_PREFS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AudioPrefs> | null;
    if (!parsed || typeof parsed !== 'object') return defaults;
    const muted = typeof parsed.muted === 'boolean' ? parsed.muted : defaults.muted;
    const vol =
      typeof parsed.masterVolume === 'number' && Number.isFinite(parsed.masterVolume)
        ? Math.max(0, Math.min(1, parsed.masterVolume))
        : defaults.masterVolume;
    return { muted, masterVolume: vol };
  } catch {
    return defaults;
  }
}

export function saveAudioPrefs(
  prefs: AudioPrefs,
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.localStorage
      : null;
  if (!targetStorage) return;

  try {
    const safePrefs: AudioPrefs = {
      muted: Boolean(prefs.muted),
      masterVolume: Number.isFinite(prefs.masterVolume)
        ? Math.max(0, Math.min(1, Number(prefs.masterVolume.toFixed(3))))
        : 0.85,
    };
    targetStorage.setItem(AUDIO_PREFS_STORAGE_KEY, JSON.stringify(safePrefs));
  } catch {
    // Ignore storage quota errors
  }
}

interface DecodedSpellSound {
  buffer: AudioBuffer;
  trimStartSec: number;
}

export class ArcaneAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rawSpellData: Partial<Record<SpellId, ArrayBuffer>> = {};
  private decodedSpellBuffers: Partial<Record<SpellId, DecodedSpellSound>> = {};
  private decodingPromises: Partial<Record<SpellId, Promise<DecodedSpellSound | null>>> = {};
  private rawSwordExpiringData: ArrayBuffer | null = null;
  private decodedSwordExpiringBuffer: DecodedSpellSound | null = null;
  private decodingSwordExpiringPromise: Promise<DecodedSpellSound | null> | null = null;
  private activeSwordExpiringSource: AudioBufferSourceNode | null = null;
  private decodedWorldSfxBuffers: Partial<Record<WorldSfxKey, DecodedSpellSound>> = {};
  private loadingWorldSfxPromises: Partial<Record<WorldSfxKey, Promise<DecodedSpellSound | null>>> =
    {};
  private worldSfxAttempted = new Set<WorldSfxKey>();
  private campfireLoopActive = false;
  private campfireLoopSource: AudioBufferSourceNode | null = null;
  private campfireLoopGain: GainNode | null = null;
  private campfireLoopGeneration = 0;
  private lastEnemyCastSoundMs = 0;
  private lastPlayerHurtSoundMs = 0;
  public muted = false;
  public masterVolume = 0.85;

  constructor() {
    const savedPrefs = loadAudioPrefs();
    this.muted = savedPrefs.muted;
    this.masterVolume = savedPrefs.masterVolume;

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
        delete this.rawSpellData[spellId];
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
        this.rawSwordExpiringData = null;
        return entry;
      })
      .catch(() => null);
    this.decodingSwordExpiringPromise = promise;
    return promise;
  }

  /**
   * Lazily fetches and decodes a world SFX asset ONCE, strips leading silence,
   * and immediately discards the raw ArrayBuffer after decodeAudioData resolves so zero raw bytes remain in RAM.
   */
  private loadWorldSfxBuffer(
    key: WorldSfxKey,
    ctx: AudioContext
  ): Promise<DecodedSpellSound | null> {
    const existing = this.decodedWorldSfxBuffers[key];
    if (existing) {
      return Promise.resolve(existing);
    }
    const inFlight = this.loadingWorldSfxPromises[key];
    if (inFlight) {
      return inFlight;
    }
    if (this.worldSfxAttempted.has(key) || typeof fetch === 'undefined') {
      return Promise.resolve(null);
    }
    this.worldSfxAttempted.add(key);

    const url = WORLD_SFX_URLS[key];
    const promise = fetch(url)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((rawBuffer) => {
        if (!rawBuffer) return null;
        // Pass rawBuffer directly to decodeAudioData and drop any reference immediately after
        let pendingRaw: ArrayBuffer | null = rawBuffer;
        const decodePromise = ctx.decodeAudioData(pendingRaw);
        pendingRaw = null;
        return decodePromise.then((audioBuffer) => {
          const entry: DecodedSpellSound = {
            buffer: audioBuffer,
            trimStartSec: this.computeLeadingSilenceOffset(audioBuffer),
          };
          this.decodedWorldSfxBuffers[key] = entry;
          return entry;
        });
      })
      .catch(() => null)
      .finally(() => {
        delete this.loadingWorldSfxPromises[key];
      });

    this.loadingWorldSfxPromises[key] = promise;
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
        // Lazily fetch & decode the 4 world SFX once AudioContext is initialized
        (Object.keys(WORLD_SFX_URLS) as WorldSfxKey[]).forEach((key) => {
          if (this.ctx) {
            this.loadWorldSfxBuffer(key, this.ctx);
          }
        });
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

  private stopCampfireNodes(fadeOut: boolean) {
    const prevSource = this.campfireLoopSource;
    const prevGain = this.campfireLoopGain;
    this.campfireLoopSource = null;
    this.campfireLoopGain = null;

    if (!prevSource || !prevGain) return;

    const cleanup = () => {
      try {
        prevSource.disconnect();
      } catch {
        // Ignore already disconnected node
      }
      try {
        prevGain.disconnect();
      } catch {
        // Ignore already disconnected node
      }
    };

    if (fadeOut && this.ctx && !this.muted && this.ctx.state === 'running') {
      const now = this.ctx.currentTime;
      try {
        prevGain.gain.cancelScheduledValues(now);
        prevGain.gain.setValueAtTime(prevGain.gain.value, now);
        prevGain.gain.linearRampToValueAtTime(0, now + 0.2);
      } catch {
        // Ignore AudioParam errors
      }
      prevSource.onended = cleanup;
      try {
        prevSource.stop(now + 0.21);
      } catch {
        cleanup();
      }
    } else {
      prevSource.onended = null;
      try {
        prevSource.stop();
      } catch {
        // Ignore if already stopped
      }
      cleanup();
    }
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    saveAudioPrefs({ muted: this.muted, masterVolume: this.masterVolume });
    if (mute) {
      this.campfireLoopActive = false;
      this.campfireLoopGeneration += 1;
      this.stopCampfireNodes(false);
    }
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
    saveAudioPrefs({ muted: this.muted, masterVolume: this.masterVolume });
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

  public playHeavyImpact(isKill = false, spellId?: string) {
    if (this.muted) return;
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;
    const now = ctx.currentTime;

    let decoded: DecodedSpellSound | undefined;
    if (spellId === 'incendio' && this.decodedSpellBuffers.incendio) {
      decoded = this.decodedSpellBuffers.incendio;
    } else if (spellId === 'expelliarmus' && this.decodedSpellBuffers.expelliarmus) {
      decoded = this.decodedSpellBuffers.expelliarmus;
    } else if (spellId === 'arcane_sword' && this.decodedSpellBuffers.arcane_sword) {
      decoded = this.decodedSpellBuffers.arcane_sword;
    } else {
      decoded =
        this.decodedSpellBuffers.stupefy ||
        this.decodedSpellBuffers.teleport ||
        this.decodedSpellBuffers.incendio ||
        this.decodedSpellBuffers.expelliarmus ||
        this.decodedSpellBuffers.arcane_sword;
    }

    if (decoded) {
      const available = Math.max(0.15, decoded.buffer.duration - decoded.trimStartSec);
      const duration = Math.min(available, isKill ? 0.55 : 0.36);
      const rate = isKill
        ? 0.85 + Math.random() * 0.1
        : 1.05 + Math.random() * 0.17;
      const peakGain = isKill ? 0.45 : 0.29;
      const totalDur = decoded.buffer.duration;
      const transientShift = isKill
        ? 0
        : Math.min(0.03, Math.max(0, totalDur - decoded.trimStartSec - duration * rate) * 0.15);
      const startOffset = Math.min(
        Math.max(0, totalDur - 0.05),
        decoded.trimStartSec + transientShift
      );

      const source = ctx.createBufferSource();
      source.buffer = decoded.buffer;
      source.playbackRate.setValueAtTime(rate, now);

      const gain = ctx.createGain();
      const attack = Math.min(0.012, duration * 0.15);
      const fadeStart = Math.max(now + attack, now + duration - 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + attack);
      gain.gain.setValueAtTime(peakGain, fadeStart);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      source.connect(gain);
      gain.connect(out);
      source.onended = () => {
        try {
          source.disconnect();
        } catch {
          // Ignore
        }
        gain.disconnect();
      };
      source.start(now, startOffset);
      source.stop(now + duration + 0.01);
      return;
    }

    // Emergency fallback only if spell MP3 buffers have not finished decoding yet
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

  /**
   * Plays a brief (0.28s), quiet (peak gain 0.22) crackling fire slice from the already-decoded
   * campfire loop buffer (or incendio spell buffer as fallback) for enemy burn DoT ticks.
   */
  public playFireBurnTick() {
    if (this.muted) return;
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;

    const decoded =
      this.decodedWorldSfxBuffers.campfire_loop || this.decodedSpellBuffers.incendio;
    if (!decoded) return;

    const now = ctx.currentTime;
    const sliceDur = 0.28;
    const totalDur = decoded.buffer.duration;
    const minOffset = Math.min(decoded.trimStartSec, Math.max(0, totalDur - 0.05));
    const maxOffset = Math.max(minOffset, totalDur - sliceDur - 0.05);
    const offset =
      maxOffset > minOffset
        ? minOffset + Math.random() * (maxOffset - minOffset)
        : minOffset;
    const playDur = Math.min(sliceDur, Math.max(0.05, totalDur - offset));

    const source = ctx.createBufferSource();
    source.buffer = decoded.buffer;
    source.playbackRate.setValueAtTime(0.95 + Math.random() * 0.1, now);

    const gain = ctx.createGain();
    const fadeIn = Math.min(0.04, playDur * 0.25);
    const fadeOut = Math.min(0.1, playDur * 0.45);
    const fadeOutStart = Math.max(now + fadeIn, now + playDur - fadeOut);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + fadeIn);
    gain.gain.setValueAtTime(0.22, fadeOutStart);
    gain.gain.linearRampToValueAtTime(0.0001, now + playDur);

    source.connect(gain);
    gain.connect(out);
    source.onended = () => {
      try {
        source.disconnect();
      } catch {
        // Ignore
      }
      gain.disconnect();
    };
    source.start(now, offset, playDur);
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

  /**
   * Plays File #1 for chopping trees ('ancient_wood') or File #2 for picking flowers ('mandrake_root'),
   * falling back to playPickupChime() if not decoded yet.
   */
  public playHarvestSound(reagentId: ReagentId) {
    if (this.muted) return;
    const key: WorldSfxKey | null =
      reagentId === 'ancient_wood'
        ? 'tree_chop'
        : reagentId === 'mandrake_root'
        ? 'herb_pick'
        : null;
    if (!key) {
      this.playPickupChime();
      return;
    }

    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;

    const decoded = this.decodedWorldSfxBuffers[key];
    if (!decoded) {
      this.loadWorldSfxBuffer(key, ctx);
      this.playPickupChime();
      return;
    }

    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = decoded.buffer;
    source.playbackRate.setValueAtTime(0.96 + Math.random() * 0.08, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.58, now);

    source.connect(gain);
    gain.connect(out);
    source.onended = () => {
      try {
        source.disconnect();
      } catch {
        // Ignore
      }
      gain.disconnect();
    };
    source.start(now, decoded.trimStartSec);
  }

  /**
   * Plays File #4 for wooden wall build (1.0x pitch) and dismantle (0.88x pitch),
   * falling back to playHeavyImpact(false) if not decoded yet.
   */
  public playWallSound(action: 'build' | 'dismantle') {
    if (this.muted) return;
    const audio = this.ensureContext();
    if (!audio) return;
    const { ctx, out } = audio;

    const decoded = this.decodedWorldSfxBuffers.wall_action;
    if (!decoded) {
      this.loadWorldSfxBuffer('wall_action', ctx);
      this.playHeavyImpact(false);
      return;
    }

    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = decoded.buffer;
    source.playbackRate.setValueAtTime(action === 'build' ? 1.0 : 0.88, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.56, now);

    source.connect(gain);
    gain.connect(out);
    source.onended = () => {
      try {
        source.disconnect();
      } catch {
        // Ignore
      }
      gain.disconnect();
    };
    source.start(now, decoded.trimStartSec);
  }

  /**
   * Zero-CPU guarded looping campfire fire sound (File #3).
   * Safe to invoke every frame in the 60fps simulation loop.
   */
  public setCampfireLoop(active: boolean, forceRestart = false) {
    const shouldPlay = active && !this.muted;
    if (!forceRestart && shouldPlay === this.campfireLoopActive) {
      return;
    }

    this.campfireLoopActive = shouldPlay;
    this.campfireLoopGeneration += 1;
    const gen = this.campfireLoopGeneration;

    if (!shouldPlay) {
      this.stopCampfireNodes(true);
      return;
    }

    // Stop & disconnect any previous campfire node immediately before starting a fresh one
    this.stopCampfireNodes(false);

    const audio = this.ensureContext();
    if (!audio) {
      this.campfireLoopActive = false;
      return;
    }
    const { ctx, out } = audio;

    const startFreshLoop = (decoded: DecodedSpellSound) => {
      if (gen !== this.campfireLoopGeneration || !this.campfireLoopActive || this.muted) {
        return;
      }
      this.stopCampfireNodes(false);
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      source.buffer = decoded.buffer;
      source.loop = true;
      source.loopStart = decoded.trimStartSec;
      if (decoded.buffer.duration > decoded.trimStartSec) {
        source.loopEnd = decoded.buffer.duration;
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.15);

      source.connect(gain);
      gain.connect(out);
      this.campfireLoopSource = source;
      this.campfireLoopGain = gain;

      source.onended = () => {
        try {
          source.disconnect();
        } catch {
          // Ignore
        }
        try {
          gain.disconnect();
        } catch {
          // Ignore
        }
        if (this.campfireLoopSource === source) {
          this.campfireLoopSource = null;
        }
        if (this.campfireLoopGain === gain) {
          this.campfireLoopGain = null;
        }
      };

      source.start(now, decoded.trimStartSec);
    };

    const decoded = this.decodedWorldSfxBuffers.campfire_loop;
    if (decoded) {
      startFreshLoop(decoded);
      return;
    }

    this.loadWorldSfxBuffer('campfire_loop', ctx).then((loaded) => {
      if (loaded) {
        startFreshLoop(loaded);
      }
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

  /**
   * Plays a quiet, distance-attenuated, throttled slice from already-decoded spell MP3 buffers
   * when an enemy fires a spell or arrow. Never allocates extra RAM or falls back to synth beeps.
   */
  public playEnemySpellCast(spellId: SpellId, distance: number) {
    if (this.muted || distance > 22) return;
    const nowMs = performance.now();
    if (this.lastEnemyCastSoundMs > 0 && nowMs - this.lastEnemyCastSoundMs < 260) {
      return;
    }

    const decoded = this.decodedSpellBuffers[spellId] || this.decodedSpellBuffers['stupefy'];
    if (!decoded) return;

    const audio = this.ensureContext();
    if (!audio) return;
    this.lastEnemyCastSoundMs = nowMs;

    const { ctx, out } = audio;
    const now = ctx.currentTime;
    const available = Math.max(0.15, decoded.buffer.duration - decoded.trimStartSec);
    const duration = Math.min(available, 0.55);
    const rate = 0.8 + Math.random() * 0.1;
    const distFactor = Math.max(0.15, 1 - distance / 22);
    const vol = 0.19 * distFactor;

    const source = ctx.createBufferSource();
    source.buffer = decoded.buffer;
    source.playbackRate.setValueAtTime(rate, now);

    const gain = ctx.createGain();
    const fadeStart = now + Math.max(0.01, duration - 0.12);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.setValueAtTime(vol, fadeStart);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    source.connect(gain);
    gain.connect(out);
    source.onended = () => {
      try {
        source.disconnect();
      } catch {
        // Ignore
      }
      gain.disconnect();
    };
    source.start(now, decoded.trimStartSec);
    source.stop(now + duration + 0.01);
  }

  public playPlayerHurt(damage = 12) {
    if (this.muted) return;
    const nowMs = performance.now();
    if (this.lastPlayerHurtSoundMs > 0 && nowMs - this.lastPlayerHurtSoundMs < 180) {
      return;
    }

    const audio = this.ensureContext();
    if (!audio) return;
    this.lastPlayerHurtSoundMs = nowMs;

    const { ctx, out } = audio;
    const now = ctx.currentTime;

    const decoded =
      this.decodedSpellBuffers['stupefy'] || this.decodedSpellBuffers['teleport'];
    if (decoded) {
      const available = Math.max(0.15, decoded.buffer.duration - decoded.trimStartSec);
      const duration = Math.min(available, 0.45);
      const rate = 0.72 + Math.random() * 0.08;
      const safeDamage = Math.max(0, Number.isFinite(damage) ? damage : 12);
      const vol = Math.min(0.5, 0.32 + (safeDamage / 50) * 0.18);

      const source = ctx.createBufferSource();
      source.buffer = decoded.buffer;
      source.playbackRate.setValueAtTime(rate, now);

      const gain = ctx.createGain();
      const fadeStart = now + Math.max(0.01, duration - 0.12);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.setValueAtTime(vol, fadeStart);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      source.connect(gain);
      gain.connect(out);
      source.onended = () => {
        try {
          source.disconnect();
        } catch {
          // Ignore
        }
        gain.disconnect();
      };
      source.start(now, decoded.trimStartSec);
      source.stop(now + duration + 0.01);
      return;
    }

    // Fallback oscillator ONLY if neither MP3 buffer is decoded yet
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
  private lastSpellDispatchMs = 0;
  private lastMatchedResultIdx = -1;

  constructor(callbacks: VoiceRecognitionCallbacks) {
    this.callbacks = callbacks;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  public startPushToTalk(continuousMode = false) {
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
    this.lastMatchedResultIdx = -1;
    this.lastSpellDispatchMs = 0;

    try {
      const rec = new SpeechRec();
      this.recognition = rec;
      rec.lang = 'ru-RU';
      // Continuous anti-beep mode on Android keeps the mic session open across multiple spells;
      // single-utterance Push-To-Talk closes automatically after one matched spell.
      rec.continuous = continuousMode;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        if (this.recognition !== rec) return;
        this.isListening = true;
        this.callbacks.onStatusChange(true, true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        if (this.recognition !== rec) return;
        if (!continuousMode && this.hasDispatchedThisSession) return;
        let latestTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result || !result.length) continue;
          latestTranscript += String(result[0]?.transcript || '') + ' ';
          if (continuousMode && i <= this.lastMatchedResultIdx) {
            continue;
          }
          for (let alt = 0; alt < result.length; alt++) {
            const transcript = String(result[alt]?.transcript || '');
            if (!transcript) continue;
            const matched = matchVoiceSpell(transcript);
            if (matched.spellId) {
              if (continuousMode) {
                const nowMs = performance.now();
                if (
                  i <= this.lastMatchedResultIdx ||
                  (this.lastSpellDispatchMs > 0 && nowMs - this.lastSpellDispatchMs < 650)
                ) {
                  break;
                }
                this.lastSpellDispatchMs = nowMs;
                this.lastMatchedResultIdx = i;
                this.callbacks.onSpellRecognized(
                  matched.spellId,
                  transcript.trim(),
                  matched.voiceQuality
                );
                // Keep recognition open in continuousMode so Android Chrome does not beep between spells
                break;
              } else {
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
          }
        }
        if (latestTranscript.trim()) {
          this.callbacks.onTranscriptUpdate(latestTranscript.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (event: any) => {
        if (this.recognition !== rec) return;
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

      rec.onend = () => {
        if (this.recognition !== rec) return;
        // Never auto-restart on silence in continuousMode (avoids endless Android OS beeps)
        this.isListening = false;
        this.callbacks.onStatusChange(false, true);
      };

      rec.start();
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
