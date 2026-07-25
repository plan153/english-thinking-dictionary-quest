#!/usr/bin/env node
const assert = require('assert');
const overlay = require('../../src/domain/vault-overlay.js');

const verbMd = `---
id: v_have
type: verb
word: have
aliases: [has, had]
---

# have

Core image: hold.

See [[Patterns/have + noun]] and [[Nouns/question]].
`;

const note = overlay.parseVaultNote(verbMd, 'Library/Verbs/have.md');
assert.strictEqual(note.id, 'v_have');
assert.strictEqual(note.type, 'verb');
assert.strictEqual(note.word, 'have');
assert.deepStrictEqual(note.aliases, ['has', 'had']);
assert.ok(note.wikiLinks.some(link => link.includes('Patterns/')));

const catalog = {
  verbs: [
    { id: 'v_have', word: 'have', coreImage: 'x' },
    { id: 'v_give', word: 'give', coreImage: 'y' },
  ],
  nouns: [{ id: 'n_question', word: 'question', category: 'thing' }],
  patterns: [{ id: 'p_have_thing', label: 'have + noun' }],
  expressions: [
    { id: 'e001', coreVerbId: 'v_have', patternId: 'p_have_thing', nounIds: ['n_question'], english: 'I have a question.' },
    { id: 'e002', coreVerbId: 'v_have', patternId: 'p_have_thing', nounIds: ['n_question'], english: 'Do you have a question?' },
    { id: 'e999', coreVerbId: 'v_give', patternId: 'p_x', nounIds: [], english: 'Give it a try.' },
  ],
};

const high = overlay.matchNoteToCatalog(note, catalog);
assert.strictEqual(high.confidence, 'high');
assert.strictEqual(high.entityId, 'v_have');
assert.ok(high.relatedExpressionIds.includes('e001'));

const aliasNote = overlay.parseVaultNote(`---\ntype: verb\nword: mystery\naliases: [have]\n---\n`, 'Verbs/mystery.md');
const medium = overlay.matchNoteToCatalog(aliasNote, catalog);
assert.strictEqual(medium.confidence, 'medium');
assert.strictEqual(medium.entityId, 'v_have');

const unknown = overlay.matchNoteToCatalog(
  overlay.parseVaultNote('---\ntype: verb\nword: blorp\n---\n', 'Library/Verbs/blorp.md'),
  catalog
);
assert.strictEqual(unknown.confidence, 'low');

const index = overlay.buildOverlayIndex([note, unknown.note], catalog, {
  unlockedVerbIds: ['v_have'],
  unlockedExpressionIds: ['e001'],
});
assert.strictEqual(index.byGate.active.length, 1);
assert.strictEqual(index.byGate.candidate.length, 1);

const lockedVerb = overlay.matchNoteToCatalog(
  overlay.parseVaultNote('---\nid: v_give\ntype: verb\nword: give\n---\n', 'Library/Verbs/give.md'),
  catalog
);
assert.strictEqual(
  overlay.classifyGate({ ...lockedVerb, relatedExpressionIds: ['e999'] }, {
    unlockedVerbIds: ['v_have'],
    unlockedExpressionIds: ['e001'],
  }),
  'unlock-later'
);

const expressionNote = overlay.parseVaultNote(`---
id: e001
type: expression
word: question
---
`, 'Library/Scenes/question.md');
const expressionMatch = overlay.matchNoteToCatalog(expressionNote, catalog);
assert.strictEqual(expressionMatch.entityType, 'expression');
assert.strictEqual(expressionMatch.entityId, 'e001');
assert.ok(expressionMatch.relatedExpressionIds.includes('e002'), 'expression vault links must expose neighbors');
assert.ok(!expressionMatch.relatedExpressionIds.includes('e001'));

const live = overlay.buildLiveExpandLinks(
  [{
    id: 'Library/Scenes/commute.md::verb::v_have',
    notePath: 'Library/Scenes/commute.md',
    entityType: 'verb',
    entityId: 'v_have',
    confidence: 'high',
    status: 'confirmed',
    relatedExpressionIds: ['e001'],
  }],
  [{
    note: { path: 'Library/Scenes/commute.md', word: 'question' },
    entityType: 'expression',
    entityId: 'e001',
    entityLabel: 'question',
    confidence: 'high',
    gate: 'active',
    relatedExpressionIds: expressionMatch.relatedExpressionIds,
  }],
  catalog
);
assert.ok(live.length >= 2, 'same notePath must keep multiple entity links');
assert.ok(live.every(link => (link.relatedExpressionIds || []).length >= 0));
assert.ok(overlay.DEFAULT_DIRS.some(dir => dir.includes('Scenes')));

const curatedBridge = overlay.buildLiveExpandLinks(
  [{
    id: 'Library/Scenes/bridge.md::verb::v_have',
    notePath: 'Library/Scenes/bridge.md',
    entityType: 'verb',
    entityId: 'v_have',
    confidence: 'high',
    status: 'confirmed',
    relatedExpressionIds: ['e999'],
  }],
  [],
  catalog
);
const bridgeRelated = curatedBridge[0]?.relatedExpressionIds || [];
assert.ok(bridgeRelated.includes('e999'), 'refresh must keep vault-curated related ids');
assert.ok(bridgeRelated.includes('e001'), 'refresh must also merge catalog neighbors');

const calls = [];
const fakeClient = {
  async listDirectory(dir) {
    calls.push(['list', dir]);
    if (dir === 'Library/Verbs') return ['have.md', 'skip.txt'];
    return [];
  },
  async getFile(path) {
    calls.push(['get', path]);
    if (path === 'Library/Verbs/have.md') return verbMd;
    return null;
  },
};

(async () => {
  const fetched = await overlay.fetchVaultOverlayNotes(fakeClient, { dirs: ['Library/Verbs', 'Missing'] });
  assert.strictEqual(fetched.notes.length, 1);
  assert.strictEqual(fetched.notes[0].id, 'v_have');
  console.log('✅ vault-overlay tests passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
