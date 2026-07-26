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
assert.ok(bad.missing.includes('Learners/me/Gaps'));
assert.ok(bad.missing.includes('Library/Canon'));

// Local REST often omits folder names from vault-root LIST while child LIST works.
const rootOmitsFolders = sync.evaluateVaultFolderContract({
  '': ['MOC/', '_Archive/', 'README.md'],
  Learners: ['me/'],
  'Learners/me': ['Learning/', 'Gaps/'],
  Library: ['Drafts/', 'Canon/', 'Index.md'],
}, { learnerId: 'me' });
assert.strictEqual(rootOmitsFolders.ready, true, 'child listings should prove Learners/Library');
assert.deepStrictEqual(rootOmitsFolders.missing, []);

console.log('✅ vault folder contract evaluation tests passed');
