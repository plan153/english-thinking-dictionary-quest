/**
 * Helpers for compose/speech answer classification feedback.
 * Browser: window.AnswerClassifyHelpers
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AnswerClassifyHelpers = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MINOR_WORDS = new Set(['a', 'an', 'the']);

  const IRREGULAR_VERB_FORMS = {
    be: ['be', 'am', 'is', 'are', 'was', 'were', 'been', 'being'],
    do: ['do', 'does', 'did', 'done', 'doing'],
    have: ['have', 'has', 'had', 'having'],
    go: ['go', 'goes', 'went', 'gone', 'going'],
    get: ['get', 'gets', 'got', 'gotten', 'getting'],
    make: ['make', 'makes', 'made', 'making'],
    take: ['take', 'takes', 'took', 'taken', 'taking'],
    come: ['come', 'comes', 'came', 'coming'],
    see: ['see', 'sees', 'saw', 'seen', 'seeing'],
    put: ['put', 'puts', 'putting'],
    give: ['give', 'gives', 'gave', 'given', 'giving'],
    feel: ['feel', 'feels', 'felt', 'feeling'],
    find: ['find', 'finds', 'found', 'finding'],
    keep: ['keep', 'keeps', 'kept', 'keeping'],
    say: ['say', 'says', 'said', 'saying'],
    tell: ['tell', 'tells', 'told', 'telling'],
    think: ['think', 'thinks', 'thought', 'thinking'],
    know: ['know', 'knows', 'knew', 'known', 'knowing'],
    want: ['want', 'wants', 'wanted', 'wanting'],
    need: ['need', 'needs', 'needed', 'needing'],
  };

  const FORM_TO_LEMMA = Object.create(null);
  Object.keys(IRREGULAR_VERB_FORMS).forEach((lemma) => {
    IRREGULAR_VERB_FORMS[lemma].forEach((form) => {
      FORM_TO_LEMMA[form] = lemma;
    });
  });

  function cleanVerb(verb) {
    return String(verb || '').toLowerCase().trim();
  }

  function regularVerbForms(verb) {
    const v = cleanVerb(verb);
    if (!v) return [];
    const forms = new Set([v]);
    if (v.endsWith('y') && v.length > 1 && !/[aeiou]y$/.test(v)) {
      forms.add(`${v.slice(0, -1)}ies`);
      forms.add(`${v.slice(0, -1)}ied`);
      forms.add(`${v}ing`);
    } else if (v.endsWith('e')) {
      forms.add(`${v}s`);
      forms.add(`${v}d`);
      forms.add(`${v.slice(0, -1)}ing`);
    } else {
      forms.add(`${v}s`);
      forms.add(`${v}es`);
      forms.add(`${v}ed`);
      forms.add(`${v}ing`);
    }
    return Array.from(forms);
  }

  function verbForms(verb) {
    const v = cleanVerb(verb);
    if (!v) return new Set();
    const lemma = FORM_TO_LEMMA[v] || v;
    if (IRREGULAR_VERB_FORMS[lemma]) {
      return new Set(IRREGULAR_VERB_FORMS[lemma]);
    }
    return new Set(regularVerbForms(lemma));
  }

  function tokensIncludeVerb(tokens, verb) {
    const forms = verbForms(verb);
    if (!forms.size) return true;
    const list = tokens instanceof Set ? tokens : new Set(tokens || []);
    for (const token of list) {
      if (forms.has(String(token || '').toLowerCase())) return true;
    }
    return false;
  }

  function contentTokens(normalizedText) {
    return String(normalizedText || '')
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => !MINOR_WORDS.has(token));
  }

  function isMinorWordOnlyDiff(guessNormalized, expectedNormalized) {
    const guess = String(guessNormalized || '').trim();
    const expected = String(expectedNormalized || '').trim();
    if (!guess || !expected || guess === expected) return false;
    const guessContent = contentTokens(guess).join(' ');
    const expectedContent = contentTokens(expected).join(' ');
    if (!guessContent || guessContent !== expectedContent) return false;
    // Content matches; difference must involve only minor words (articles).
    return true;
  }

  return {
    MINOR_WORDS,
    verbForms,
    tokensIncludeVerb,
    contentTokens,
    isMinorWordOnlyDiff,
  };
});
