#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const sync = require(path.join(__dirname, '..', '..', 'src', 'domain', 'obsidian-sync.js'));

const good = sync.evaluateVaultFolderContract({
  '': ['Learners/', 'Library/'],
  Learners: ['me/'],
  'Learners/me': ['Learning/', 'Gaps/'],
  Library: ['Drafts/', 'Canon/', 'Index.md'],
}, { learnerId: 'me' });
assert.strictEqual(good.ready, true);
assert.deepStrictEqual(good.missing, []);

const bad = sync.evaluateVaultFolderContract({
  '': ['Library/'],
  Learners: [],
  'Learners/me': ['Learning/'],
  Library: ['Drafts/'],
}, { learnerId: 'me' });
assert.strictEqual(bad.ready, false);
assert.ok(bad.missing.includes('Learners'));
assert.ok(bad.missing.includes('Learners/me'));
assert.ok(bad.missing.includes('Learners/me/Gaps'));
assert.ok(bad.missing.includes('Library/Canon'));

console.log('✅ vault folder contract evaluation tests passed');
