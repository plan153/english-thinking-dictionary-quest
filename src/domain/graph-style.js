/**
 * Phase 5 — app graph node style classes.
 * Vault links decorate nodes; they never expand the quiz bank.
 * Browser: window.GraphStyle
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GraphStyle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function classifyGraphNode(options = {}) {
    const unlocked = Boolean(options.unlocked);
    const vaultLinked = Boolean(options.vaultLinked) || (Array.isArray(options.vaultLinks) && options.vaultLinks.length > 0);
    if (vaultLinked && unlocked) return 'vault-linked';
    if (vaultLinked && !unlocked) return 'vault-only';
    if (!unlocked) return 'locked';
    return 'active';
  }

  function graphNodeClassList(options = {}) {
    const kind = classifyGraphNode(options);
    const classes = ['graph-node', `graph-node--${kind}`];
    if (options.selected) classes.push('is-selected');
    if (kind === 'vault-linked' || kind === 'vault-only') classes.push('vault-linked');
    if (kind === 'locked' || kind === 'vault-only') classes.push('locked');
    return classes.join(' ');
  }

  function graphNodeTitle(kind) {
    if (kind === 'vault-linked') return 'Vault 연결 · Active set';
    if (kind === 'vault-only') return 'Vault만 있음 · 퀴즈 잠김';
    if (kind === 'locked') return '아직 해금되지 않음';
    return 'Active Speaking Set';
  }

  return {
    classifyGraphNode,
    graphNodeClassList,
    graphNodeTitle,
  };
});
