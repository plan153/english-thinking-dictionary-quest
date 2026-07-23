/**
 * Active Speaking Set config normalize + unlock ID helpers (pure).
 * Quiz bank gate stays ASS-only — Vault/export never expand this.
 * Browser: window.ActiveSpeakingSet
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ActiveSpeakingSet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_ACTIVE_SPEAKING_SET = {
    id: 'ass_starter_v0',
    title: 'Active Speaking Set Starter',
    verbIds: ['v_have', 'v_get', 'v_want', 'v_need', 'v_go', 'v_come', 'v_make', 'v_take'],
    expressionIds: [
      'e001', 'e003', 'e068', 'e002', 'e044', 'e009', 'e005', 'e006',
      'e018', 'e026', 'e069', 'e015', 'e047', 'e048', 'e035', 'e038',
      'e021', 'e030', 'e083', 'e074', 'e045', 'e061', 'e020', 'e039',
      'e022', 'e004', 'e014', 'e090', 'e046', 'e033', 'e036', 'e024',
      'e019', 'e070', 'e075', 'e079', 'e031', 'e037', 'e025', 'e029',
    ],
    unlockPacks: [
      { id: 'pack_1', title: 'Unlock pack 1', expressionIds: ['e023', 'e032', 'e062', 'e071', 'e072', 'e027', 'e028', 'e034', 'e080', 'e082'] },
      { id: 'pack_2', title: 'Unlock pack 2', expressionIds: ['e065', 'e073', 'e084', 'e088', 'e089', 'e081', 'e085', 'e086', 'e087'] },
      { id: 'pack_3', title: 'Unlock pack 3', expressionIds: ['e011', 'e054', 'e055', 'e056', 'e077', 'e013', 'e064', 'e066', 'e067'] },
    ],
    verbUnlockPacks: [
      { id: 'verb_pack_give', title: '동사 해금 · give', verbIds: ['v_give'], expressionIds: ['e007', 'e040', 'e042', 'e043', 'e041'] },
      { id: 'verb_pack_be', title: '동사 해금 · be', verbIds: ['v_be'], expressionIds: ['e008', 'e016', 'e059', 'e060'] },
      { id: 'verb_pack_do', title: '동사 해금 · do', verbIds: ['v_do'], expressionIds: ['e017', 'e049', 'e050'] },
      { id: 'verb_pack_put', title: '동사 해금 · put', verbIds: ['v_put'], expressionIds: ['e010', 'e051', 'e052', 'e076'] },
    ],
    unlockThreshold: 0.7,
    masteryThreshold: 3,
  };

  function normalizeAssConfig(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    return {
      ...DEFAULT_ACTIVE_SPEAKING_SET,
      ...base,
      verbIds: Array.isArray(base.verbIds) && base.verbIds.length
        ? base.verbIds.slice()
        : DEFAULT_ACTIVE_SPEAKING_SET.verbIds.slice(),
      expressionIds: Array.isArray(base.expressionIds) && base.expressionIds.length
        ? base.expressionIds.slice()
        : DEFAULT_ACTIVE_SPEAKING_SET.expressionIds.slice(),
      unlockPacks: Array.isArray(base.unlockPacks)
        ? base.unlockPacks.map((pack, index) => ({
          id: pack?.id || `pack_${index + 1}`,
          title: pack?.title || `Unlock pack ${index + 1}`,
          expressionIds: Array.isArray(pack?.expressionIds) ? pack.expressionIds.slice() : [],
        }))
        : DEFAULT_ACTIVE_SPEAKING_SET.unlockPacks.map(pack => ({ ...pack, expressionIds: pack.expressionIds.slice() })),
      verbUnlockPacks: Array.isArray(base.verbUnlockPacks)
        ? base.verbUnlockPacks.map((pack, index) => ({
          id: pack?.id || `verb_pack_${index + 1}`,
          title: pack?.title || `Verb unlock ${index + 1}`,
          verbIds: Array.isArray(pack?.verbIds) ? pack.verbIds.slice() : [],
          expressionIds: Array.isArray(pack?.expressionIds) ? pack.expressionIds.slice() : [],
        }))
        : (DEFAULT_ACTIVE_SPEAKING_SET.verbUnlockPacks || []).map(pack => ({
          ...pack,
          verbIds: (pack.verbIds || []).slice(),
          expressionIds: (pack.expressionIds || []).slice(),
        })),
      unlockThreshold: Number.isFinite(base.unlockThreshold) ? base.unlockThreshold : DEFAULT_ACTIVE_SPEAKING_SET.unlockThreshold,
      masteryThreshold: Number.isFinite(base.masteryThreshold) ? base.masteryThreshold : DEFAULT_ACTIVE_SPEAKING_SET.masteryThreshold,
    };
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getUnlockedPackCount(curriculum, config) {
    const maxPacks = (config?.unlockPacks || []).length;
    const stored = Number(curriculum?.unlockedPackCount || 0);
    return clampValue(Number.isFinite(stored) ? stored : 0, 0, maxPacks);
  }

  function listUnlockedExpressionIds(config, curriculum, options = {}) {
    const cfg = normalizeAssConfig(config);
    const packCount = options.packCount != null
      ? options.packCount
      : getUnlockedPackCount(curriculum, cfg);
    const ids = cfg.expressionIds.slice();
    cfg.unlockPacks.slice(0, packCount).forEach(pack => {
      (pack.expressionIds || []).forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    if (options.includeVerbPacks !== false && options.verbGate) {
      options.verbGate.getUnlockedVerbExpressionIds(cfg, curriculum || {}).forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    }
    return ids;
  }

  function isExpressionInUnlockedSet(expressionId, config, curriculum, options = {}) {
    if (!expressionId) return false;
    return listUnlockedExpressionIds(config, curriculum, options).includes(expressionId);
  }

  return {
    DEFAULT_ACTIVE_SPEAKING_SET,
    normalizeAssConfig,
    getUnlockedPackCount,
    listUnlockedExpressionIds,
    isExpressionInUnlockedSet,
    clampValue,
  };
});
