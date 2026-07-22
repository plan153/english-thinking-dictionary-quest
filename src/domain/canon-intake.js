/**
 * Canon → expression JSON / Unlock-pack candidate helpers.
 * Never auto-loads into the quiz bank — review gate only.
 * Browser: window.CanonIntake
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CanonIntake = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_QUIZ_TYPES = ['listening', 'speaking', 'koToEn', 'enToKo', 'blank', 'hint'];

  function nextExpressionId(existingIds = []) {
    const used = new Set((existingIds || []).map(String));
    let max = 0;
    used.forEach(id => {
      const match = /^e(\d+)$/i.exec(id);
      if (match) max = Math.max(max, Number(match[1]));
    });
    let n = Math.max(max + 1, 1);
    let candidate = `e${String(n).padStart(3, '0')}`;
    while (used.has(candidate)) {
      n += 1;
      candidate = `e${String(n).padStart(3, '0')}`;
    }
    return candidate;
  }

  function resolveCoreVerbId(draft, verbs = []) {
    if (draft.coreVerbId) return draft.coreVerbId;
    const word = String(draft.coreVerb || draft.verbWord || '').trim().toLowerCase();
    if (!word) return '';
    const hit = (verbs || []).find(verb => String(verb.word || '').toLowerCase() === word || verb.id === word);
    if (hit) return hit.id;
    if (word.startsWith('v_')) return word;
    return `v_${word}`;
  }

  function guessChunks(english) {
    return String(english || '')
      .replace(/[.?!,]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }

  function draftToExpressionCandidate(draft, options = {}) {
    const existingIds = options.existingExpressionIds || [];
    const id = options.id || draft.expressionId || nextExpressionId(existingIds);
    const english = String(draft.english || '').trim();
    const naturalKorean = String(draft.naturalKorean || '').trim();
    const coreVerbId = resolveCoreVerbId(draft, options.verbs || []);
    const patternHint = String(draft.pattern || '').trim();
    return {
      id,
      english,
      naturalKorean,
      literalMeaning: String(draft.literalMeaning || ''),
      coreVerbId,
      patternId: draft.patternId || '',
      nounIds: Array.isArray(draft.nounIds) ? draft.nounIds.slice() : [],
      situationTags: Array.isArray(draft.situationTags) && draft.situationTags.length
        ? draft.situationTags.slice()
        : ['conversation', 'daily'],
      level: Number.isFinite(draft.level) ? draft.level : 1,
      chunks: Array.isArray(draft.chunks) && draft.chunks.length ? draft.chunks.slice() : guessChunks(english),
      hints: [
        naturalKorean || '한국어 뜻을 떠올려 보세요.',
        patternHint || `${coreVerbId || 'verb'} + noun`,
        english ? english.replace(/[aeiou]/gi, '_') : '___',
      ],
      quizTypes: DEFAULT_QUIZ_TYPES.slice(),
      audioText: english,
      relatedExpressionIds: draft.expressionId && draft.expressionId !== id ? [draft.expressionId] : [],
      _intake: {
        sourceDraftId: draft.id || '',
        assEligible: draft.assEligible !== false,
        reviewStatus: 'pending',
        patternHint,
        warning: 'Review before merging into data/expressions.json. Not in quiz bank until reviewed.',
      },
    };
  }

  function buildCanonIntakeBundle({ drafts, existingExpressionIds, verbs, packId }) {
    const approved = (drafts || []).filter(item => (item.status || 'draft') === 'approved');
    const usedIds = [...(existingExpressionIds || [])];
    const candidates = approved.map(draft => {
      const id = draft.expressionId && !usedIds.includes(draft.expressionId)
        ? draft.expressionId
        : nextExpressionId(usedIds);
      usedIds.push(id);
      return draftToExpressionCandidate(draft, {
        id,
        existingExpressionIds: usedIds,
        verbs,
      });
    });
    const expressionIds = candidates.map(item => item.id);
    const cleanExpressions = candidates.map(item => {
      const clone = { ...item };
      delete clone._intake;
      return clone;
    });
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      warning: 'Manual review required. Do not auto-merge into the live quiz bank.',
      expressionsToAdd: cleanExpressions,
      candidates,
      suggestedUnlockPack: {
        id: packId || `pack_canon_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        title: 'Canon review unlock pack',
        expressionIds,
        note: 'Append to learning-paths.json unlockPacks only after content review.',
      },
      suggestedLearningPathSnippet: {
        unlockPacks: [{
          id: packId || `pack_canon_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
          title: 'Canon review unlock pack',
          expressionIds,
        }],
      },
    };
  }

  function queueItemFromCandidate(candidate, draftId) {
    return {
      draftId: draftId || candidate?._intake?.sourceDraftId || '',
      expressionId: candidate.id,
      english: candidate.english,
      naturalKorean: candidate.naturalKorean,
      coreVerbId: candidate.coreVerbId,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
  }

  return {
    nextExpressionId,
    resolveCoreVerbId,
    draftToExpressionCandidate,
    buildCanonIntakeBundle,
    queueItemFromCandidate,
  };
});
