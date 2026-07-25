/**
 * Next Practice queue builders — Vault import, gaps, weak links, watchlist, brain soft hints.
 * Forced retrieval: incomplete connection axes (especially output=0) become concrete practice modes.
 * Never expands the quiz bank; callers must filter to unlocked expression IDs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NextPractice = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ALLOWED_MODES = new Set(['listen', 'speak', 'koen', 'enko', 'review', 'matrix', 'build', 'assemble']);
  const AXIS_KEYS = ['recognition', 'assembly', 'output'];
  // Prefer filling output first — that is what turns recognition/assembly into “내 표현”.
  const RETRIEVAL_AXIS_ORDER = ['output', 'recognition', 'assembly'];

  function normalizeQueueItem(item) {
    if (!item || typeof item !== 'object') return null;
    const expressionId = String(item.expressionId || '').trim();
    if (!expressionId) return null;
    let mode = String(item.mode || 'review').trim() || 'review';
    // explain(파인만) 모드는 제거됨 → 복습으로 폴백
    if (mode === 'explain') mode = 'review';
    if (!ALLOWED_MODES.has(mode)) mode = 'review';
    return {
      expressionId,
      mode,
      reason: String(item.reason || '').trim() || 'practice',
      axis: item.axis ? String(item.axis).trim() : '',
    };
  }

  function dedupeQueue(items, limit = 8) {
    const seen = new Set();
    const out = [];
    for (const raw of items || []) {
      const item = normalizeQueueItem(raw);
      if (!item) continue;
      if (seen.has(item.expressionId)) continue;
      seen.add(item.expressionId);
      out.push(item);
      if (out.length >= limit) break;
    }
    return out;
  }

  function filterUnlocked(items, unlockedIds) {
    const unlocked = unlockedIds instanceof Set ? unlockedIds : new Set(unlockedIds || []);
    return (items || []).filter(item => item?.expressionId && unlocked.has(item.expressionId));
  }

  function axisStrength(history, axis) {
    return Number(history?.connections?.[axis]?.strength || 0);
  }

  function isAllStrongHistory(history) {
    return AXIS_KEYS.every(key => axisStrength(history, key) >= 1);
  }

  /**
   * Weakest incomplete axis. Prefer empty (0) over weak (0.5).
   * When preferOutput is true (default), output ties / empty output wins over earlier axes.
   */
  function weakestIncompleteAxis(history, options = {}) {
    if (isAllStrongHistory(history)) return null;
    const order = options.preferOutput === false ? AXIS_KEYS : RETRIEVAL_AXIS_ORDER;
    let bestKey = null;
    let bestStrength = Infinity;
    for (const key of order) {
      const strength = axisStrength(history, key);
      if (strength >= 1) continue;
      if (strength < bestStrength) {
        bestStrength = strength;
        bestKey = key;
      }
    }
    return bestKey;
  }

  function modeForAxis(axis) {
    if (axis === 'recognition') return 'listen';
    if (axis === 'assembly') return 'assemble';
    if (axis === 'output') return 'speak';
    return 'review';
  }

  function reasonForAxis(axis) {
    if (axis === 'output') return 'axis-output';
    if (axis === 'recognition') return 'axis-recognition';
    if (axis === 'assembly') return 'axis-assembly';
    return 'axis-weak';
  }

  function axisLabel(axis) {
    if (axis === 'output') return '말하기';
    if (axis === 'recognition') return '뜻 이해';
    if (axis === 'assembly') return '문장 만들기';
    return '연결';
  }

  /**
   * Higher = more urgent forced retrieval.
   * output=0 is heavily preferred; all-strong items score -Infinity.
   */
  function scoreWeakAxisEntry(history, options = {}) {
    if (!history || isAllStrongHistory(history)) return -Infinity;
    const axis = weakestIncompleteAxis(history, options);
    if (!axis) return -Infinity;
    const output = axisStrength(history, 'output');
    const emptyPieces = AXIS_KEYS.filter(key => axisStrength(history, key) === 0).length;
    const weakPieces = AXIS_KEYS.filter(key => {
      const strength = axisStrength(history, key);
      return strength > 0 && strength < 1;
    }).length;
    const priority = Number(history.reviewPriority || 0);
    let score = priority * 4 + emptyPieces * 8 + weakPieces * 3;
    if (output === 0) score += 40;
    else if (output < 1) score += 18;
    if (axis === 'output') score += 12;
    else if (axis === 'recognition') score += 4;
    else if (axis === 'assembly') score += 6;
    return score;
  }

  /**
   * Build forced-retrieval queue items from unlocked bank + history.
   * Concrete modes (speak/listen/koen) — not generic review — so the right axis fills.
   */
  function weakConnectionItems(unlockedBank, historyByExpressionId = {}, options = {}) {
    const bank = Array.isArray(unlockedBank) ? unlockedBank : [];
    const historyMap = historyByExpressionId && typeof historyByExpressionId === 'object'
      ? historyByExpressionId
      : {};
    const exclude = new Set(options.excludeIds || []);
    const limit = Number.isFinite(options.limit) ? options.limit : 5;
    const scored = bank
      .filter(item => item?.id && !exclude.has(item.id))
      .map(item => {
        const history = historyMap[item.id] || { connections: {} };
        const axis = weakestIncompleteAxis(history, options);
        const score = scoreWeakAxisEntry(history, options);
        return {
          expressionId: item.id,
          mode: modeForAxis(axis),
          reason: reasonForAxis(axis),
          axis: axis || '',
          score,
        };
      })
      .filter(entry => Number.isFinite(entry.score) && entry.score > -Infinity && entry.axis)
      .sort((a, b) => b.score - a.score || String(a.expressionId).localeCompare(String(b.expressionId)))
      .slice(0, limit)
      .map(({ expressionId, mode, reason, axis }) => ({ expressionId, mode, reason, axis }));
    return scored;
  }

  /**
   * Stable daily seed: prefer forced weak-axis expressions; fall back to date modulo.
   */
  function pickWeakAxisSeed(unlockedBank, historyByExpressionId = {}, options = {}) {
    const bank = Array.isArray(unlockedBank) ? unlockedBank : [];
    if (!bank.length) return null;
    const exclude = new Set(options.excludeIds || []);
    const candidates = weakConnectionItems(bank, historyByExpressionId, {
      ...options,
      excludeIds: exclude,
      limit: bank.length,
    });
    if (candidates.length) {
      const dateKey = String(options.dateKey || '');
      const dayNum = Number(dateKey.replace(/\D/g, '').slice(-3)) || 0;
      const pick = candidates[dayNum % candidates.length];
      return bank.find(item => item.id === pick.expressionId) || bank[0];
    }
    const pool = bank.filter(item => !exclude.has(item.id));
    const list = pool.length ? pool : bank;
    const dayNum = Number(String(options.dateKey || '').replace(/\D/g, '').slice(-3)) || 0;
    return list[dayNum % list.length] || list[0] || null;
  }

  /**
   * Watchlist → practice suggestions for already-unlocked expressions only.
   * Locked entities stay display-only (never auto-add to bank).
   */
  function watchlistPracticeItems(links, unlockedBank) {
    const bank = Array.isArray(unlockedBank) ? unlockedBank : [];
    const unlocked = new Set(bank.map(item => item.id));
    const queue = [];
    for (const link of links || []) {
      if ((link.status || '') !== 'watchlist') continue;
      const type = link.entityType || '';
      const entityId = link.entityId || '';
      if (type === 'expression' && unlocked.has(entityId)) {
        queue.push({ expressionId: entityId, mode: 'review', reason: 'vault-watchlist' });
        continue;
      }
      if (type === 'verb' && entityId) {
        bank
          .filter(item => item.coreVerbId === entityId)
          .slice(0, 2)
          .forEach(item => queue.push({
            expressionId: item.id,
            mode: 'review',
            reason: 'vault-watchlist-verb',
          }));
        continue;
      }
      if (type === 'noun' && entityId) {
        const hit = bank.find(item => (item.nounIds || []).includes(entityId));
        if (hit) {
          queue.push({ expressionId: hit.id, mode: 'review', reason: 'vault-watchlist-noun' });
        }
      }
      const related = Array.isArray(link.relatedExpressionIds) ? link.relatedExpressionIds : [];
      related.filter(id => unlocked.has(id)).slice(0, 2).forEach(id => {
        queue.push({ expressionId: id, mode: 'review', reason: 'vault-watchlist' });
      });
    }
    return dedupeQueue(queue, 8);
  }

  function brainWeakSlotItems(brainState) {
    const slots = Array.isArray(brainState?.weakSlots) ? brainState.weakSlots : [];
    return slots
      .map(slot => {
        const reason = slot.reason || 'weak-slot';
        let mode = 'review';
        let axis = '';
        if (reason === 'output-low' || reason === 'axis-output') {
          mode = 'speak';
          axis = 'output';
        } else if (reason === 'axis-recognition') {
          mode = 'listen';
          axis = 'recognition';
        } else if (reason === 'axis-assembly') {
          mode = 'koen';
          axis = 'assembly';
        }
        return {
          expressionId: slot.expressionId || slot.patternId || slot.id || '',
          mode,
          reason: reason.startsWith('brain-') ? reason : `brain-${reason}`,
          axis,
        };
      })
      .filter(item => item.expressionId);
  }

  /**
   * Prefer vault Next Practice when present; else gaps → forced weak axis → watchlist → brain → weak links.
   */
  function buildQueue(sources = {}) {
    const unlocked = sources.unlockedIds instanceof Set
      ? sources.unlockedIds
      : new Set(sources.unlockedIds || []);
    const imported = sources.importedNextPractice;
    if (imported?.source === 'vault' && Array.isArray(imported.queue) && imported.queue.length) {
      const vaultQueue = filterUnlocked(imported.queue.map(normalizeQueueItem), unlocked)
        .map(item => ({
          ...item,
          reason: item.reason || 'vault-next-practice',
        }));
      if (vaultQueue.length) return dedupeQueue(vaultQueue, sources.limit || 8);
    }

    const gapQueue = (sources.openGaps || []).slice(0, 5).map(gap => ({
      expressionId: gap.expressionId,
      mode: gap.mode === 'matrix' ? 'matrix' : 'review',
      reason: 'open-gap',
    }));

    const axisQueue = Array.isArray(sources.weakAxisItems) && sources.weakAxisItems.length
      ? sources.weakAxisItems
      : weakConnectionItems(
        sources.unlockedBank || [],
        sources.historyByExpressionId || {},
        { limit: sources.weakAxisLimit || 5 }
      );

    const watchlistQueue = watchlistPracticeItems(sources.watchlistLinks || [], sources.unlockedBank || []);
    const brainQueue = brainWeakSlotItems(sources.importedBrainState);
    const weakQueue = (sources.weakReview || []).map(entry => ({
      expressionId: entry.expressionId || entry.id,
      mode: entry.mode || 'review',
      reason: entry.reason || 'weak-link',
      axis: entry.axis || '',
    }));

    return dedupeQueue(
      [...gapQueue, ...axisQueue, ...watchlistQueue, ...brainQueue, ...weakQueue],
      sources.limit || 8
    );
  }

  function softHintBoost(expressionId, importedBrainState, amount = 1) {
    const slots = Array.isArray(importedBrainState?.weakSlots) ? importedBrainState.weakSlots : [];
    const hit = slots.some(slot => (slot.expressionId || slot.patternId || slot.id) === expressionId);
    return hit ? amount : 0;
  }

  return {
    ALLOWED_MODES,
    AXIS_KEYS,
    RETRIEVAL_AXIS_ORDER,
    normalizeQueueItem,
    dedupeQueue,
    filterUnlocked,
    axisStrength,
    isAllStrongHistory,
    weakestIncompleteAxis,
    modeForAxis,
    reasonForAxis,
    axisLabel,
    scoreWeakAxisEntry,
    weakConnectionItems,
    pickWeakAxisSeed,
    watchlistPracticeItems,
    brainWeakSlotItems,
    buildQueue,
    softHintBoost,
  };
});
