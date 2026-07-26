#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Helpers = require(path.join(__dirname, '../../src/domain/answer-classify-helpers.js'));

const ROOT = path.join(__dirname, '../..');
const verbs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/verbs.json'), 'utf8'));

// Current curriculum lemmas must recognize irregular/common past forms.
const CURRICULUM_PAST = {
  be: ['was', 'were', 'been'],
  do: ['did', 'done'],
  have: ['had'],
  get: ['got', 'gotten'],
  make: ['made'],
  take: ['took', 'taken'],
  give: ['gave', 'given'],
  go: ['went', 'gone'],
  come: ['came'],
  put: ['put'],
  keep: ['kept'],
  find: ['found'],
  feel: ['felt'],
  want: ['wanted'],
  need: ['needed'],
};

verbs.forEach((verb) => {
  const lemma = String(verb.word || '').toLowerCase();
  const pasts = CURRICULUM_PAST[lemma];
  assert.ok(pasts, `missing curriculum past fixture for ${lemma}`);
  pasts.forEach((form) => {
    assert.ok(
      Helpers.tokensIncludeVerb([form], lemma),
      `${lemma} should accept past/participle form "${form}"`
    );
  });
});

// Broader irregular pasts (future bank / vault sentences).
[
  ['leave', 'left'],
  ['bring', 'brought'],
  ['buy', 'bought'],
  ['catch', 'caught'],
  ['choose', 'chose'],
  ['drive', 'drove'],
  ['eat', 'ate'],
  ['fall', 'fell'],
  ['forget', 'forgot'],
  ['hear', 'heard'],
  ['hold', 'held'],
  ['lose', 'lost'],
  ['meet', 'met'],
  ['pay', 'paid'],
  ['run', 'ran'],
  ['say', 'said'],
  ['see', 'saw'],
  ['send', 'sent'],
  ['sit', 'sat'],
  ['sleep', 'slept'],
  ['speak', 'spoke'],
  ['spend', 'spent'],
  ['stand', 'stood'],
  ['teach', 'taught'],
  ['tell', 'told'],
  ['think', 'thought'],
  ['understand', 'understood'],
  ['wear', 'wore'],
  ['win', 'won'],
  ['write', 'wrote'],
  ['begin', 'began'],
  ['break', 'broke'],
  ['build', 'built'],
  ['know', 'knew'],
  ['throw', 'threw'],
  ['wake', 'woke'],
].forEach(([lemma, past]) => {
  assert.ok(Helpers.tokensIncludeVerb([past], lemma), `${lemma} should accept ${past}`);
});

// Wrong-engine past must still fail.
assert.ok(!Helpers.tokensIncludeVerb(['made'], 'do'));
assert.ok(!Helpers.tokensIncludeVerb(['went'], 'come'));
assert.ok(!Helpers.tokensIncludeVerb(['took'], 'make'));

// Article-only + irregular past (the original bug class).
assert.ok(Helpers.tokensIncludeVerb(['she', 'did', 'paperwork', 'this', 'morning'], 'do'));
assert.ok(Helpers.isMinorWordOnlyDiff(
  'she did paperwork this morning',
  'she did the paperwork this morning'
));
assert.ok(Helpers.tokensIncludeVerb(['i', 'made', 'mistake'], 'make'));
assert.ok(Helpers.isMinorWordOnlyDiff('i made mistake', 'i made a mistake'));
assert.ok(Helpers.tokensIncludeVerb(['we', 'went', 'to', 'store'], 'go'));
assert.ok(Helpers.isMinorWordOnlyDiff('we went to store', 'we went to the store'));
assert.ok(Helpers.tokensIncludeVerb(['i', 'got', 'message'], 'get'));
assert.ok(Helpers.isMinorWordOnlyDiff('i got message', 'i got the message'));
assert.ok(Helpers.tokensIncludeVerb(['it', 'took', 'hour'], 'take'));
assert.ok(Helpers.isMinorWordOnlyDiff('it took hour', 'it took an hour'));

assert.ok(!Helpers.isMinorWordOnlyDiff(
  'she did paperwork this morning',
  'she did the dishes this morning'
));

console.log('test_answer_classify_helpers: ok');
