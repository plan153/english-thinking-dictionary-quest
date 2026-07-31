#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const ProgressStore = require(path.join(__dirname, '../../src/domain/progress-store.js'));

const open = ProgressStore.normalizeGapNote({ expressionId: 'e1', status: 'open', guess: 'x' });
assert.strictEqual(open.status, 'open');

const reviewed = ProgressStore.normalizeGapNote({ expressionId: 'e1', status: 'reviewed', missedClue: 'the' });
assert.strictEqual(reviewed.status, 'reviewed');
assert.strictEqual(reviewed.missedClue, 'the');

const archived = ProgressStore.normalizeGapNote({ expressionId: 'e1', status: 'archived' });
assert.strictEqual(archived.status, 'archived');

const junk = ProgressStore.normalizeGapNote({ expressionId: 'e1', status: 'weird' });
assert.strictEqual(junk.status, 'open');

console.log('test_gap_note_status: ok');
