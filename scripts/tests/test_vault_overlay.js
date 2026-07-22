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
