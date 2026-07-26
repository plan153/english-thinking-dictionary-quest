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

  // Learner-common irregulars + current curriculum verbs.
  // Keep lemma → forms only; FORM_TO_LEMMA prefers first registered lemma on collisions.
  const IRREGULAR_VERB_FORMS = {
    be: ['be', 'am', 'is', 'are', 'was', 'were', 'been', 'being'],
    begin: ['begin', 'begins', 'began', 'begun', 'beginning'],
    break: ['break', 'breaks', 'broke', 'broken', 'breaking'],
    bring: ['bring', 'brings', 'brought', 'bringing'],
    build: ['build', 'builds', 'built', 'building'],
    buy: ['buy', 'buys', 'bought', 'buying'],
    catch: ['catch', 'catches', 'caught', 'catching'],
    choose: ['choose', 'chooses', 'chose', 'chosen', 'choosing'],
    come: ['come', 'comes', 'came', 'coming'],
    cut: ['cut', 'cuts', 'cutting'],
    do: ['do', 'does', 'did', 'done', 'doing'],
    draw: ['draw', 'draws', 'drew', 'drawn', 'drawing'],
    drink: ['drink', 'drinks', 'drank', 'drunk', 'drinking'],
    drive: ['drive', 'drives', 'drove', 'driven', 'driving'],
    eat: ['eat', 'eats', 'ate', 'eaten', 'eating'],
    fall: ['fall', 'falls', 'fell', 'fallen', 'falling'],
    feel: ['feel', 'feels', 'felt', 'feeling'],
    find: ['find', 'finds', 'found', 'finding'],
    forget: ['forget', 'forgets', 'forgot', 'forgotten', 'forgetting'],
    get: ['get', 'gets', 'got', 'gotten', 'getting'],
    give: ['give', 'gives', 'gave', 'given', 'giving'],
    go: ['go', 'goes', 'went', 'gone', 'going'],
    grow: ['grow', 'grows', 'grew', 'grown', 'growing'],
    have: ['have', 'has', 'had', 'having'],
    hear: ['hear', 'hears', 'heard', 'hearing'],
    hide: ['hide', 'hides', 'hid', 'hidden', 'hiding'],
    hit: ['hit', 'hits', 'hitting'],
    hold: ['hold', 'holds', 'held', 'holding'],
    hurt: ['hurt', 'hurts', 'hurting'],
    keep: ['keep', 'keeps', 'kept', 'keeping'],
    know: ['know', 'knows', 'knew', 'known', 'knowing'],
    leave: ['leave', 'leaves', 'left', 'leaving'],
    let: ['let', 'lets', 'letting'],
    lose: ['lose', 'loses', 'lost', 'losing'],
    make: ['make', 'makes', 'made', 'making'],
    mean: ['mean', 'means', 'meant', 'meaning'],
    meet: ['meet', 'meets', 'met', 'meeting'],
    pay: ['pay', 'pays', 'paid', 'paying'],
    put: ['put', 'puts', 'putting'],
    read: ['read', 'reads', 'reading'],
    ride: ['ride', 'rides', 'rode', 'ridden', 'riding'],
    rise: ['rise', 'rises', 'rose', 'risen', 'rising'],
    run: ['run', 'runs', 'ran', 'running'],
    say: ['say', 'says', 'said', 'saying'],
    see: ['see', 'sees', 'saw', 'seen', 'seeing'],
    sell: ['sell', 'sells', 'sold', 'selling'],
    send: ['send', 'sends', 'sent', 'sending'],
    set: ['set', 'sets', 'setting'],
    sit: ['sit', 'sits', 'sat', 'sitting'],
    sleep: ['sleep', 'sleeps', 'slept', 'sleeping'],
    speak: ['speak', 'speaks', 'spoke', 'spoken', 'speaking'],
    spend: ['spend', 'spends', 'spent', 'spending'],
    stand: ['stand', 'stands', 'stood', 'standing'],
    take: ['take', 'takes', 'took', 'taken', 'taking'],
    teach: ['teach', 'teaches', 'taught', 'teaching'],
    tell: ['tell', 'tells', 'told', 'telling'],
    think: ['think', 'thinks', 'thought', 'thinking'],
    throw: ['throw', 'throws', 'threw', 'thrown', 'throwing'],
    understand: ['understand', 'understands', 'understood', 'understanding'],
    wake: ['wake', 'wakes', 'woke', 'woken', 'waking'],
    wear: ['wear', 'wears', 'wore', 'worn', 'wearing'],
    win: ['win', 'wins', 'won', 'winning'],
    write: ['write', 'writes', 'wrote', 'written', 'writing'],
    // Regular in form, but listed so curriculum lemmas stay explicit.
    want: ['want', 'wants', 'wanted', 'wanting'],
    need: ['need', 'needs', 'needed', 'needing'],
  };

  const FORM_TO_LEMMA = Object.create(null);
  Object.keys(IRREGULAR_VERB_FORMS).forEach((lemma) => {
    IRREGULAR_VERB_FORMS[lemma].forEach((form) => {
      if (!FORM_TO_LEMMA[form]) FORM_TO_LEMMA[form] = lemma;
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
    return true;
  }

  return {
    MINOR_WORDS,
    IRREGULAR_VERB_FORMS,
    verbForms,
    tokensIncludeVerb,
    contentTokens,
    isMinorWordOnlyDiff,
  };
});
