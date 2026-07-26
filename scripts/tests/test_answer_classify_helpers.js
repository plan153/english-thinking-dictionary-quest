#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const Helpers = require(path.join(__dirname, '../../src/domain/answer-classify-helpers.js'));

assert.ok(Helpers.tokensIncludeVerb(['she', 'did', 'paperwork', 'this', 'morning'], 'do'));
assert.ok(Helpers.tokensIncludeVerb(['she', 'does', 'the', 'shopping'], 'do'));
assert.ok(Helpers.tokensIncludeVerb(new Set(['i', 'am', 'doing', 'the', 'taxes']), 'do'));
assert.ok(!Helpers.tokensIncludeVerb(['she', 'made', 'the', 'paperwork'], 'do'));

assert.ok(Helpers.tokensIncludeVerb(['they', 'were', 'ready'], 'be'));
assert.ok(Helpers.tokensIncludeVerb(['he', 'got', 'home'], 'get'));
assert.ok(Helpers.tokensIncludeVerb(['she', 'wants', 'a', 'break'], 'want'));

assert.ok(Helpers.isMinorWordOnlyDiff(
  'she did paperwork this morning',
  'she did the paperwork this morning'
));
assert.ok(Helpers.isMinorWordOnlyDiff(
  'i need a minute',
  'i need the minute'
));
assert.ok(!Helpers.isMinorWordOnlyDiff(
  'she did paperwork this morning',
  'she did the dishes this morning'
));
assert.ok(!Helpers.isMinorWordOnlyDiff(
  'she did the paperwork this morning',
  'she did the paperwork this morning'
));

console.log('test_answer_classify_helpers: ok');
