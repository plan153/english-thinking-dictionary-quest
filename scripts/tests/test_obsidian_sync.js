#!/usr/bin/env node
const assert = require('assert');
const sync = require('../../src/domain/obsidian-sync.js');

const memory = {
  data: {},
  getItem(key) { return this.data[key] ?? null; },
  setItem(key, value) { this.data[key] = String(value); },
};

const settings = sync.saveSettings({
  adapter: 'local-rest',
  baseUrl: 'http://127.0.0.1:27123/',
  apiKey: 'test-key',
  pathPrefix: 'Project_English',
  autoSyncAfterGap: true,
}, memory);
assert.strictEqual(settings.baseUrl, 'http://127.0.0.1:27123');
assert.strictEqual(settings.pathPrefix, 'Project_English');
assert.strictEqual(sync.loadSettings(memory).apiKey, 'test-key');

assert.strictEqual(sync.withPrefix('Project_English', 'Gaps/a.md'), 'Project_English/Gaps/a.md');
assert.strictEqual(sync.withPrefix('', 'Gaps/a.md'), 'Gaps/a.md');
assert.strictEqual(sync.encodeVaultPath('Learning/Next Practice.md'), 'Learning/Next%20Practice.md');

const gapMd = `---
type: gap-note
id: gap_e002_test
vaultPath: Gaps/gap_e002_test.md
expressionId: e002
mode: koen
createdAt: 2026-07-22T00:00:00Z
updatedAt: 2026-07-22T01:00:00Z
status: open
source: webapp
---

# Gap · I need some time.

## 내 추측
I need time

## 실제 의미 / 정답
I need some time.
- 한국어: 시간이 좀 필요해요.

## 놓친 단서
some

## 모델 업데이트
need + some time
`;
const parsedGap = sync.parseGapNoteMarkdown(gapMd, 'Gaps/gap_e002_test.md');
assert.strictEqual(parsedGap.id, 'gap_e002_test');
assert.strictEqual(parsedGap.expressionId, 'e002');
assert.strictEqual(parsedGap.missedClue, 'some');
assert.strictEqual(parsedGap.naturalKorean, '시간이 좀 필요해요.');

const nextMd = `---
type: next-practice
updatedAt: 2026-07-22T02:00:00Z
queue:
  - { expressionId: e010, mode: matrix, reason: question-form }
  - { expressionId: e002, mode: review, reason: weak-output }
source: webapp
---

# Next Practice
`;
const next = sync.parseNextPracticeMarkdown(nextMd);
assert.strictEqual(next.queue.length, 2);
assert.strictEqual(next.queue[0].expressionId, 'e010');
assert.strictEqual(next.queue[0].mode, 'matrix');

const mergedGaps = sync.mergeGapNotes(
  [{ id: 'gap_local', expressionId: 'e001', status: 'open', missedClue: 'old', source: 'webapp' }],
  [{ id: 'gap_local', expressionId: 'e001', status: 'open', missedClue: 'vault-edit', modelUpdate: 'from vault' },
   { id: 'gap_vault_only', expressionId: 'e099', status: 'open', missedClue: 'new' }]
);
const localMerged = mergedGaps.find(g => g.id === 'gap_local');
assert.strictEqual(localMerged.missedClue, 'vault-edit');
assert.strictEqual(localMerged.modelUpdate, 'from vault');
assert.ok(mergedGaps.some(g => g.id === 'gap_vault_only'));
assert.ok(mergedGaps.find(g => g.id === 'gap_local' && g.missingInVault === false));

const appOnly = sync.mergeGapNotes(
  [{ id: 'gap_missing', expressionId: 'e003', status: 'open', source: 'webapp' }],
  []
);
assert.strictEqual(appOnly[0].missingInVault, true);

// Conflict by updatedAt: newer local narrative wins
const timeLocalWins = sync.mergeGapNotes(
  [{
    id: 'gap_time',
    expressionId: 'e001',
    status: 'open',
    missedClue: 'local-new',
    modelUpdate: 'from-local',
    updatedAt: '2026-07-22T05:00:00Z',
    source: 'webapp',
  }],
  [{
    id: 'gap_time',
    expressionId: 'e001',
    status: 'open',
    missedClue: 'vault-old',
    modelUpdate: 'from-vault',
    updatedAt: '2026-07-22T01:00:00Z',
  }]
);
assert.strictEqual(timeLocalWins[0].missedClue, 'local-new');
assert.strictEqual(timeLocalWins[0].modelUpdate, 'from-local');
assert.strictEqual(timeLocalWins[0].conflictResolvedBy, 'local-newer');

const timeVaultWins = sync.mergeGapNotes(
  [{
    id: 'gap_time2',
    expressionId: 'e001',
    missedClue: 'local-old',
    updatedAt: '2026-07-22T01:00:00Z',
    source: 'webapp',
  }],
  [{
    id: 'gap_time2',
    expressionId: 'e001',
    missedClue: 'vault-new',
    updatedAt: '2026-07-22T06:00:00Z',
  }]
);
assert.strictEqual(timeVaultWins[0].missedClue, 'vault-new');
assert.strictEqual(timeVaultWins[0].conflictResolvedBy, 'vault-newer');

const tie = sync.pickNarrativeSide(
  { updatedAt: '2026-07-22T02:00:00Z' },
  { updatedAt: '2026-07-22T02:00:00Z' }
);
assert.strictEqual(tie.reason, 'vault-tie');

// Additional conflict field coverage
const narrativeFields = sync.mergeGapNotes(
  [{
    id: 'gap_fields',
    expressionId: 'e001',
    guess: 'local-guess',
    actual: 'local-actual',
    naturalKorean: '로컬',
    status: 'open',
    updatedAt: '2026-07-22T01:00:00Z',
    source: 'webapp',
  }],
  [{
    id: 'gap_fields',
    expressionId: 'e001',
    guess: 'vault-guess',
    actual: 'vault-actual',
    naturalKorean: '볼트',
    status: 'archived',
    updatedAt: '2026-07-22T09:00:00Z',
  }]
);
assert.strictEqual(narrativeFields[0].guess, 'vault-guess');
assert.strictEqual(narrativeFields[0].actual, 'vault-actual');
assert.strictEqual(narrativeFields[0].naturalKorean, '볼트');
assert.strictEqual(narrativeFields[0].status, 'archived');
assert.strictEqual(narrativeFields[0].conflictResolvedBy, 'vault-newer');

const equalEmpty = sync.pickNarrativeSide({ updatedAt: null }, { updatedAt: '' });
assert.strictEqual(equalEmpty.reason, 'vault-tie');

const brainMd = `---
type: brain-state
updatedAt: 2026-07-22T03:00:00Z
activeVerbIds: [v_get, v_need]
weakSlots:
  - { expressionId: e010, reason: output-low }
  - { expressionId: e002, reason: weak-link }
unlockReady: false
source: webapp
---

# Brain State

## 열린 간극
- [[Gaps/gap_e002_test]]
- (없음 무시)
`;
const brain = sync.parseBrainStateMarkdown(brainMd);
assert.strictEqual(brain.weakSlots.length, 2);
assert.strictEqual(brain.weakSlots[0].expressionId, 'e010');
assert.ok(brain.activeVerbIds.includes('v_get'));
assert.ok(brain.openGapIds.includes('gap_e002_test'));

const mergedBrain = sync.mergeBrainStateHints(null, brain);
assert.strictEqual(mergedBrain.source, 'vault');
assert.strictEqual(mergedBrain.weakSlots[0].expressionId, 'e010');

const bridgeSettings = sync.normalizeSettings({ adapter: 'bridge', apiKey: 'bridge-key' });
assert.strictEqual(bridgeSettings.adapter, 'bridge');
assert.strictEqual(bridgeSettings.baseUrl, 'http://127.0.0.1:8787');
const bridgeClient = sync.createSyncClient(bridgeSettings, async () => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => ({ status: 'OK', authenticated: true }),
  text: async () => '',
}));
assert.strictEqual(bridgeClient.kind, 'bridge');

const mergedNext = sync.mergeNextPractice(
  [{ expressionId: 'e001', mode: 'review', reason: 'app' }],
  next
);
assert.strictEqual(mergedNext.source, 'vault');
assert.strictEqual(mergedNext.queue[0].expressionId, 'e010');

const calls = [];
const fakeFetch = async (url, options = {}) => {
  calls.push({ url, method: options.method, body: options.body, headers: options.headers });
  if (String(url).replace(/\/$/, '') === 'http://127.0.0.1:27123' && options.method === 'GET') {
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'OK', authenticated: true }),
      text: async () => '',
    };
  }
  if (options.method === 'PUT') {
    return { ok: true, status: 204, text: async () => '', headers: { get: () => '' } };
  }
  if (options.method === 'GET' && String(url).includes('/Gaps/') && String(url).endsWith('/')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ files: ['gap_e002_test.md'] }),
      text: async () => '',
      headers: { get: () => 'application/json' },
    };
  }
  if (options.method === 'GET' && String(url).includes('gap_e002_test.md')) {
    return {
      ok: true,
      status: 200,
      text: async () => gapMd,
      headers: { get: () => 'text/markdown' },
    };
  }
  if (options.method === 'GET' && String(url).includes('Next%20Practice.md')) {
    return {
      ok: true,
      status: 200,
      text: async () => nextMd,
      headers: { get: () => 'text/markdown' },
    };
  }
  if (options.method === 'GET' && String(url).includes('Brain%20State.md')) {
    return {
      ok: true,
      status: 200,
      text: async () => brainMd,
      headers: { get: () => 'text/markdown' },
    };
  }
  return { ok: false, status: 500, text: async () => 'no', headers: { get: () => '' } };
};

// P2b parsers / merges
const progressMd = `---
type: progress
xp: 120
streak: 4
unlockedPackCount: 2
updatedAt: 2026-07-23T00:00:00Z
source: vault
---

# Progress
`;
const parsedProgress = sync.parseProgressMarkdown(progressMd);
assert.strictEqual(parsedProgress.xp, 120);
assert.strictEqual(parsedProgress.streak, 4);
const progressMerge = sync.mergeProgressFromVault(
  { xp: 50, streak: 2, curriculum: { unlockedPackCount: 1 } },
  parsedProgress,
  { enabled: true, mode: 'max' }
);
assert.strictEqual(progressMerge.progress.xp, 120);
assert.strictEqual(progressMerge.progress.curriculum.unlockedPackCount, 2);

const explanationMd = `---
type: explanation
id: exp_test_1
expressionId: e001
english: I have a question.
updatedAt: 2026-07-23T12:00:00Z
---

I use have + question.
`;
const parsedExplanation = sync.parseExplanationMarkdown(explanationMd, 'Learners/me/Learning/Explanations/exp_test_1.md');
assert.strictEqual(parsedExplanation.id, 'exp_test_1');
assert.ok(parsedExplanation.explanation.includes('have + question'));
const explanationMerge = sync.mergeExplanationsFromVault([], [parsedExplanation], { enabled: true });
assert.strictEqual(explanationMerge.added, 1);

// P2c drive-oauth settings (secrets stay in memory storage only)
const oauthSettings = sync.saveSettings({
  adapter: 'drive-oauth',
  googleClientId: 'client.apps.googleusercontent.com',
  googleAccessToken: 'ya29.test-token',
  driveFolderId: 'folder123',
}, memory);
assert.strictEqual(oauthSettings.adapter, 'drive-oauth');
assert.strictEqual(sync.loadSettings(memory).googleAccessToken, 'ya29.test-token');

async function main() {
  const client = sync.createLocalRestClient(settings, fakeFetch);
  const ping = await client.ping();
  assert.strictEqual(ping.authenticated, true);

  const upsert = await sync.upsertFiles(client, {
    'Learning/Brain State.md': '# brain\n',
    'Gaps/gap_e002_test.md': gapMd,
  }, { storage: memory, enqueueOnFail: true });
  assert.strictEqual(upsert.ok.length, 2);
  assert.ok(calls.some(c => c.method === 'PUT' && c.url.includes('Project_English/Learning/Brain%20State.md')));
  assert.ok(calls.some(c => c.headers.Authorization === 'Bearer test-key'));

  const imported = await sync.importGapsAndNextPractice(client, {
    localGaps: [{ id: 'gap_e002_test', expressionId: 'e002', missedClue: 'old', status: 'open', source: 'webapp' }],
    appQueue: [],
  });
  assert.strictEqual(imported.mergedGaps.find(g => g.id === 'gap_e002_test').missedClue, 'some');
  assert.strictEqual(imported.nextPractice.queue[0].expressionId, 'e010');
  assert.strictEqual(imported.brainState.source, 'vault');
  assert.strictEqual(imported.brainState.weakSlots[0].expressionId, 'e010');

  const failingFetch = async () => ({
    ok: false,
    status: 503,
    text: async () => 'down',
    headers: { get: () => '' },
  });
  const failClient = sync.createLocalRestClient(settings, failingFetch);
  const failed = await sync.upsertFiles(failClient, { 'Gaps/x.md': 'x' }, { storage: memory });
  assert.strictEqual(failed.failed.length, 1);
  assert.ok(sync.loadQueue(memory).some(job => job.path === 'Gaps/x.md'));


  const importedLearner = await sync.importGapsAndNextPractice(client, {
    personalRoot: 'Learners/me',
    localGaps: [],
    appQueue: [],
  });
  // Without matching fake routes this may be empty; ensure API accepts personalRoot
  assert.strictEqual(importedLearner.personalRoot, 'Learners/me');

  const graphCalls = [];
  const graphFetch = async (url, options = {}) => {
    graphCalls.push({ url, method: options.method });
    if (String(url).replace(/\/$/, '') === 'http://127.0.0.1:27123' && options.method === 'GET') {
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ status: 'OK', authenticated: true }),
        text: async () => '',
      };
    }
    if (options.method === 'POST' && String(url).includes('/commands/graph:open')) {
      return { ok: true, status: 204, text: async () => '', headers: { get: () => '' } };
    }
    return { ok: false, status: 500, text: async () => 'no', headers: { get: () => '' } };
  };
  const opened = await sync.openObsidianVaultGraph({
    adapter: 'local-rest',
    baseUrl: 'http://127.0.0.1:27123',
    apiKey: 'test-key',
  }, graphFetch);
  assert.strictEqual(opened.ok, true);
  assert.strictEqual(opened.commandId, 'graph:open');
  assert.ok(graphCalls.some(call => call.method === 'POST' && String(call.url).includes('/commands/graph:open/')));

  let unsupported = null;
  try {
    await sync.openObsidianVaultGraph({ adapter: 'download', apiKey: 'x' }, graphFetch);
  } catch (error) {
    unsupported = error;
  }
  assert.strictEqual(unsupported?.code, 'ADAPTER_UNSUPPORTED');

  console.log('✅ obsidian-sync tests passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
