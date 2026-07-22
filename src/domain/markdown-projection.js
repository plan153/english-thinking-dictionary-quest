/**
 * Pure Markdown projection for Obsidian English-brain notes.
 * Browser: window.EnglishBrainMarkdown
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.EnglishBrainMarkdown = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function ymd(date = new Date()) {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  }

  function escapeYaml(value) {
    const text = String(value ?? '');
    if (/[:#{}[\],&*?|>!%@`]/.test(text) || /^\s|\s$/.test(text) || text === '') {
      return JSON.stringify(text);
    }
    return text;
  }

  function shortHash(input) {
    let hash = 2166136261;
    const text = String(input || '');
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36).slice(0, 6);
  }

  function normalizeGuess(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[.?!,;:"'()[\]{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function makeGapId({ expressionId, guess, mode, createdAt }) {
    const date = createdAt ? new Date(createdAt) : new Date();
    const stamp = Number.isNaN(date.getTime()) ? ymd() : ymd(date);
    const digest = shortHash(`${expressionId}|${mode || ''}|${normalizeGuess(guess)}`);
    return `gap_${expressionId}_${stamp}_${digest}`;
  }

  function gapVaultPath(gapId) {
    return `Gaps/${gapId}.md`;
  }

  function yamlList(values) {
    if (!values || !values.length) return '[]';
    return `[${values.map(escapeYaml).join(', ')}]`;
  }

  function yamlWeakSlots(slots) {
    if (!slots || !slots.length) return '[]';
    return `\n${slots.map(slot => {
      const key = slot.expressionId ? 'expressionId' : (slot.patternId ? 'patternId' : 'id');
      const value = slot.expressionId || slot.patternId || slot.id;
      return `  - { ${key}: ${escapeYaml(value)}, reason: ${escapeYaml(slot.reason || '')} }`;
    }).join('\n')}`;
  }

  function yamlQueue(queue) {
    if (!queue || !queue.length) return '[]';
    return `\n${queue.map(item => `  - { expressionId: ${escapeYaml(item.expressionId)}, mode: ${escapeYaml(item.mode || 'review')}, reason: ${escapeYaml(item.reason || '')} }`).join('\n')}`;
  }

  function projectGapNote(gap) {
    const id = gap.id || makeGapId(gap);
    const path = gapVaultPath(id);
    const verbLink = gap.verbWord ? `[[Verbs/${gap.verbWord}]]` : '';
    const body = [
      '## 내 추측',
      gap.guess || '(없음)',
      '',
      '## 실제 의미 / 정답',
      gap.actual || gap.english || '',
      gap.naturalKorean ? `- 한국어: ${gap.naturalKorean}` : '',
      '',
      '## 놓친 단서',
      gap.missedClue || '(아직 적지 않음)',
      '',
      '## 모델 업데이트',
      gap.modelUpdate || '(아직 적지 않음)',
      '',
      '## 연결',
      verbLink ? `- 동사: ${verbLink}` : '- 동사: (없음)',
      gap.expressionId ? `- 표현 ID: \`${gap.expressionId}\`` : '',
      gap.mode ? `- 모드: ${gap.mode}` : '',
    ].filter(Boolean).join('\n');

    const markdown = `---
type: gap-note
id: ${escapeYaml(id)}
vaultPath: ${escapeYaml(path)}
expressionId: ${escapeYaml(gap.expressionId || '')}
mode: ${escapeYaml(gap.mode || '')}
createdAt: ${escapeYaml(gap.createdAt || new Date().toISOString())}
updatedAt: ${escapeYaml(gap.updatedAt || gap.createdAt || new Date().toISOString())}
status: ${escapeYaml(gap.status || 'open')}
source: webapp
---

# Gap · ${gap.english || gap.expressionId || id}

${body}
`;
    return { path, markdown, id };
  }

  function projectBrainState(state) {
    const path = 'Learning/Brain State.md';
    const weak = state.weakSlots || [];
    const openGaps = state.openGapIds || [];
    const markdown = `---
type: brain-state
vaultPath: ${escapeYaml(path)}
updatedAt: ${escapeYaml(state.updatedAt || new Date().toISOString())}
activeVerbIds: ${yamlList(state.activeVerbIds || [])}
activeNounIds: ${yamlList(state.activeNounIds || [])}
activeExpressionCount: ${Number(state.activeExpressionCount || 0)}
masteredExpressionCount: ${Number(state.masteredExpressionCount || 0)}
weakSlots: ${yamlWeakSlots(weak)}
unlockReady: ${state.unlockReady ? 'true' : 'false'}
source: webapp
---

# Brain State

지금 입으로 훈련하는 Active Speaking Set 요약입니다.

## Active set
- 동사: ${(state.activeVerbWords || state.activeVerbIds || []).join(', ') || '(없음)'}
- 해금 표현: ${Number(state.activeExpressionCount || 0)}개
- 내 표현: ${Number(state.masteredExpressionCount || 0)}개
- 해금 준비: ${state.unlockReady ? '다음 pack 가능' : '아직 더 익히기'}

## 약한 슬롯
${weak.length ? weak.map(slot => `- ${slot.expressionId || slot.patternId}: ${slot.reason}`).join('\n') : '- (없음)'}

## 열린 간극
${openGaps.length ? openGaps.map(id => `- [[Gaps/${id}]]`).join('\n') : '- (없음)'}
`;
    return { path, markdown };
  }

  function projectNextPractice(state) {
    const path = 'Learning/Next Practice.md';
    const queue = state.queue || [];
    const markdown = `---
type: next-practice
vaultPath: ${escapeYaml(path)}
updatedAt: ${escapeYaml(state.updatedAt || new Date().toISOString())}
queue: ${yamlQueue(queue)}
source: webapp
---

# Next Practice

앱이 약한 연결을 다시 만나도록 제안하는 순서입니다. Vault에서 순서를 바꿔도 됩니다.

${queue.length ? queue.map((item, index) => `${index + 1}. \`${item.expressionId}\` · ${item.mode || 'review'} · ${item.reason || ''}`).join('\n') : '1. (비어 있음)'}
`;
    return { path, markdown };
  }

  function projectProgress(state) {
    const path = 'Learning/Progress.md';
    const markdown = `---
type: progress
vaultPath: ${escapeYaml(path)}
updatedAt: ${escapeYaml(state.updatedAt || new Date().toISOString())}
xp: ${Number(state.xp || 0)}
streak: ${Number(state.streak || 0)}
unlockedPackCount: ${Number(state.unlockedPackCount || 0)}
mineCount: ${Number(state.mineCount || 0)}
activeExpressionCount: ${Number(state.activeExpressionCount || 0)}
openGapCount: ${Number(state.openGapCount || 0)}
source: webapp
---

# Progress

- XP: ${Number(state.xp || 0)}
- 연속 학습: ${Number(state.streak || 0)}일
- Active set 내 표현: ${Number(state.mineCount || 0)} / ${Number(state.activeExpressionCount || 0)}
- Unlock packs: ${Number(state.unlockedPackCount || 0)}
- 열린 간극: ${Number(state.openGapCount || 0)}
`;
    return { path, markdown };
  }

  function projectIndex(state) {
    const path = 'English Brain Index.md';
    const markdown = `---
type: english-brain-index
vaultPath: ${escapeYaml(path)}
updatedAt: ${escapeYaml(state.updatedAt || new Date().toISOString())}
source: webapp
---

# English Brain Index

제2의 영어뇌 입구입니다.

- [[Learning/Brain State]]
- [[Learning/Next Practice]]
- [[Learning/Progress]]
- Gaps: ${(state.openGapIds || []).map(id => `[[Gaps/${id}]]`).join(', ') || '(없음)'}
`;
    return { path, markdown };
  }

  function buildExportFiles({ brainState, nextPractice, progress, gaps }) {
    const files = {};
    const index = projectIndex({
      updatedAt: brainState?.updatedAt,
      openGapIds: (gaps || []).filter(gap => (gap.status || 'open') === 'open').map(gap => gap.id),
    });
    const projected = [
      index,
      projectBrainState(brainState || {}),
      projectNextPractice(nextPractice || {}),
      projectProgress(progress || {}),
      ...(gaps || []).map(projectGapNote),
    ];
    projected.forEach(file => {
      files[file.path] = file.markdown;
    });
    return files;
  }

  return {
    makeGapId,
    gapVaultPath,
    projectGapNote,
    projectBrainState,
    projectNextPractice,
    projectProgress,
    projectIndex,
    buildExportFiles,
    normalizeGuess,
    shortHash,
    ymd,
  };
});
