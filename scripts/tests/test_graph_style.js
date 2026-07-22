#!/usr/bin/env node
const assert = require('assert');
const style = require('../../src/domain/graph-style.js');

assert.strictEqual(style.classifyGraphNode({ unlocked: true, vaultLinked: false }), 'active');
assert.strictEqual(style.classifyGraphNode({ unlocked: true, vaultLinked: true }), 'vault-linked');
assert.strictEqual(style.classifyGraphNode({ unlocked: false, vaultLinks: [{ id: 'x' }] }), 'vault-only');
assert.strictEqual(style.classifyGraphNode({ unlocked: false }), 'locked');
assert.ok(style.graphNodeClassList({ unlocked: true, vaultLinked: true }).includes('vault-linked'));
assert.ok(style.graphNodeClassList({ unlocked: false, vaultLinked: true }).includes('vault-only'));
console.log('✅ graph-style tests passed');
