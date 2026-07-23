/**
 * Phrasal Speaking Set — locked separate curriculum (not auto-merged into ASS quiz bank).
 * Browser: window.PhrasalSpeakingSet
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PhrasalSpeakingSet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizePhrasalConfig(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    return {
      id: base.id || 'pss_v0',
      title: base.title || '구동사 Speaking Set',
      description: base.description || '',
      unlockRule: base.unlockRule || 'unlock_pack_count',
      unlockPackCountRequired: Number.isFinite(base.unlockPackCountRequired) ? base.unlockPackCountRequired : 1,
      groups: Array.isArray(base.groups)
        ? base.groups.map((group, index) => ({
          id: group?.id || `pv_group_${index + 1}`,
          title: group?.title || `구동사 ${index + 1}`,
          coreVerbId: group?.coreVerbId || '',
          particles: Array.isArray(group?.particles) ? group.particles.slice() : [],
          expressionIds: Array.isArray(group?.expressionIds) ? group.expressionIds.slice() : [],
          note: group?.note || '',
        }))
        : [],
    };
  }

  function isPhrasalUnlocked(curriculum, config) {
    const cfg = normalizePhrasalConfig(config);
    if (cfg.unlockRule === 'always') return true;
    const required = Math.max(0, Number(cfg.unlockPackCountRequired || 1));
    const unlocked = Math.max(0, Number(curriculum?.unlockedPackCount || 0));
    return unlocked >= required;
  }

  function listPhrasalExpressionIds(config) {
    const cfg = normalizePhrasalConfig(config);
    const ids = [];
    cfg.groups.forEach(group => {
      (group.expressionIds || []).forEach(id => {
        if (id && !ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }

  function listUnlockedPhrasalExpressionIds(curriculum, config) {
    if (!isPhrasalUnlocked(curriculum, config)) return [];
    return listPhrasalExpressionIds(config);
  }

  return {
    normalizePhrasalConfig,
    isPhrasalUnlocked,
    listPhrasalExpressionIds,
    listUnlockedPhrasalExpressionIds,
  };
});
