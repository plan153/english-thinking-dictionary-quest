/**
 * Korean situation-verb vs English basic-verb + noun contrast.
 * Browser: window.ExpressionContrast
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ExpressionContrast = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_TIP = '한국어는 상황마다 동사가 갈라지고, 영어는 기본 동사 + 명사로 자주 조립합니다.';

  function clean(value) {
    return String(value || '').trim();
  }

  function normalizeContrast(raw, options = {}) {
    if (!raw || typeof raw !== 'object') return null;
    const koVerb = clean(raw.koVerb || raw.koreanPattern || raw.koreanVerb);
    const enEngine = clean(raw.enEngine || raw.englishBasicVerb || raw.verb);
    const enNoun = clean(raw.enNoun || raw.noun || raw.englishNoun);
    const assembly = clean(raw.assembly || raw.englishAssembly)
      || (enEngine && enNoun ? `${enEngine} + ${enNoun}` : enEngine);
    const tip = clean(raw.tip || raw.principle) || DEFAULT_TIP;
    const wrongDirectTranslation = clean(raw.wrongDirectTranslation || raw.wrong || '');
    if (!koVerb && !assembly) return null;
    return {
      koVerb,
      enEngine,
      enNoun,
      assembly,
      tip,
      wrongDirectTranslation,
      source: clean(raw.source) || options.source || 'curated',
    };
  }

  /**
   * Derive a soft contrast from verb/noun/pattern when curated data is absent.
   * Only for expressions that look like basic-verb + noun assembly.
   */
  function deriveContrast(expression, collections = {}) {
    if (!expression) return null;
    const verbs = collections.verbs || [];
    const nouns = collections.nouns || [];
    const patterns = collections.patterns || [];
    const verb = verbs.find(item => item.id === expression.coreVerbId) || null;
    const pattern = patterns.find(item => item.id === expression.patternId) || null;
    const nounWords = (expression.nounIds || [])
      .map(id => nouns.find(item => item.id === id)?.word || '')
      .filter(Boolean)
      // Drop pronouns / deictics that are not the collocation noun.
      .filter(word => !['i', 'you', 'me', 'we', 'they', 'he', 'she', 'it', 'myself', 'myself'].includes(String(word).toLowerCase()));
    const enEngine = clean(verb?.word);
    const enNoun = nounWords.slice(0, 2).join(' · ');
    if (!enEngine || !enNoun) return null;
    const assembly = clean(pattern?.label) || `${enEngine} + ${enNoun}`;
    // Prefer Korean that reads like a single situation verb / predicate.
    const ko = clean(expression.naturalKorean).replace(/[.?!。？！]+$/u, '');
    return normalizeContrast({
      koVerb: ko,
      enEngine,
      enNoun,
      assembly,
      tip: DEFAULT_TIP,
      source: 'derived',
    });
  }

  function resolveContrast(expression, collections = {}) {
    const curated = normalizeContrast(expression?.contrast, { source: 'curated' });
    if (curated) return curated;
    return deriveContrast(expression, collections);
  }

  function contrastSummaryLine(contrast) {
    if (!contrast) return '';
    const left = contrast.koVerb || '한국어 상황 표현';
    const right = contrast.assembly || [contrast.enEngine, contrast.enNoun].filter(Boolean).join(' + ');
    if (!right) return left;
    return `${left} → ${right}`;
  }

  function contrastTeachingLines(contrast) {
    if (!contrast) return [];
    const lines = [];
    const summary = contrastSummaryLine(contrast);
    if (summary) lines.push(summary);
    if (contrast.tip) lines.push(contrast.tip);
    if (contrast.wrongDirectTranslation) {
      lines.push(`직역 주의: ${contrast.wrongDirectTranslation}`);
    }
    return lines;
  }

  return {
    DEFAULT_TIP,
    normalizeContrast,
    deriveContrast,
    resolveContrast,
    contrastSummaryLine,
    contrastTeachingLines,
  };
});
