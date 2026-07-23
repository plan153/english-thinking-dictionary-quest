#!/usr/bin/env node
const assert = require('assert');
const progress = require('../../src/domain/progress-store.js');
const ass = require('../../src/domain/active-speaking-set.js');
const exp = require('../../src/domain/english-brain-export.js');
const sync = require('../../src/domain/obsidian-sync.js');

const memory = {
  data: {},
  getItem(k) { return this.data[k] ?? null; },
  setItem(k, v) { this.data[k] = String(v); },
  removeItem(k) { delete this.data[k]; },
};

const store = progress.ensureLearnerProfiles(memory);
assert.strictEqual(store.activeLearnerId, 'me');
const key = progress.getProgressStorageKey('me');
assert.ok(key.includes('etdQuestProgress:me'));

const defaults = progress.defaultProgress();
assert.ok(Array.isArray(defaults.explanations));
progress.writeProgressPayload({ ...defaults, xp: 12 }, 'me', memory, null);
const loaded = progress.loadProgress('me', { storage: memory });
assert.strictEqual(loaded.xp, 12);

const cfg = ass.normalizeAssConfig(null);
assert.strictEqual(cfg.verbIds.length, 1);
assert.strictEqual(cfg.verbIds[0], 'v_have');
assert.ok(cfg.verbUnlockPacks.map(p => p.id).includes('verb_pack_get'));
assert.ok(cfg.verbUnlockPacks.map(p => p.id).includes('verb_pack_take'));
const unlocked = ass.listUnlockedExpressionIds(cfg, { unlockedPackCount: 0 }, { includeVerbPacks: false });
assert.strictEqual(unlocked.length, 40);
assert.ok(ass.isExpressionInUnlockedSet('e001', cfg, { unlockedPackCount: 0 }));

const bundle = exp.buildBundleJson({
  learnerId: 'me',
  learnerName: '나',
  files: { 'a.md': '# a' },
  gapNotes: [],
});
assert.strictEqual(bundle.version, 1);
assert.strictEqual(bundle.fileCount || Object.keys(bundle.files).length, 1);

const driveSettings = sync.normalizeSettings({
  adapter: 'drive-webhook',
  webhookUrl: 'https://example.test/hook',
  apiKey: 'secret',
});
assert.strictEqual(driveSettings.adapter, 'drive-webhook');

const posts = [];
const driveClient = sync.createDriveWebhookClient(driveSettings, async (url, options = {}) => {
  posts.push({ url, body: JSON.parse(options.body) });
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ ok: true }),
    text: async () => '',
  };
});
assert.strictEqual(driveClient.kind, 'drive-webhook');
(async () => {
  await driveClient.ping();
  await driveClient.postBackup({ files: { 'Learners/me/Learning/Progress.md': '# p' }, learnerId: 'me' });
  assert.strictEqual(posts[0].body.type, 'ping');
  assert.strictEqual(posts[1].body.type, 'english-brain-backup');
  assert.ok(posts[1].body.files['Learners/me/Learning/Progress.md']);
  console.log('✅ progress-store + ASS + export + drive-webhook tests passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
