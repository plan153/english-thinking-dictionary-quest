/**
 * Feynman-style explanation challenge within Active Speaking Set lexicon.
 * Learner explains an expression using only unlocked ASS words (+ glue words).
 * Never expands the quiz bank.
 * Browser: window.FeynmanChallenge
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FeynmanChallenge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const GLUE_WORDS = new Set([
    'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'from', 'by',
    'and', 'or', 'but', 'not', 'no', 'yes', 'i', 'you', 'he', 'she', 'we', 'they',
    'it', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'do', 'does', 'did', 'can', 'could', 'will', 'would',
    'my', 'your', 'our', 'me', 'him', 'her', 'them', 'so', 'too', 'very',
    'when', 'where', 'what', 'who', 'how', 'if', 'then', 'about', 'into', 'out',
    'up', 'down', 'off', 'over', 'again', 'just', 'also', 'like', 'as', 'more',
    'some', 'any', 'all', 'one', 'two',
  ]);

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function ymd(date = new Date()) {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  }

  function shortHash(input) {
    let hash = 2166136261;
    const text = String(input || '');
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36).slice(0, 6);
  }

  function normalizeToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[.?!,;:"'()[\]{}]/g, '')
      .trim();
  }

  function tokenize(text) {
    return String(text || '')
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean);
  }

  function addWord(set, word) {
    const token = normalizeToken(word);
    if (token) set.add(token);
  }

  function buildAllowedLexicon(options = {}) {
    const words = new Set(GLUE_WORDS);
    const unlocked = new Set(options.unlockedExpressionIds || []);
    const expressions = (options.expressions || []).filter(item => unlocked.has(item.id));
    const verbById = new Map((options.verbs || []).map(verb => [verb.id, verb]));
    const nounById = new Map((options.nouns || []).map(noun => [noun.id, noun]));

    expressions.forEach(expression => {
      const verb = verbById.get(expression.coreVerbId);
      if (verb) addWord(words, verb.word);
      (expression.nounIds || []).forEach(nounId => {
        const noun = nounById.get(nounId);
        if (noun) addWord(words, noun.word);
      });
      (expression.chunks || []).forEach(chunk => {
        tokenize(chunk).forEach(token => addWord(words, token));
      });
      tokenize(expression.english || '').forEach(token => addWord(words, token));
    });

    (options.extraWords || []).forEach(word => addWord(words, word));
    return words;
  }

  function evaluateExplanation(text, lexicon) {
    const allowedSet = lexicon instanceof Set ? lexicon : new Set(lexicon || []);
    const tokens = tokenize(text);
    const allowed = [];
    const blocked = [];
    tokens.forEach(token => {
      if (allowedSet.has(token)) allowed.push(token);
      else blocked.push(token);
    });
    const uniqueAllowed = [...new Set(allowed)];
    const ratio = tokens.length ? allowed.length / tokens.length : 0;
    const passed = tokens.length >= 4 && blocked.length === 0;
    const softPass = tokens.length >= 4 && blocked.length <= 1 && ratio >= 0.85;
    return {
      tokens,
      allowed,
      blocked: [...new Set(blocked)],
      uniqueAllowedCount: uniqueAllowed.length,
      allowedRatio: Math.round(ratio * 1000) / 1000,
      passed,
      softPass,
      status: passed ? 'passed' : (softPass ? 'soft-pass' : (tokens.length ? 'blocked' : 'empty')),
    };
  }

  function makeExplanationId({ expressionId, createdAt, text }) {
    const date = createdAt ? new Date(createdAt) : new Date();
    const stamp = Number.isNaN(date.getTime()) ? ymd() : ymd(date);
    const digest = shortHash(`${expressionId}|${normalizeToken(text).slice(0, 80)}`);
    return `exp_${expressionId || 'x'}_${stamp}_${digest}`;
  }

  function lexiconPreview(lexicon, limit = 24) {
    return [...(lexicon instanceof Set ? lexicon : new Set(lexicon || []))]
      .filter(word => !GLUE_WORDS.has(word))
      .sort()
      .slice(0, limit);
  }

  return {
    GLUE_WORDS,
    tokenize,
    normalizeToken,
    buildAllowedLexicon,
    evaluateExplanation,
    makeExplanationId,
    lexiconPreview,
    ymd,
    shortHash,
  };
});
