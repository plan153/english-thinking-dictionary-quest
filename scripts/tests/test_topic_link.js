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

assert.ok(TopicLink.topicsForExpression(bank[0]).includes('work'));
assert.ok(TopicLink.topicsForExpression(bank[2]).includes('time'));

// Without vault links, curated/topic fallback still works.
const fallbackPick = TopicLink.pickLinkedExpression('e_sub', bank, { mode: 'continue', vaultLinks: [] });
assert.strictEqual(fallbackPick.id, 'e_bus');

const VaultOverlay = require(path.join(__dirname, '../../src/domain/vault-overlay.js'));
const rawVaultLinks = [
  {
    id: 'Library/Scenes/commute.md::verb::v_take',
    notePath: 'Library/Scenes/commute.md',
    entityType: 'verb',
    entityId: 'v_take',
    confidence: 'high',
    status: 'confirmed',
    relatedExpressionIds: ['e_sub', 'e_time'],
  },
  {
    id: 'Library/Scenes/commute.md::expression::e_money',
    notePath: 'Library/Scenes/commute.md',
    entityType: 'expression',
    entityId: 'e_money',
    confidence: 'medium',
    status: 'confirmed',
    relatedExpressionIds: [],
  },
];
const vaultLinks = VaultOverlay.buildLiveExpandLinks(rawVaultLinks, [], {
  expressions: bank,
  verbs: [{ id: 'v_take', word: 'take' }],
  nouns: [],
  patterns: [],
});

const vaultScores = TopicLink.vaultNeighborStrengthMap(bank[0], bank, vaultLinks);
assert.ok((vaultScores.get('e_time') || 0) > 0, 'vault should link subway → time via shared verb note');
assert.ok((vaultScores.get('e_money') || 0) > 0, 'same notePath bridges money expression');

const historyByExpressionId = {
  e_time: { connections: { recognition: { strength: 3 }, assembly: { strength: 3 }, output: { strength: 2 } } },
  e_money: { connections: { recognition: { strength: 0 }, assembly: { strength: 0 }, output: { strength: 0 } } },
};

const vaultPick = TopicLink.pickLinkedExpression('e_sub', bank, {
  mode: 'continue',
  vaultLinks,
  historyByExpressionId,
});
assert.ok(['e_time', 'e_money'].includes(vaultPick.id), 'continue should stay inside vault neighbors');
assert.notStrictEqual(vaultPick.id, 'e_hobby', 'unrelated hobby must not win when vault neighbors exist');

const timeScore = TopicLink.scoreLink(bank[0], bank[2], {
  mode: 'continue',
  vaultLinks,
  historyByExpressionId,
  bank,
});
const hobbyScore = TopicLink.scoreLink(bank[0], bank[4], {
  mode: 'continue',
  vaultLinks,
  historyByExpressionId,
  bank,
});
assert.ok(timeScore > hobbyScore, 'vault neighbor must outrank topic-only hobby');

console.log('✅ topic-link tests passed');
