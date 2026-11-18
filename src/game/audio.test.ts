import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_PREFS_STORAGE_KEY,
  VoiceSpellRecognizer,
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
