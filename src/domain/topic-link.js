/**
 * Topic / situation linking for continue & topic-shift expand choices.
 * Browser: window.TopicLink
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TopicLink = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TOPIC_DEFS = [
    {
      id: 'money',
      tags: ['money', 'pay', 'cost', 'shopping'],
      nouns: ['n_money', 'n_cash', 'n_bill', 'n_price', 'n_pay'],
      keywords: ['money', 'pay', 'cash', 'bill', 'price', 'cost', 'buy', 'expensive', 'cheap', '돈', '계산', '비싸', '싸'],
    },
    {
      id: 'time',
      tags: ['schedule', 'time'],
      nouns: ['n_time', 'n_minute', 'n_hour', 'n_tomorrow', 'n_today', 'n_week', 'n_day', 'n_morning', 'n_night'],
      keywords: ['time', 'minute', 'hour', 'tomorrow', 'today', 'schedule', 'late', 'early', 'wait', '시간', '분', '내일', '오늘', '늦', '일찍'],
    },
    {
      id: 'hobby',
      tags: ['hobby', 'fun', 'leisure', 'social', 'event'],
      nouns: ['n_fun', 'n_hobby', 'n_game', 'n_movie', 'n_music'],
      keywords: ['fun', 'hobby', 'movie', 'music', 'game', 'play', '취미', '재미', '영화', '음악', '놀'],
    },
    {
      id: 'work',
      tags: ['work', 'office', 'meeting', 'business'],
      nouns: ['n_work', 'n_meeting', 'n_office', 'n_job'],
      keywords: ['work', 'office', 'meeting', 'job', 'subway', 'commute', '출근', '회사', '회의', '지하철', '일'],
    },
    {
      id: 'food',
      tags: ['food', 'meal', 'cafe', 'hospitality'],
      nouns: ['n_coffee', 'n_lunch', 'n_dinner', 'n_food', 'n_water', 'n_meal'],
      keywords: ['coffee', 'lunch', 'dinner', 'eat', 'food', 'water', 'meal', '커피', '점심', '저녁', '먹', '물'],
    },
    {
      id: 'travel',
      tags: ['travel', 'transport'],
      nouns: ['n_way', 'n_home', 'n_here', 'n_there', 'n_bus', 'n_train'],
      keywords: ['travel', 'trip', 'bus', 'train', 'subway', 'airport', 'way', 'home', '여행', '버스', '지하철', '기차', '길', '집'],
    },
    {
      id: 'home',
      tags: ['home'],
      nouns: ['n_home', 'n_house', 'n_room'],
      keywords: ['home', 'house', 'room', '집', '방'],
    },
    {
      id: 'health',
      tags: ['health', 'emotion', 'comfort', 'encouragement', 'support'],
      nouns: ['n_feeling', 'n_help', 'n_break'],
      keywords: ['tired', 'sick', 'feel', 'health', 'rest', 'break', '피곤', '아프', '쉬', '건강', '기분'],
    },
    {
      id: 'learning',
      tags: ['learning', 'class', 'study', 'progress'],
      nouns: ['n_question', 'n_idea', 'n_try'],
      keywords: ['learn', 'study', 'class', 'question', 'idea', 'try', '배우', '공부', '수업', '질문', '생각'],
    },
    {
      id: 'social',
      tags: ['conversation', 'social', 'phone', 'message', 'request', 'farewell'],
      nouns: ['n_call', 'n_message', 'n_you', 'n_me'],
      keywords: ['call', 'message', 'talk', 'meet', 'thanks', '전화', '문자', '만나', '고마'],
    },
  ];

  function textOf(item) {
    return [
      item?.en,
      item?.english,
      item?.ko,
      item?.naturalKorean,
      item?.literalMeaning,
      item?.frame,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function topicsForExpression(item) {
    if (!item) return [];
    const tags = new Set((item.situationTags || []).map(tag => String(tag).toLowerCase()));
    const nouns = new Set((item.nounIds || []).map(id => String(id).toLowerCase()));
    const hay = textOf(item);
    const found = [];
    TOPIC_DEFS.forEach(topic => {
      let hit = false;
      if (topic.tags.some(tag => tags.has(tag))) hit = true;
      if (!hit && topic.nouns.some(id => nouns.has(id))) hit = true;
      if (!hit && topic.keywords.some(word => hay.includes(String(word).toLowerCase()))) hit = true;
      if (hit) found.push(topic.id);
    });
    return found;
  }

  function sharedCount(a, b) {
    const left = new Set(a || []);
    let count = 0;
    (b || []).forEach(value => {
      if (left.has(value)) count += 1;
    });
    return count;
  }

  function scoreLink(fromItem, toItem, options = {}) {
    if (!fromItem || !toItem || fromItem.id === toItem.id) return -Infinity;
    const mode = options.mode || 'continue';
    let score = 0;
    const fromTopics = topicsForExpression(fromItem);
    const toTopics = topicsForExpression(toItem);
    const topicOverlap = sharedCount(fromTopics, toTopics);
    const nounOverlap = sharedCount(fromItem.nounIds || [], toItem.nounIds || []);
    const tagOverlap = sharedCount(
      (fromItem.situationTags || []).map(tag => String(tag).toLowerCase()),
      (toItem.situationTags || []).map(tag => String(tag).toLowerCase())
    );
    const sameVerb = Boolean(fromItem.coreVerbId && fromItem.coreVerbId === toItem.coreVerbId);
    const related = new Set(fromItem.relatedExpressionIds || []);

    if (related.has(toItem.id)) score += 100;
    score += topicOverlap * 40;
    score += nounOverlap * 25;
    score += tagOverlap * 15;
    if (sameVerb) score += mode === 'continue' ? 12 : 8;
    if (mode === 'topic') {
      // 화제전환: 같은 큰 주제면 가깝고, 완전 동일 문장군은 약간 낮춤
      if (topicOverlap > 0) score += 10;
      else score -= 5;
    }
    if (mode === 'continue' && topicOverlap === 0 && nounOverlap === 0 && tagOverlap === 0) {
      score -= 20;
    }
    return score;
  }

  function pickLinkedExpression(fromExpressionId, bank, options = {}) {
    const mode = options.mode || 'continue';
    const list = Array.isArray(bank) ? bank : [];
    const current = list.find(item => item.id === fromExpressionId) || null;
    if (!current) return list[0] || null;

    if (mode === 'continue') {
      const related = (current.relatedExpressionIds || [])
        .map(id => list.find(item => item.id === id))
        .filter(Boolean);
      if (related.length) {
        return related[Math.floor(Math.random() * related.length)];
      }
    }

    const scored = list
      .filter(item => item && item.id !== current.id)
      .map(item => ({ item, score: scoreLink(current, item, { mode }) }))
      .filter(entry => Number.isFinite(entry.score))
      .sort((a, b) => b.score - a.score || String(a.item.id).localeCompare(String(b.item.id)));

    if (!scored.length) return current;

    const best = scored[0].score;
    const floor = mode === 'continue' ? Math.max(20, best - 15) : Math.max(8, best - 20);
    const top = scored.filter(entry => entry.score >= floor && entry.score > -10);
    const pool = top.length ? top : scored.slice(0, Math.min(5, scored.length));
    return pool[Math.floor(Math.random() * pool.length)].item;
  }

  return {
    TOPIC_DEFS,
    topicsForExpression,
    scoreLink,
    pickLinkedExpression,
  };
});
