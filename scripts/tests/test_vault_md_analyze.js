#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const analyze = require(path.join(__dirname, '..', '..', 'src', 'domain', 'vault-md-analyze.js'));

const goodGap = `---
type: gap-note
id: gap_e002_test
expressionId: e002
status: open
source: webapp
---

# Gap · I need some time.

## 놓친 단서
some이 빠짐

## 모델 업데이트
need + some + time

## 연결
- 동사: [[Verbs/need]]
`;

const emptyGap = `---
type: gap-note
id: gap_e003_empty
expressionId: e003
status: open
---

# Gap · I get it.

## 놓친 단서
(아직 적지 않음)

## 모델 업데이트
(아직 적지 않음)
`;

const verb = `---
type: verb
word: need
id: v_need
---

# need

짧게.
`;

const brain = `---
type: brain-state
source: webapp
---

# Brain State
`;

const good = analyze.analyzeNote('Learners/me/Gaps/gap_e002_test.md', goodGap);
assert.strictEqual(good.type, 'gap-note');
assert.strictEqual(good.score, 'good');
assert.strictEqual(good.issues.length, 0);

const bad = analyze.analyzeNote('Learners/me/Gaps/gap_e003_empty.md', emptyGap);
assert.strictEqual(bad.score, 'needs-work');
assert.ok(bad.issues.some((item) => item.code === 'gap-empty-clue'));
assert.ok(bad.issues.some((item) => item.code === 'gap-empty-model'));

const garden = analyze.analyzeNote('Library/Verbs/need.md', verb);
assert.strictEqual(garden.role, 'garden');
assert.strictEqual(garden.score, 'good');

const auto = analyze.analyzeNote('Learners/me/Learning/Brain State.md', brain);
assert.strictEqual(auto.role, 'auto');

const report = analyze.analyzeVaultFiles({
  'Learners/me/Gaps/gap_e002_test.md': goodGap,
  'Learners/me/Gaps/gap_e003_empty.md': emptyGap,
  'Library/Verbs/need.md': verb,
  'Learners/me/Learning/Brain State.md': brain,
  'Learners/me/Learning/Next Practice.md': `---
type: next-practice
queue: []
source: webapp
---
`,
});
assert.strictEqual(report.summary.noteCount, 5);
assert.ok(report.summary.openGapCount >= 2);
assert.ok(report.summary.topActions.some((item) => item.code === 'gap-empty-clue'));
const text = analyze.formatReport(report, { pathPrefix: 'Project_English', learnerId: 'me' });
assert.ok(text.includes('Vault MD 최적화 리포트'));
assert.ok(text.includes('우선 조치'));

console.log('✅ vault md analyze tests passed');
