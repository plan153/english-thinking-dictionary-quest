#!/usr/bin/env node
'use strict';

const assert = require('assert');
const ProgressStore = require('../../src/domain/progress-store.js');

const defaults = ProgressStore.defaultProgress();
assert.strictEqual(
  defaults.settings.policyOpenImplementedBank,
  true,
  'implemented bank should be open by default'
);

const memory = {
  data: {},
  getItem(key) { return this.data[key] ?? null; },
  setItem(key, value) { this.data[key] = String(value); },
  removeItem(key) { delete this.data[key]; },
};

ProgressStore.ensureLearnerProfiles(memory);
// Legacy saved settings without the new key keep default ON via merge.
ProgressStore.writeProgressPayload({
  ...defaults,
  settings: {
    soundEnabled: true,
    policyCanonAutoMerge: true,
  },
}, 'me', memory, null);
const loaded = ProgressStore.loadProgress('me', { storage: memory });
assert.strictEqual(loaded.settings.policyOpenImplementedBank, true);

console.log('✅ open-implemented-bank policy tests passed');
