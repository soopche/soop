import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_PREFS_STORAGE_KEY,
  ArcaneAudioEngine,
  CAMPFIRE_LOOP_SOUND_URL,
  HERB_PICK_SOUND_URL,
  TREE_CHOP_SOUND_URL,
  VoiceSpellRecognizer,
  WALL_ACTION_SOUND_URL,
  loadAudioPrefs,
  saveAudioPrefs,
} from './audio';
import type { SpellId } from './spells';

test('loadAudioPrefs and saveAudioPrefs persist muted and masterVolume under vox_arcanum_audio_prefs_v1', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  assert.equal(AUDIO_PREFS_STORAGE_KEY, 'vox_arcanum_audio_prefs_v1');
  assert.deepEqual(loadAudioPrefs(mockStorage), { muted: false, masterVolume: 0.85 });

  saveAudioPrefs({ muted: true, masterVolume: 0.42 }, mockStorage);
  assert.deepEqual(loadAudioPrefs(mockStorage), { muted: true, masterVolume: 0.42 });

  saveAudioPrefs({ muted: false, masterVolume: 2.5 }, mockStorage);
  assert.deepEqual(loadAudioPrefs(mockStorage), { muted: false, masterVolume: 1 });
});

test('VoiceSpellRecognizer checks all recognition alternatives and ignores stale session callbacks', () => {
  const createdInstances: Array<{
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onstart?: () => void;
    onresult?: (e: unknown) => void;
    onerror?: (e: unknown) => void;
    onend?: () => void;
    start: () => void;
    stop: () => void;
  }> = [];

  class MockSpeechRecognition {
    lang = '';
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    onstart?: () => void;
    onresult?: (e: unknown) => void;
    onerror?: (e: unknown) => void;
    onend?: () => void;
    start() {}
    stop() {}
    constructor() {
      createdInstances.push(this);
    }
  }

  const g = globalThis as unknown as { window?: Record<string, unknown> };
  const prevWindow = g.window;
  g.window = { SpeechRecognition: MockSpeechRecognition };

  try {
    const recognized: Array<{ spellId: SpellId; transcript: string }> = [];
    const statuses: boolean[] = [];

    const recognizer = new VoiceSpellRecognizer({
      onSpellRecognized: (spellId, transcript) => {
        recognized.push({ spellId, transcript });
      },
      onTranscriptUpdate: () => {},
      onStatusChange: (listening) => {
        statuses.push(listening);
      },
    });

    // Session 1 starts and stops
    recognizer.startPushToTalk();
    const rec1 = createdInstances[0];
    rec1.onstart?.();
    assert.equal(statuses[statuses.length - 1], true);

    recognizer.stop();
    assert.equal(statuses[statuses.length - 1], false);

    // Session 2 starts before rec1's delayed onend fires
    recognizer.startPushToTalk();
    const rec2 = createdInstances[1];
    rec2.onstart?.();
    assert.equal(statuses[statuses.length - 1], true);

    // Delayed onend & onerror from rec1 must be ignored
    const statusCountBeforeStale = statuses.length;
    rec1.onend?.();
    rec1.onerror?.({ error: 'aborted' });
    assert.equal(statuses.length, statusCountBeforeStale);

    // Alternative index 1 matches 'мороз' when index 0 is noisy
    rec2.onresult?.({
      resultIndex: 0,
      results: [
        Object.assign([{ transcript: 'порог' }, { transcript: 'мороз' }], { length: 2 }),
      ],
    });

    assert.equal(recognized.length, 1);
    assert.equal(recognized[0].spellId, 'glacius');
    assert.equal(recognized[0].transcript, 'мороз');
  } finally {
    g.window = prevWindow;
  }
});

test('VoiceSpellRecognizer anti-beep continuousMode dispatches multiple spells without stopping, deduplicates resultIndex & 650ms window, and never auto-restarts onend', () => {
  const instances: Array<{
    continuous: boolean;
    interimResults: boolean;
    startCalls: number;
    stopCalls: number;
    onstart?: () => void;
    onresult?: (e: unknown) => void;
    onend?: () => void;
    start: () => void;
    stop: () => void;
  }> = [];

  class MockSpeechRecognition {
    lang = '';
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    startCalls = 0;
    stopCalls = 0;
    onstart?: () => void;
    onresult?: (e: unknown) => void;
    onerror?: (e: unknown) => void;
    onend?: () => void;
    start() {
      this.startCalls += 1;
    }
    stop() {
      this.stopCalls += 1;
    }
    constructor() {
      instances.push(this);
    }
  }

  const g = globalThis as unknown as { window?: Record<string, unknown> };
  const prevWindow = g.window;
  const origPerfNow = performance.now.bind(performance);
  let fakeNowMs = 5000;
  performance.now = () => fakeNowMs;
  g.window = { SpeechRecognition: MockSpeechRecognition };

  try {
    const recognized: Array<{ spellId: SpellId; transcript: string }> = [];
    const statuses: Array<{ listening: boolean; supported: boolean }> = [];

    const recognizer = new VoiceSpellRecognizer({
      onSpellRecognized: (spellId, transcript) => {
        recognized.push({ spellId, transcript });
      },
      onTranscriptUpdate: () => {},
      onStatusChange: (listening, supported) => {
        statuses.push({ listening, supported });
      },
    });

    recognizer.startPushToTalk(true);
    assert.equal(instances.length, 1);
    const rec = instances[0];
    assert.equal(rec.continuous, true);
    assert.equal(rec.interimResults, true);
    assert.equal(rec.startCalls, 1);

    rec.onstart?.();
    assert.deepEqual(statuses[statuses.length - 1], { listening: true, supported: true });

    // Spell 1 at result index 0 -> dispatches WITHOUT calling stop()
    rec.onresult?.({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'огонь' }], { length: 1 })],
    });
    assert.equal(recognized.length, 1);
    assert.equal(recognized[0].spellId, 'incendio');
    assert.equal(rec.stopCalls, 0, 'continuousMode must not stop after a spell');

    // Duplicate interim/final update for same result index 0 (even after >650ms) must be skipped
    fakeNowMs = 6000;
    rec.onresult?.({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'огонь' }], { length: 1 })],
    });
    assert.equal(recognized.length, 1);

    // Rapid new result index 1 within < 650ms of previous dispatch must be throttled
    fakeNowMs = 5400;
    rec.onresult?.({
      resultIndex: 1,
      results: [
        Object.assign([{ transcript: 'огонь' }], { length: 1 }),
        Object.assign([{ transcript: 'мороз' }], { length: 1 }),
      ],
    });
    assert.equal(recognized.length, 1);

    // New result index 1 after >= 650ms dispatches a 2nd spell in the same session without stopping
    fakeNowMs = 5700;
    rec.onresult?.({
      resultIndex: 1,
      results: [
        Object.assign([{ transcript: 'огонь' }], { length: 1 }),
        Object.assign([{ transcript: 'мороз' }], { length: 1 }),
      ],
    });
    assert.equal(recognized.length, 2);
    assert.equal(recognized[1].spellId, 'glacius');
    assert.equal(rec.stopCalls, 0);

    // When Android Chrome ends recognition on silence (onend), DO NOT auto-restart
    rec.onend?.();
    assert.equal(instances.length, 1);
    assert.equal(rec.startCalls, 1, 'onend must never auto-restart in continuousMode');
    assert.deepEqual(statuses[statuses.length - 1], { listening: false, supported: true });
  } finally {
    performance.now = origPerfNow;
    g.window = prevWindow;
  }
});

test('World SFX URLs follow exact 1-to-4 order and ArcaneAudioEngine handles harvest, wall, and zero-CPU campfire loop', async () => {
  assert.equal(
    TREE_CHOP_SOUND_URL,
    '/assets/aistudio/alexzavesa-boards-fall-1-468371__mp3cut.net__ce1023b3.mp3'
  );
  assert.equal(
    HERB_PICK_SOUND_URL,
    '/assets/aistudio/universfield-funny-cartoon-cry-144756__mp3cut.net__60580c85.mp3'
  );
  assert.equal(
    CAMPFIRE_LOOP_SOUND_URL,
    '/assets/aistudio/dragon-studio-fire-crackling-sounds-427410_cf6be12a.mp3'
  );
  assert.equal(
    WALL_ACTION_SOUND_URL,
    '/assets/aistudio/dragon-studio-falling-tree-356127_f4a3367d.mp3'
  );

  interface MockAudioParam {
    value: number;
    setCalls: Array<[number, number]>;
    linearRampCalls: Array<[number, number]>;
    setValueAtTime: (v: number, t: number) => void;
    linearRampToValueAtTime: (v: number, t: number) => void;
    exponentialRampToValueAtTime: (v: number, t: number) => void;
    cancelScheduledValues: (t: number) => void;
  }

  const createParam = (initial = 1): MockAudioParam => {
    const p: MockAudioParam = {
      value: initial,
      setCalls: [],
      linearRampCalls: [],
      setValueAtTime(v: number, t: number) {
        p.value = v;
        p.setCalls.push([v, t]);
      },
      linearRampToValueAtTime(v: number, t: number) {
        p.value = v;
        p.linearRampCalls.push([v, t]);
      },
      exponentialRampToValueAtTime() {},
      cancelScheduledValues() {},
    };
    return p;
  };

  interface MockGainNode {
    gain: MockAudioParam;
    disconnected: boolean;
    connect: () => void;
    disconnect: () => void;
  }

  interface MockBufferSourceNode {
    buffer: { tag: string; duration: number } | null;
    loop: boolean;
    loopStart: number;
    loopEnd: number;
    playbackRate: MockAudioParam;
    startedAt: Array<[number, number]>;
    stoppedAt: Array<number | undefined>;
    disconnected: boolean;
    onended: (() => void) | null;
    connect: () => void;
    disconnect: () => void;
    start: (when?: number, offset?: number) => void;
    stop: (when?: number) => void;
  }

  const createdSources: MockBufferSourceNode[] = [];
  const createdGains: MockGainNode[] = [];
  const createdOscillators: number[] = [];
  const fetchedUrls: string[] = [];

  class MockAudioContext {
    public currentTime = 10;
    public state: AudioContextState = 'running';
    public destination = {};

    createGain() {
      const node: MockGainNode = {
        gain: createParam(1),
        disconnected: false,
        connect() {},
        disconnect() {
          node.disconnected = true;
        },
      };
      createdGains.push(node);
      return node;
    }

    createOscillator() {
      createdOscillators.push(this.currentTime);
      return {
        type: 'sine',
        frequency: createParam(440),
        onended: null as (() => void) | null,
        connect() {},
        start() {},
        stop() {},
      };
    }

    createBufferSource() {
      const src: MockBufferSourceNode = {
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        playbackRate: createParam(1),
        startedAt: [],
        stoppedAt: [],
        disconnected: false,
        onended: null,
        connect() {},
        disconnect() {
          src.disconnected = true;
        },
        start(when = 0, offset = 0) {
          src.startedAt.push([when, offset]);
        },
        stop(when?: number) {
          src.stoppedAt.push(when);
        },
      };
      createdSources.push(src);
      return src;
    }

    async decodeAudioData(buf: ArrayBuffer) {
      const view = new Uint8Array(buf);
      const tag = String.fromCharCode(...view);
      // Leading 100 samples of silence at 1000Hz -> 0.1s leading silence, minus 2ms transient safety = 0.098s
      const samples = new Float32Array(2000);
      for (let i = 100; i < 2000; i++) samples[i] = 0.5;
      return {
        tag,
        sampleRate: 1000,
        length: 2000,
        duration: 2.0,
        numberOfChannels: 1,
        getChannelData: () => samples,
      };
    }

    async suspend() {
      this.state = 'suspended';
    }

    async resume() {
      this.state = 'running';
    }
  }

  const g = globalThis as unknown as {
    window?: Record<string, unknown>;
    fetch?: typeof fetch;
  };
  const prevWindow = g.window;
  const prevFetch = g.fetch;

  const urlTags = new Map<string, string>([
    [TREE_CHOP_SOUND_URL, 'TREE'],
    [HERB_PICK_SOUND_URL, 'HERB'],
    [CAMPFIRE_LOOP_SOUND_URL, 'FIRE'],
    [WALL_ACTION_SOUND_URL, 'WALL'],
  ]);

  g.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    fetchedUrls.push(url);
    const tag = urlTags.get(url);
    if (!tag) {
      return { ok: false, arrayBuffer: async () => new ArrayBuffer(0) } as Response;
    }
    const bytes = new Uint8Array(tag.length);
    for (let i = 0; i < tag.length; i++) bytes[i] = tag.charCodeAt(i);
    return { ok: true, arrayBuffer: async () => bytes.buffer } as Response;
  }) as typeof fetch;

  g.window = {
    AudioContext: MockAudioContext,
  };

  try {
    const engine = new ArcaneAudioEngine();

    // Wait 1 microtask for constructor fetches (spell URLs) to settle; world SFX are NOT fetched yet
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(fetchedUrls.includes(TREE_CHOP_SOUND_URL), false);
    assert.equal(fetchedUrls.includes(HERB_PICK_SOUND_URL), false);
    assert.equal(fetchedUrls.includes(CAMPFIRE_LOOP_SOUND_URL), false);
    assert.equal(fetchedUrls.includes(WALL_ACTION_SOUND_URL), false);

    // First call initializes AudioContext, kicks off lazy decode ONCE, and falls back immediately to synth
    const oscBefore = createdOscillators.length;
    engine.playHarvestSound('ancient_wood');
    assert.ok(createdOscillators.length > oscBefore, 'falls back to pickup chime before decoded');

    // Wait for lazy world SFX fetch + decodeAudioData to complete
    await new Promise((r) => setTimeout(r, 20));

    // Each of the 4 world SFX URLs must be fetched exactly ONCE
    for (const url of [
      TREE_CHOP_SOUND_URL,
      HERB_PICK_SOUND_URL,
      CAMPFIRE_LOOP_SOUND_URL,
      WALL_ACTION_SOUND_URL,
    ]) {
      assert.equal(
        fetchedUrls.filter((u) => u === url).length,
        1,
        `expected ${url} to be fetched lazily once`
      );
    }

    // Decoded harvest sounds play File #1 for ancient_wood and File #2 for mandrake_root & disconnect GainNode in onended
    engine.playHarvestSound('ancient_wood');
    const treeSrc = createdSources[createdSources.length - 1];
    const treeGain = createdGains[createdGains.length - 1];
    assert.equal(treeSrc.buffer?.tag, 'TREE');
    assert.ok(Math.abs(treeSrc.startedAt[0][1] - 0.098) < 0.001);
    treeSrc.onended?.();
    assert.equal(treeGain.disconnected, true);

    engine.playHarvestSound('mandrake_root');
    const herbSrc = createdSources[createdSources.length - 1];
    const herbGain = createdGains[createdGains.length - 1];
    assert.equal(herbSrc.buffer?.tag, 'HERB');
    herbSrc.onended?.();
    assert.equal(herbGain.disconnected, true);

    // Wall sounds play File #4 at 1.0x for build and 0.88x for dismantle & disconnect GainNode in onended
    engine.playWallSound('build');
    const buildSrc = createdSources[createdSources.length - 1];
    const buildGain = createdGains[createdGains.length - 1];
    assert.equal(buildSrc.buffer?.tag, 'WALL');
    assert.equal(buildSrc.playbackRate.value, 1.0);
    buildSrc.onended?.();
    assert.equal(buildGain.disconnected, true);

    engine.playWallSound('dismantle');
    const dismantleSrc = createdSources[createdSources.length - 1];
    const dismantleGain = createdGains[createdGains.length - 1];
    assert.equal(dismantleSrc.buffer?.tag, 'WALL');
    assert.equal(dismantleSrc.playbackRate.value, 0.88);
    dismantleSrc.onended?.();
    assert.equal(dismantleGain.disconnected, true);

    // Campfire loop: zero-CPU guard when inactive
    const srcCountBeforeGuard = createdSources.length;
    engine.setCampfireLoop(false, false);
    engine.setCampfireLoop(false, false);
    assert.equal(createdSources.length, srcCountBeforeGuard);

    // Activate campfire loop -> single looping source from trimStartSec with 0.15s fade-in
    engine.setCampfireLoop(true, false);
    assert.equal(createdSources.length, srcCountBeforeGuard + 1);
    const cfSrc1 = createdSources[createdSources.length - 1];
    const cfGain1 = createdGains[createdGains.length - 1];
    assert.equal(cfSrc1.buffer?.tag, 'FIRE');
    assert.equal(cfSrc1.loop, true);
    assert.ok(Math.abs(cfSrc1.startedAt[0][1] - 0.098) < 0.001);
    assert.equal(cfGain1.gain.linearRampCalls[0][1], 10.15);

    // Repeated 60fps calls with active=true, forceRestart=false do 0 work
    engine.setCampfireLoop(true, false);
    engine.setCampfireLoop(true, false);
    assert.equal(createdSources.length, srcCountBeforeGuard + 1);

    // Ignition forceRestart=true stops & disconnects previous source and starts a fresh one
    engine.setCampfireLoop(true, true);
    assert.equal(cfSrc1.stoppedAt.length, 1);
    assert.equal(cfSrc1.disconnected, true);
    assert.equal(cfGain1.disconnected, true);
    assert.equal(createdSources.length, srcCountBeforeGuard + 2);
    const cfSrc2 = createdSources[createdSources.length - 1];
    const cfGain2 = createdGains[createdGains.length - 1];
    assert.equal(cfSrc2.loop, true);

    // Leaving campfire aura fades gain to 0 over 0.2s, stops, and disconnects onended
    engine.setCampfireLoop(false, false);
    assert.equal(cfGain2.gain.linearRampCalls[cfGain2.gain.linearRampCalls.length - 1][0], 0);
    assert.equal(cfGain2.gain.linearRampCalls[cfGain2.gain.linearRampCalls.length - 1][1], 10.2);
    assert.equal(cfSrc2.stoppedAt.length, 1);
    cfSrc2.onended?.();
    assert.equal(cfSrc2.disconnected, true);
    assert.equal(cfGain2.disconnected, true);

    // Mute stops active campfire loop and resets campfireLoopActive so unmuting allows restart
    engine.setCampfireLoop(true, false);
    const cfSrc3 = createdSources[createdSources.length - 1];
    const cfGain3 = createdGains[createdGains.length - 1];
    engine.setMuted(true);
    assert.equal(cfSrc3.stoppedAt.length, 1);
    assert.equal(cfSrc3.disconnected, true);
    assert.equal(cfGain3.disconnected, true);

    engine.setMuted(false);
    const countBeforeResume = createdSources.length;
    engine.setCampfireLoop(true, false);
    assert.equal(createdSources.length, countBeforeResume + 1);
  } finally {
    g.window = prevWindow;
    g.fetch = prevFetch;
  }
});

test('playFireBurnTick and playHeavyImpact reuse decoded MP3 slices with clean envelopes and oscillator fallback', async () => {
  interface MockParam {
    value: number;
    setCalls: Array<[number, number]>;
    linearRampCalls: Array<[number, number]>;
    setValueAtTime: (v: number, t: number) => void;
    linearRampToValueAtTime: (v: number, t: number) => void;
    exponentialRampToValueAtTime: (v: number, t: number) => void;
    cancelScheduledValues: (t: number) => void;
  }

  const makeParam = (initial = 1): MockParam => {
    const p: MockParam = {
      value: initial,
      setCalls: [],
      linearRampCalls: [],
      setValueAtTime(v: number, t: number) {
        p.value = v;
        p.setCalls.push([v, t]);
      },
      linearRampToValueAtTime(v: number, t: number) {
        p.value = v;
        p.linearRampCalls.push([v, t]);
      },
      exponentialRampToValueAtTime() {},
      cancelScheduledValues() {},
    };
    return p;
  };

  interface MockGain {
    gain: MockParam;
    disconnected: boolean;
    connect: () => void;
    disconnect: () => void;
  }

  interface MockSource {
    buffer: { tag: string; duration: number } | null;
    playbackRate: MockParam;
    startCalls: Array<[number, number, number | undefined]>;
    stopCalls: Array<number | undefined>;
    disconnected: boolean;
    onended: (() => void) | null;
    connect: () => void;
    disconnect: () => void;
    start: (when?: number, offset?: number, duration?: number) => void;
    stop: (when?: number) => void;
  }

  const sources: MockSource[] = [];
  const gains: MockGain[] = [];
  let oscCount = 0;

  class MockAudioContext {
    public currentTime = 20;
    public state: AudioContextState = 'running';
    public destination = {};

    createGain() {
      const g: MockGain = {
        gain: makeParam(1),
        disconnected: false,
        connect() {},
        disconnect() {
          g.disconnected = true;
        },
      };
      gains.push(g);
      return g;
    }

    createOscillator() {
      oscCount += 1;
      return {
        type: 'triangle',
        frequency: makeParam(200),
        onended: null as (() => void) | null,
        connect() {},
        start() {},
        stop() {},
      };
    }

    createBufferSource() {
      const s: MockSource = {
        buffer: null,
        playbackRate: makeParam(1),
        startCalls: [],
        stopCalls: [],
        disconnected: false,
        onended: null,
        connect() {},
        disconnect() {
          s.disconnected = true;
        },
        start(when = 0, offset = 0, duration?: number) {
          s.startCalls.push([when, offset, duration]);
        },
        stop(when?: number) {
          s.stopCalls.push(when);
        },
      };
      sources.push(s);
      return s;
    }

    async decodeAudioData(buf: ArrayBuffer) {
      const tag = String.fromCharCode(...new Uint8Array(buf));
      const samples = new Float32Array(2000);
      for (let i = 100; i < 2000; i++) samples[i] = 0.5;
      return {
        tag,
        sampleRate: 1000,
        length: 2000,
        duration: 2.0,
        numberOfChannels: 1,
        getChannelData: () => samples,
      };
    }

    async suspend() {
      this.state = 'suspended';
    }
    async resume() {
      this.state = 'running';
    }
  }

  const g = globalThis as unknown as {
    window?: Record<string, unknown>;
    fetch?: typeof fetch;
  };
  const prevWindow = g.window;
  const prevFetch = g.fetch;

  const urlTags: Array<[string, string]> = [
    ['fire-magic-6', 'INCENDIO'],
    ['lightning-strike', 'EXPELLIARMUS'],
    ['spear_thrust', 'ARCANE_SWORD'],
    ['whoosh-transition-impact', 'STUPEFY'],
    ['fire-crackling-sounds', 'CAMPFIRE'],
  ];

  g.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = urlTags.find(([needle]) => url.includes(needle));
    if (!match) {
      return { ok: false, arrayBuffer: async () => new ArrayBuffer(0) } as Response;
    }
    const bytes = new Uint8Array(match[1].length);
    for (let i = 0; i < match[1].length; i++) bytes[i] = match[1].charCodeAt(i);
    return { ok: true, arrayBuffer: async () => bytes.buffer } as Response;
  }) as typeof fetch;

  g.window = { AudioContext: MockAudioContext };

  try {
    const engine = new ArcaneAudioEngine();

    // Before MP3 buffers finish decoding, playHeavyImpact falls back to triangle oscillator
    engine.playHeavyImpact(false, 'incendio');
    assert.equal(oscCount, 1);

    // Wait for spell & campfire buffers to finish fetching + decoding
    await new Promise((r) => setTimeout(r, 25));

    const oscAfterDecode = oscCount;

    // 1. playFireBurnTick uses campfire_loop buffer, 0.28s slice, 0.22 peak gain, 0.04s fade-in, 0.1s fade-out, disconnects GainNode
    engine.playFireBurnTick();
    assert.equal(oscCount, oscAfterDecode, 'burn tick must never use synth oscillator');
    const burnSrc = sources[sources.length - 1];
    const burnGain = gains[gains.length - 1];
    assert.equal(burnSrc.buffer?.tag, 'CAMPFIRE');
    assert.equal(burnSrc.startCalls[0][2], 0.28);
    assert.equal(burnGain.gain.linearRampCalls[0][0], 0.22);
    assert.ok(Math.abs(burnGain.gain.linearRampCalls[0][1] - 20.04) < 0.001);
    assert.ok(Math.abs(burnGain.gain.linearRampCalls[1][1] - 20.28) < 0.001);
    burnSrc.onended?.();
    assert.equal(burnGain.disconnected, true);

    // 2. playHeavyImpact routes by spellId and uses 0.36s hit (0.29) / 0.55s kill (0.45) slices with 0.12s linear fade-out
    engine.playHeavyImpact(false, 'incendio');
    const fireHitSrc = sources[sources.length - 1];
    const fireHitGain = gains[gains.length - 1];
    assert.equal(fireHitSrc.buffer?.tag, 'INCENDIO');
    assert.ok(Math.abs((fireHitSrc.stopCalls[0] ?? 0) - 20.37) < 0.001);
    assert.ok(fireHitSrc.playbackRate.value >= 1.05 && fireHitSrc.playbackRate.value <= 1.22);
    assert.equal(fireHitGain.gain.linearRampCalls[0][0], 0.29);
    assert.equal(fireHitGain.gain.linearRampCalls[1][0], 0.0001);
    assert.ok(Math.abs(fireHitGain.gain.linearRampCalls[1][1] - 20.36) < 0.001);
    fireHitSrc.onended?.();
    assert.equal(fireHitGain.disconnected, true);

    engine.playHeavyImpact(false, 'expelliarmus');
    assert.equal(sources[sources.length - 1].buffer?.tag, 'EXPELLIARMUS');

    engine.playHeavyImpact(false, 'arcane_sword');
    assert.equal(sources[sources.length - 1].buffer?.tag, 'ARCANE_SWORD');

    engine.playHeavyImpact(true, 'glacius');
    const killSrc = sources[sources.length - 1];
    const killGain = gains[gains.length - 1];
    assert.equal(killSrc.buffer?.tag, 'STUPEFY');
    assert.ok(Math.abs((killSrc.stopCalls[0] ?? 0) - 20.56) < 0.001);
    assert.ok(killSrc.playbackRate.value >= 0.85 && killSrc.playbackRate.value <= 0.95);
    assert.equal(killGain.gain.linearRampCalls[0][0], 0.45);
    assert.equal(killGain.gain.linearRampCalls[1][0], 0.0001);
    assert.ok(Math.abs(killGain.gain.linearRampCalls[1][1] - 20.55) < 0.001);
    killSrc.onended?.();
    assert.equal(killGain.disconnected, true);

    assert.equal(oscCount, oscAfterDecode, 'decoded impacts must not use triangle oscillator');
  } finally {
    g.window = prevWindow;
    g.fetch = prevFetch;
  }
});

test('playEnemySpellCast and playPlayerHurt reuse decoded MP3 slices with anti-spam throttling and distance attenuation', async () => {
  interface MockParam {
    value: number;
    setCalls: Array<[number, number]>;
    linearRampCalls: Array<[number, number]>;
    expRampCalls: Array<[number, number]>;
    setValueAtTime: (v: number, t: number) => void;
    linearRampToValueAtTime: (v: number, t: number) => void;
    exponentialRampToValueAtTime: (v: number, t: number) => void;
    cancelScheduledValues: (t: number) => void;
  }

  const makeParam = (initial = 1): MockParam => {
    const p: MockParam = {
      value: initial,
      setCalls: [],
      linearRampCalls: [],
      expRampCalls: [],
      setValueAtTime(v: number, t: number) {
        p.value = v;
        p.setCalls.push([v, t]);
      },
      linearRampToValueAtTime(v: number, t: number) {
        p.value = v;
        p.linearRampCalls.push([v, t]);
      },
      exponentialRampToValueAtTime(v: number, t: number) {
        p.value = v;
        p.expRampCalls.push([v, t]);
      },
      cancelScheduledValues() {},
    };
    return p;
  };

  interface MockGain {
    gain: MockParam;
    disconnected: boolean;
    connect: () => void;
    disconnect: () => void;
  }

  interface MockSource {
    buffer: { tag: string; duration: number } | null;
    playbackRate: MockParam;
    startCalls: Array<[number, number, number | undefined]>;
    stopCalls: Array<number | undefined>;
    disconnected: boolean;
    onended: (() => void) | null;
    connect: () => void;
    disconnect: () => void;
    start: (when?: number, offset?: number, duration?: number) => void;
    stop: (when?: number) => void;
  }

  const sources: MockSource[] = [];
  const gains: MockGain[] = [];
  let oscCount = 0;

  class MockAudioContext {
    public currentTime = 30;
    public state: AudioContextState = 'running';
    public destination = {};

    createGain() {
      const g: MockGain = {
        gain: makeParam(1),
        disconnected: false,
        connect() {},
        disconnect() {
          g.disconnected = true;
        },
      };
      gains.push(g);
      return g;
    }

    createOscillator() {
      oscCount += 1;
      return {
        type: 'triangle',
        frequency: makeParam(190),
        onended: null as (() => void) | null,
        connect() {},
        start() {},
        stop() {},
      };
    }

    createBufferSource() {
      const s: MockSource = {
        buffer: null,
        playbackRate: makeParam(1),
        startCalls: [],
        stopCalls: [],
        disconnected: false,
        onended: null,
        connect() {},
        disconnect() {
          s.disconnected = true;
        },
        start(when = 0, offset = 0, duration?: number) {
          s.startCalls.push([when, offset, duration]);
        },
        stop(when?: number) {
          s.stopCalls.push(when);
        },
      };
      sources.push(s);
      return s;
    }

    async decodeAudioData(buf: ArrayBuffer) {
      const tag = String.fromCharCode(...new Uint8Array(buf));
      const samples = new Float32Array(2000);
      for (let i = 100; i < 2000; i++) samples[i] = 0.5;
      return {
        tag,
        sampleRate: 1000,
        length: 2000,
        duration: 2.0,
        numberOfChannels: 1,
        getChannelData: () => samples,
      };
    }

    async suspend() {
      this.state = 'suspended';
    }
    async resume() {
      this.state = 'running';
    }
  }

  const g = globalThis as unknown as {
    window?: Record<string, unknown>;
    fetch?: typeof fetch;
  };
  const prevWindow = g.window;
  const prevFetch = g.fetch;
  const origPerfNow = performance.now.bind(performance);
  let fakeNowMs = 1000;
  performance.now = () => fakeNowMs;

  const urlTags: Array<[string, string]> = [
    ['fire-magic-6', 'INCENDIO'],
    ['swoosh-012', 'WINGARDIUM'],
    ['whoosh-transition-impact', 'STUPEFY'],
    ['bang-smoke-cloud', 'TELEPORT'],
  ];

  g.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = urlTags.find(([needle]) => url.includes(needle));
    if (!match) {
      return { ok: false, arrayBuffer: async () => new ArrayBuffer(0) } as Response;
    }
    const bytes = new Uint8Array(match[1].length);
    for (let i = 0; i < match[1].length; i++) bytes[i] = match[1].charCodeAt(i);
    return { ok: true, arrayBuffer: async () => bytes.buffer } as Response;
  }) as typeof fetch;

  g.window = { AudioContext: MockAudioContext };

  try {
    const engine = new ArcaneAudioEngine();

    // Before decoding: playEnemySpellCast is completely silent (no oscillator), while playPlayerHurt falls back to oscillator
    engine.playEnemySpellCast('incendio', 5);
    assert.equal(sources.length, 0);
    assert.equal(oscCount, 0);

    engine.playPlayerHurt(12);
    assert.equal(oscCount, 1);

    // Wait for spell buffers to finish decoding
    await new Promise((r) => setTimeout(r, 25));
    const oscAfterDecode = oscCount;

    // 1. Enemy spell cast > 22m is silently ignored
    engine.playEnemySpellCast('incendio', 25);
    assert.equal(sources.length, 0);

    // 2. Enemy spell volley at distance 11m: first plays, rapid follow-ups within 260ms are throttled
    fakeNowMs = 2000;
    engine.playEnemySpellCast('incendio', 11);
    engine.playEnemySpellCast('incendio', 11);
    engine.playEnemySpellCast('incendio', 11);
    assert.equal(sources.length, 1);

    const enemySrc = sources[0];
    const enemyGain = gains[gains.length - 1];
    assert.equal(enemySrc.buffer?.tag, 'INCENDIO');
    assert.ok(Math.abs(enemySrc.startCalls[0][1] - 0.098) < 0.001);
    assert.ok(Math.abs((enemySrc.stopCalls[0] ?? 0) - 30.56) < 0.001);
    assert.ok(enemySrc.playbackRate.value >= 0.8 && enemySrc.playbackRate.value <= 0.9);
    // distFactor = 1 - 11/22 = 0.5 -> vol = 0.095
    assert.ok(Math.abs(enemyGain.gain.setCalls[0][0] - 0.095) < 0.0001);
    assert.ok(Math.abs(enemyGain.gain.setCalls[1][1] - 30.43) < 0.001);
    assert.equal(enemyGain.gain.linearRampCalls[0][0], 0.0001);
    assert.ok(Math.abs(enemyGain.gain.linearRampCalls[0][1] - 30.55) < 0.001);
    enemySrc.onended?.();
    assert.equal(enemyGain.disconnected, true);

    // 3. After 260ms, un-decoded spell falls back to 'stupefy' and far distance clamps distFactor to 0.15
    fakeNowMs = 2300;
    engine.playEnemySpellCast('glacius', 21.5);
    assert.equal(sources.length, 2);
    assert.equal(sources[1].buffer?.tag, 'STUPEFY');
    assert.ok(Math.abs(gains[gains.length - 1].gain.setCalls[0][0] - 0.19 * 0.15) < 0.0001);

    // 4. Arrow swoosh uses 'wingardium'
    fakeNowMs = 2600;
    engine.playEnemySpellCast('wingardium', 0);
    assert.equal(sources.length, 3);
    assert.equal(sources[2].buffer?.tag, 'WINGARDIUM');
    assert.ok(Math.abs(gains[gains.length - 1].gain.setCalls[0][0] - 0.19) < 0.0001);

    // 5. playPlayerHurt uses decoded 'stupefy', scales gain by damage, throttles within 180ms, and never uses oscillator
    fakeNowMs = 3000;
    engine.playPlayerHurt(25);
    engine.playPlayerHurt(50); // throttled (< 180ms)
    assert.equal(sources.length, 4);
    assert.equal(oscCount, oscAfterDecode);

    const hurtSrc = sources[3];
    const hurtGain = gains[gains.length - 1];
    assert.equal(hurtSrc.buffer?.tag, 'STUPEFY');
    assert.ok(Math.abs(hurtSrc.startCalls[0][1] - 0.098) < 0.001);
    assert.ok(Math.abs((hurtSrc.stopCalls[0] ?? 0) - 30.46) < 0.001);
    assert.ok(hurtSrc.playbackRate.value >= 0.72 && hurtSrc.playbackRate.value <= 0.8);
    // damage=25 -> 0.32 + 0.5 * 0.18 = 0.41
    assert.ok(Math.abs(hurtGain.gain.setCalls[0][0] - 0.41) < 0.0001);
    assert.ok(Math.abs(hurtGain.gain.setCalls[1][1] - 30.33) < 0.001);
    assert.equal(hurtGain.gain.linearRampCalls[0][0], 0.0001);
    assert.ok(Math.abs(hurtGain.gain.linearRampCalls[0][1] - 30.45) < 0.001);
    hurtSrc.onended?.();
    assert.equal(hurtGain.disconnected, true);

    // High damage caps gain at 0.50 after throttle expires
    fakeNowMs = 3200;
    engine.playPlayerHurt(120);
    assert.equal(sources.length, 5);
    assert.ok(Math.abs(gains[gains.length - 1].gain.setCalls[0][0] - 0.5) < 0.0001);
  } finally {
    performance.now = origPerfNow;
    g.window = prevWindow;
    g.fetch = prevFetch;
  }
});
