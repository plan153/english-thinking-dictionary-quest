#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const TopicLink = require(path.join(__dirname, '../../src/domain/topic-link.js'));

const bank = [
  {
    id: 'e_sub',
    en: 'She takes the subway to work.',
    ko: '그녀는 출근할 때 지하철을 타.',
    coreVerbId: 'v_take',
    situationTags: ['work'],
    nounIds: ['n_work'],
    relatedExpressionIds: ['e_bus'],
  },
  {
    id: 'e_bus',
    en: 'I take the bus.',
    ko: '버스를 타.',
    coreVerbId: 'v_take',
    situationTags: ['travel', 'work'],
    nounIds: ['n_way'],
  },
  {
    id: 'e_time',
    en: 'Do you have a minute?',
    ko: '잠깐 시간 있어요?',
    coreVerbId: 'v_have',
    situationTags: ['schedule'],
    nounIds: ['n_minute', 'n_time'],
  },
  {
    id: 'e_money',
    en: 'How much is it?',
    ko: '얼마예요?',
    coreVerbId: 'v_be',
    situationTags: ['shopping'],
    nounIds: [],
  },
  {
    id: 'e_hobby',
    en: 'That sounds fun.',
    ko: '재밌겠다.',
    coreVerbId: 'v_sound',
    situationTags: ['social'],
    nounIds: ['n_fun'],
  },
];

assert.deepStrictEqual(TopicLink.topicsForExpression(bank[0]).sort(), ['travel', 'work'].sort());
assert.ok(TopicLink.topicsForExpression(bank[2]).includes('time'));
assert.ok(TopicLink.topicsForExpression(bank[3]).includes('money'));
assert.ok(TopicLink.topicsForExpression(bank[4]).includes('hobby'));

const continuePick = TopicLink.pickLinkedExpression('e_sub', bank, { mode: 'continue' });
assert.strictEqual(continuePick.id, 'e_bus');

const timeOnlyBank = bank.filter(item => item.id !== 'e_sub' && item.id !== 'e_bus');
const timeContinue = TopicLink.pickLinkedExpression('e_time', timeOnlyBank, { mode: 'continue' });
assert.ok(timeContinue && timeContinue.id !== 'e_time');

const workScore = TopicLink.scoreLink(bank[0], bank[1], { mode: 'continue' });
const moneyScore = TopicLink.scoreLink(bank[0], bank[3], { mode: 'continue' });
assert.ok(workScore > moneyScore);

console.log('✅ topic-link tests passed');
