/**
 * Next Practice queue builders — Vault import, gaps, weak links, watchlist, brain soft hints.
 * Never expands the quiz bank; callers must filter to unlocked expression IDs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NextPractice = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ALLOWED_MODES = new Set(['listen', 'speak', 'koen', 'enko', 'review', 'matrix', 'explain', 'build']);

  function normalizeQueueItem(item) {
    if (!item || typeof item !== 'object') return null;
    const expressionId = String(item.expressionId || '').trim();
    if (!expressionId) return null;
    let mode = String(item.mode || 'review').trim() || 'review';
    if (!ALLOWED_MODES.has(mode)) mode = 'review';
    return {
      expressionId,
      mode,
      reason: String(item.reason || '').trim() || 'practice',
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
      .map(slot => ({
        expressionId: slot.expressionId || slot.patternId || slot.id || '',
        mode: 'review',
        reason: slot.reason ? `brain-${slot.reason}` : 'brain-weak-slot',
      }))
      .filter(item => item.expressionId);
  }

  /**
   * Prefer vault Next Practice when present; else gaps → watchlist → brain → weak links.
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
    const watchlistQueue = watchlistPracticeItems(sources.watchlistLinks || [], sources.unlockedBank || []);
    const brainQueue = brainWeakSlotItems(sources.importedBrainState);
    const weakQueue = (sources.weakReview || []).map(entry => ({
      expressionId: entry.expressionId || entry.id,
      mode: entry.mode || 'review',
      reason: entry.reason || 'weak-link',
    }));

    return dedupeQueue(
      [...gapQueue, ...watchlistQueue, ...brainQueue, ...weakQueue],
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
    normalizeQueueItem,
    dedupeQueue,
    filterUnlocked,
    watchlistPracticeItems,
    brainWeakSlotItems,
    buildQueue,
    softHintBoost,
  };
});
