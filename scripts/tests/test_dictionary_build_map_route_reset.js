#!/usr/bin/env node
/**
 * Regression: stale selectedRouteId from get/want/need must not keep
 * the generic-verb build branch dirty forever (infinite rerender → empty graph).
 */
const assert = require('assert');

function simulateBuildNormalize(data, buildConfig, patterns) {
  let renders = 0;
  const MAX = 20;
  while (renders < MAX) {
    renders += 1;
    let needsRerender = false;
    if (buildConfig?.routes?.length) {
      const defaultRoute = buildConfig.routes.find(route => route.routeId === data.selectedRouteId) || buildConfig.routes[0];
      const defaultPattern = defaultRoute?.patterns?.find(pattern => pattern.patternId === data.selectedPatternId) || defaultRoute?.patterns?.[0] || null;
      const routeChanged = data.selectedRouteId !== defaultRoute?.routeId;
      const patternChanged = data.selectedPatternId !== defaultPattern?.patternId;
      if (routeChanged || patternChanged || data.selectedExpressionId || data.selectedSlotValue || data.selectedCombinationId) {
        data.selectedPatternId = null;
        data.selectedSlotValue = null;
        data.selectedCombinationId = null;
        data.selectedExpressionId = null;
        data.selectedMapSentenceId = null;
        data.selectedRouteId = defaultRoute?.routeId || null;
        data.selectedPatternId = defaultPattern?.patternId || null;
        needsRerender = true;
      }
    } else {
      const hadStaleRouteState = Boolean(
        data.selectedRouteId
        || data.selectedExpressionId
        || data.selectedSlotValue
        || data.selectedCombinationId
        || data.selectedMapSentenceId
      );
      if (hadStaleRouteState) {
        data.selectedRouteId = null;
        data.selectedPatternId = null;
        data.selectedSlotValue = null;
        data.selectedCombinationId = null;
        data.selectedExpressionId = null;
        data.selectedMapSentenceId = null;
      }
      const defaultPattern = patterns.find(pattern => pattern.id === data.selectedPatternId) || patterns[0] || null;
      const patternChanged = data.selectedPatternId !== defaultPattern?.id;
      if (patternChanged) {
        data.selectedPatternId = defaultPattern?.id || null;
        needsRerender = true;
      } else if (hadStaleRouteState) {
        needsRerender = true;
      }
    }
    if (!needsRerender) return { renders, data };
  }
  return { renders, data, looped: true };
}

const patterns = [{ id: 'p_have_noun', label: 'have + noun' }];
const result = simulateBuildNormalize(
  {
    selectedRouteId: 'get_receive',
    selectedPatternId: 'p_get_thing',
    selectedExpressionId: 'e_get_1',
    selectedSlotValue: 'text',
    selectedCombinationId: 'c1',
    selectedMapSentenceId: null,
  },
  null,
  patterns
);

assert.notStrictEqual(result.looped, true, 'must not infinite-loop on stale route state');
assert.ok(result.renders <= 3, `expected quick stabilize, got ${result.renders}`);
assert.strictEqual(result.data.selectedRouteId, null);
assert.strictEqual(result.data.selectedPatternId, 'p_have_noun');
assert.strictEqual(result.data.selectedExpressionId, null);

console.log('✅ dictionary build map route-reset tests passed');
