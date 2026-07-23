/**
 * Phrasal Speaking Set helpers (separate from Active Speaking Set quiz bank).
 * Unlock: expression unlockPackCount >= required (default 1).
 * Never merge into getUnlockedBank() — practice only via phrasal menu.
 * Browser: window.PhrasalSpeakingSet
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PhrasalSpeakingSet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_PHRASAL_SPEAKING_SET = {
    id: 'pss_v0',
    title: '구동사 Speaking Set',
    unlockRule: 'unlock_pack_count',
    unlockPackCountRequired: 1,
    groups: [],
  };

  function normalizePhrasalConfig(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    const groups = Array.isArray(base.groups)
      ? base.groups.map((group, index) => ({
        id: group?.id || `pv_group_${index + 1}`,
        title: group?.title || `Group ${index + 1}`,
        coreVerbId: group?.coreVerbId || '',
        particles: Array.isArray(group?.particles) ? group.particles.slice() : [],
        expressionIds: Array.isArray(group?.expressionIds) ? group.expressionIds.slice() : [],
        note: group?.note || '',
      }))
      : [];
    return {
      ...DEFAULT_PHRASAL_SPEAKING_SET,
      ...base,
      groups,
      unlockPackCountRequired: Number.isFinite(base.unlockPackCountRequired)
        ? Math.max(0, Number(base.unlockPackCountRequired))
        : DEFAULT_PHRASAL_SPEAKING_SET.unlockPackCountRequired,
    };
  }

  function getUnlockedPackCount(curriculum) {
    return Math.max(0, Number(curriculum?.unlockedPackCount || 0));
  }

  function isMenuUnlocked(curriculum, config) {
    const cfg = normalizePhrasalConfig(config);
    return getUnlockedPackCount(curriculum) >= cfg.unlockPackCountRequired;
  }

  function listExpressionIds(config) {
    const cfg = normalizePhrasalConfig(config);
    const ids = [];
    cfg.groups.forEach(group => {
      (group.expressionIds || []).forEach(id => {
        if (id && !ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }

  function listGroupExpressionIds(config, groupId) {
    const cfg = normalizePhrasalConfig(config);
    const group = cfg.groups.find(item => item.id === groupId);
    return group ? (group.expressionIds || []).slice() : [];
  }

  function getSnapshot(curriculum, config) {
    const cfg = normalizePhrasalConfig(config);
    const unlocked = isMenuUnlocked(curriculum, cfg);
    return {
      title: cfg.title,
      unlocked,
      unlockPackCountRequired: cfg.unlockPackCountRequired,
      unlockedPackCount: getUnlockedPackCount(curriculum),
      groupCount: cfg.groups.length,
      expressionCount: listExpressionIds(cfg).length,
      groups: cfg.groups.map(group => ({
        id: group.id,
        title: group.title,
        coreVerbId: group.coreVerbId,
        particles: group.particles.slice(),
        expressionIds: group.expressionIds.slice(),
        note: group.note,
        locked: !unlocked,
      })),
    };
  }

  return {
    DEFAULT_PHRASAL_SPEAKING_SET,
    normalizePhrasalConfig,
    getUnlockedPackCount,
    isMenuUnlocked,
    listExpressionIds,
    listGroupExpressionIds,
    getSnapshot,
  };
});
