#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const qa = require(path.join(__dirname, '../../data/qa-matrices.json'));

function findForm(matrix, formId) {
  return (matrix.forms || []).find(form => form.id === formId) || null;
}

assert.ok(Array.isArray(qa.matrices) && qa.matrices.length > 0, 'qa-matrices must have matrices');

for (const matrix of qa.matrices) {
  const statement = findForm(matrix, 'statement');
  const question = findForm(matrix, 'question');
  const shortYes = findForm(matrix, 'shortYes');
  const shortNo = findForm(matrix, 'shortNo');

  assert.ok(statement?.en, `${matrix.id} needs statement`);
  assert.ok(question?.en, `${matrix.id} needs question`);
  assert.ok(shortYes?.en, `${matrix.id} needs shortYes`);
  assert.strictEqual(question.baseFormId, 'statement', `${matrix.id} question must link to statement`);
  assert.strictEqual(shortYes.baseFormId, 'question', `${matrix.id} shortYes must link to question`);
  if (shortNo) {
    assert.strictEqual(shortNo.baseFormId, 'question', `${matrix.id} shortNo must link to question`);
  }
}

console.log(`✅ expand ask/answer matrix chains ok (${qa.matrices.length} matrices)`);
