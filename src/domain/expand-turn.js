/**
 * Conversation turn helpers for 이어묻기 / 이어답하기 expand choices.
 * Browser: window.ExpandTurn
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ExpandTurn = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function stripEnd(text) {
    return String(text || '')
      .replace(/[’‘ʻʼ]/g, "'")
      .replace(/[.?!…]+$/u, '')
      .trim();
  }

  function isQuestionLike(en, ko = '') {
    const enRaw = String(en || '').trim();
    const koRaw = String(ko || '').trim();
    if (/\?\s*$/.test(enRaw) || /\?\s*$/.test(koRaw)) return true;
    const text = stripEnd(enRaw);
    if (!text) return false;
    if (/^(who|what|when|where|why|how|which)\b/i.test(text)) return true;
    if (/^(do|does|did|are|is|am|was|were|can|could|will|would|should|may|might)\b/i.test(text)) return true;
    if (/^(have|has|had)\s+(you|we|they|i|he|she|it)\b/i.test(text)) return true;
    return false;
  }

  /**
   * Resolve whether the next natural expand step is from a statement or a question.
   * - statement → 이어묻기
   * - question → 이어답하기
   */
  function resolveExpandTurn(options = {}) {
    const formId = options.formId || null;
    if (formId === 'question') return 'question';
    if (formId === 'shortYes' || formId === 'shortNo' || formId === 'statement' || formId === 'negative') {
      return 'statement';
    }
    if (options.turn === 'question' || options.turn === 'statement') return options.turn;

    const lastChoice = options.lastExpandChoiceId || null;
    const sameExpression = !options.expressionId
      || !options.lastExpressionId
      || options.expressionId === options.lastExpressionId;
    if (sameExpression) {
      if (lastChoice === 'ask') return 'question';
      if (lastChoice === 'answer') return 'statement';
    }

    if (isQuestionLike(options.en, options.ko)) return 'question';
    return 'statement';
  }

  function filterExpandChoices(choices, turn) {
    const safeTurn = turn === 'question' ? 'question' : 'statement';
    return (choices || []).filter(choice => {
      if (!choice) return false;
      if (choice.id === 'ask') return safeTurn === 'statement';
      if (choice.id === 'answer') return safeTurn === 'question';
      return true;
    });
  }

  function correctExpandChoiceId(choiceId, turn) {
    if (choiceId === 'ask' && turn === 'question') return 'answer';
    if (choiceId === 'answer' && turn === 'statement') return 'ask';
    return choiceId;
  }

  return {
    isQuestionLike,
    resolveExpandTurn,
    filterExpandChoices,
    correctExpandChoiceId,
  };
});
