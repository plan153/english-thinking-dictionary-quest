/**
 * Phrasal Speaking Set helpers (separate curriculum from ASS packs).
 * Menu unlock: expression unlockPackCount >= required (default 1).
 * Group unlock: sequential stages after menu opens.
 * P2d: when policyPhrasalInAssBank is ON, unlocked phrasal IDs may join getUnlockedBank().
 * Browser: window.PhrasalSpeakingSet
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PhrasalSpeakingSet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_STAGES = [
    { id: 'stage_get_place', title: '1. get + 장소', groupIds: ['pv_get_place'] },
    { id: 'stage_come_go', title: '2. come / go 입자', groupIds: ['pv_come_particles', 'pv_go_on'] },
    { id: 'stage_put', title: '3. put on·off', groupIds: ['pv_put_on_off'] },
    { id: 'stage_keep_find_make', title: '4. keep / find / make sure', groupIds: ['pv_keep_in', 'pv_find_out', 'pv_make_sure'] },
  ];

  const DEFAULT_PHRASAL_SPEAKING_SET = {
    id: 'pss_v0',
    title: '구동사 Speaking Set',
    unlockRule: 'unlock_pack_count',
    unlockPackCountRequired: 1,
    groupClearThreshold: 1,
    stages: DEFAULT_STAGES.map(stage => ({ ...stage, groupIds: stage.groupIds.slice() })),
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
    const stages = Array.isArray(base.stages) && base.stages.length
      ? base.stages.map((stage, index) => ({
        id: stage?.id || `stage_${index + 1}`,
        title: stage?.title || `Stage ${index + 1}`,
        groupIds: Array.isArray(stage?.groupIds) ? stage.groupIds.slice() : [],
      }))
      : DEFAULT_STAGES.map(stage => ({ ...stage, groupIds: stage.groupIds.slice() }));
    return {
      ...DEFAULT_PHRASAL_SPEAKING_SET,
      ...base,
      groups,
      stages,
      unlockPackCountRequired: Number.isFinite(base.unlockPackCountRequired)
        ? Math.max(0, Number(base.unlockPackCountRequired))
        : DEFAULT_PHRASAL_SPEAKING_SET.unlockPackCountRequired,
      groupClearThreshold: Number.isFinite(base.groupClearThreshold)
        ? Math.max(1, Number(base.groupClearThreshold))
        : DEFAULT_PHRASAL_SPEAKING_SET.groupClearThreshold,
    };
  }

  function getUnlockedPackCount(curriculum) {
    return Math.max(0, Number(curriculum?.unlockedPackCount || 0));
  }

  function isMenuUnlocked(curriculum, config) {
    const cfg = normalizePhrasalConfig(config);
    return getUnlockedPackCount(curriculum) >= cfg.unlockPackCountRequired;
  }

  function ensurePhrasalCurriculum(curriculum = {}) {
    const base = curriculum && typeof curriculum === 'object' ? curriculum : {};
    return {
      ...base,
      unlockedPackCount: Number.isFinite(base.unlockedPackCount) ? base.unlockedPackCount : 0,
      unlockedPhrasalStageCount: Number.isFinite(base.unlockedPhrasalStageCount)
        ? Math.max(0, Number(base.unlockedPhrasalStageCount))
        : 0,
    };
  }

  function getUnlockedStageCount(curriculum, config) {
    const cfg = normalizePhrasalConfig(config);
    const next = ensurePhrasalCurriculum(curriculum);
    if (!isMenuUnlocked(next, cfg)) return 0;
    const max = cfg.stages.length;
    const stored = Math.max(0, Number(next.unlockedPhrasalStageCount || 0));
    // Menu just opened: at least stage 1 is available.
    return Math.min(max, Math.max(1, stored));
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

  function listStageGroupIds(config, stageIndex) {
    const cfg = normalizePhrasalConfig(config);
    const stage = cfg.stages[stageIndex];
    return stage ? (stage.groupIds || []).slice() : [];
  }

  function listStageExpressionIds(config, stageIndex) {
    const ids = [];
    listStageGroupIds(config, stageIndex).forEach(groupId => {
      listGroupExpressionIds(config, groupId).forEach(id => {
        if (id && !ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }

  function isGroupUnlocked(curriculum, config, groupId) {
    const cfg = normalizePhrasalConfig(config);
    const stageCount = getUnlockedStageCount(curriculum, cfg);
    for (let i = 0; i < stageCount; i += 1) {
      if (listStageGroupIds(cfg, i).includes(groupId)) return true;
    }
    return false;
  }

  function listUnlockedExpressionIds(curriculum, config) {
    const cfg = normalizePhrasalConfig(config);
    const stageCount = getUnlockedStageCount(curriculum, cfg);
    const ids = [];
    for (let i = 0; i < stageCount; i += 1) {
      listStageExpressionIds(cfg, i).forEach(id => {
        if (id && !ids.includes(id)) ids.push(id);
      });
    }
    return ids;
  }

  function isExpressionClearedDefault(expressionId, progress = {}, threshold = 1) {
    const successes = Number(progress.successes?.[expressionId] || 0);
    if (successes < threshold) return false;
    const history = progress.historyByExpressionId?.[expressionId] || {};
    const connections = history.connections || {};
    const output = connections.output || {};
    const allStrong = ['recognition', 'assembly', 'output'].every(
      key => (connections[key]?.strength || 0) === 1
    );
    if (allStrong) return true;
    return (output.strength || 0) > 0 || (output.attempts || 0) > 0;
  }

  function isStageCleared(curriculum, config, stageIndex, options = {}) {
    const cfg = normalizePhrasalConfig(config);
    const ids = listStageExpressionIds(cfg, stageIndex);
    if (!ids.length) return false;
    const threshold = cfg.groupClearThreshold;
    const checker = typeof options.isExpressionCleared === 'function'
      ? options.isExpressionCleared
      : (id) => isExpressionClearedDefault(id, options.progress || {}, threshold);
    return ids.every(id => checker(id));
  }

  function syncPhrasalStages(curriculum, config, options = {}) {
    const cfg = normalizePhrasalConfig(config);
    let next = ensurePhrasalCurriculum(curriculum);
    if (!isMenuUnlocked(next, cfg)) {
      return { curriculum: next, changed: false, unlockedPhrasalStageCount: 0, announce: [] };
    }
    let unlocked = getUnlockedStageCount(next, cfg);
    let changed = unlocked !== Number(next.unlockedPhrasalStageCount || 0);
    next.unlockedPhrasalStageCount = unlocked;
    const announce = [];
    while (unlocked < cfg.stages.length) {
      if (!isStageCleared(next, cfg, unlocked - 1, options)) break;
      unlocked += 1;
      changed = true;
      next.unlockedPhrasalStageCount = unlocked;
      const stage = cfg.stages[unlocked - 1];
      if (options.collectAnnounce) {
        announce.push({ stageId: stage?.id, title: stage?.title, groupIds: stage?.groupIds || [] });
      }
    }
    return {
      curriculum: next,
      changed,
      unlockedPhrasalStageCount: unlocked,
      announce,
    };
  }

  function blankParticleInEnglish(english, particles = []) {
    const text = String(english || '');
    const sorted = [...particles].filter(Boolean).sort((a, b) => String(b).length - String(a).length);
    for (const particle of sorted) {
      const re = new RegExp(`\\b${String(particle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(text)) {
        return {
          blanked: text.replace(re, '____'),
          particle: particle,
          matched: true,
        };
      }
    }
    return { blanked: text, particle: '', matched: false };
  }

  function getSnapshot(curriculum, config, options = {}) {
    const cfg = normalizePhrasalConfig(config);
    const unlocked = isMenuUnlocked(curriculum, cfg);
    const stageCount = getUnlockedStageCount(curriculum, cfg);
    const currentStage = unlocked ? cfg.stages[Math.max(0, stageCount - 1)] || null : null;
    const nextStage = unlocked && stageCount < cfg.stages.length ? cfg.stages[stageCount] : null;
    const currentCleared = unlocked && stageCount > 0
      ? isStageCleared(curriculum, cfg, stageCount - 1, options)
      : false;
    return {
      title: cfg.title,
      unlocked,
      unlockPackCountRequired: cfg.unlockPackCountRequired,
      unlockedPackCount: getUnlockedPackCount(curriculum),
      unlockedPhrasalStageCount: stageCount,
      totalStages: cfg.stages.length,
      currentStage,
      nextStage,
      currentStageCleared: currentCleared,
      groupCount: cfg.groups.length,
      expressionCount: listExpressionIds(cfg).length,
      unlockedExpressionCount: listUnlockedExpressionIds(curriculum, cfg).length,
      stages: cfg.stages.map((stage, index) => ({
        ...stage,
        locked: !unlocked || index >= stageCount,
        open: unlocked && index < stageCount,
        cleared: unlocked && index < stageCount - 1
          ? true
          : (unlocked && index === stageCount - 1 ? currentCleared : false),
      })),
      groups: cfg.groups.map(group => {
        const groupUnlocked = isGroupUnlocked(curriculum, cfg, group.id);
        const stageIndex = cfg.stages.findIndex(stage => (stage.groupIds || []).includes(group.id));
        const lockReason = !unlocked
          ? `표현 Unlock pack ${cfg.unlockPackCountRequired}개 필요`
          : (!groupUnlocked
            ? (nextStage ? `이전 단계 숙달 후 해금 · 다음: ${nextStage.title}` : '아직 이전 단계가 열려 있지 않아요')
            : '');
        return {
          id: group.id,
          title: group.title,
          coreVerbId: group.coreVerbId,
          particles: group.particles.slice(),
          expressionIds: group.expressionIds.slice(),
          note: group.note,
          locked: !groupUnlocked,
          stageIndex,
          lockReason,
        };
      }),
    };
  }

  return {
    DEFAULT_PHRASAL_SPEAKING_SET,
    DEFAULT_STAGES,
    normalizePhrasalConfig,
    getUnlockedPackCount,
    isMenuUnlocked,
    ensurePhrasalCurriculum,
    getUnlockedStageCount,
    listExpressionIds,
    listGroupExpressionIds,
    listStageGroupIds,
    listStageExpressionIds,
    isGroupUnlocked,
    listUnlockedExpressionIds,
    isExpressionClearedDefault,
    isStageCleared,
    syncPhrasalStages,
    blankParticleInEnglish,
    getSnapshot,
  };
});
