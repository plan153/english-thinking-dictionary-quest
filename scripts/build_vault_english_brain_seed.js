#!/usr/bin/env node
/**
 * Build optimized Project_English Markdown seed from data/*.json.
 * Output: vault/Project_English/**
 *
 *   node scripts/build_vault_english_brain_seed.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'vault', 'Project_English');

const STARTER_VERB_IDS = [
  'v_have', 'v_get', 'v_want', 'v_need', 'v_go', 'v_come',
  'v_make', 'v_take', 'v_be', 'v_do', 'v_give', 'v_feel',
];

const CORE_NOUN_WORDS = [
  'time', 'help', 'question', 'home', 'idea', 'plan', 'break',
  'water', 'coffee', 'sleep', 'day', 'thing', 'progress', 'decision',
];

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', name), 'utf8'));
}

function asList(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function write(rel, content) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function yamlEscape(value) {
  const text = String(value ?? '');
  if (/[:#{}[\],&*?|>!%@`]/.test(text) || /^\s|\s$/.test(text) || text === '') {
    return JSON.stringify(text);
  }
  return text;
}

function patternFileName(pattern) {
  const label = String(pattern.label || pattern.pattern || pattern.id || 'pattern')
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return `${label}.md`;
}

function buildVerbNote(verb, patternById) {
  const patterns = (verb.patternIds || [])
    .map((id) => patternById.get(id))
    .filter(Boolean);
  const patternLinks = patterns
    .map((p) => `- [[Patterns/${String(p.label || p.pattern || p.id).replace(/[\\/]/g, '-')}]]`)
    .join('\n') || '- (패턴 연결 예정)';
  const situations = (verb.representativeSituations || []).slice(0, 4)
    .map((s) => `- ${s}`)
    .join('\n') || '- (장면 추가)';
  return `---
type: verb
word: ${yamlEscape(verb.word)}
id: ${yamlEscape(verb.id)}
aliases: [${yamlEscape(verb.word)}, ${yamlEscape(`${verb.word}s`)}]
level: ${yamlEscape(verb.level || 'starter')}
updatedAt: ${yamlEscape(new Date().toISOString())}
source: vault-seed
---

# ${verb.word}

## 핵심 이미지
${verb.coreImage || verb.easyKorean || ''}

## 쉬운 한국어
${verb.easyKorean || ''}

## 자주 쓰는 틀
${patternLinks}

## 대표 장면
${situations}

## 연결 규칙
- Draft/Canon 표현만 퀴즈 후보로 승격
- 이 노트는 정원(배경 지식) — 자동 출제하지 않음
`;
}

function buildPatternNote(pattern, verbById) {
  const label = pattern.label || pattern.pattern || pattern.id;
  const verbs = (pattern.verbIds || STARTER_VERB_IDS.filter((id) => (pattern.id || '').includes(id.slice(2))))
    .map((id) => verbById.get(id))
    .filter(Boolean);
  const verbLinks = verbs.length
    ? verbs.map((v) => `- [[Verbs/${v.word}]]`).join('\n')
    : '- (동사 링크 추가)';
  return `---
type: pattern
word: ${yamlEscape(label)}
id: ${yamlEscape(pattern.id)}
aliases: [${yamlEscape(label)}]
updatedAt: ${yamlEscape(new Date().toISOString())}
source: vault-seed
---

# ${label}

## 생각 틀
${pattern.coreImage || pattern.easyKorean || pattern.description || '동사 + 자리(명사/상태)로 문장을 조립한다.'}

## 동사
${verbLinks}

## 예
${(pattern.examples || pattern.sampleSentences || []).slice(0, 4).map((e) => `- ${typeof e === 'string' ? e : (e.en || e.english || JSON.stringify(e))}`).join('\n') || '- (앱 연습에서 채움)'}

## 연결
- Library Drafts에서 이 틀을 \`pattern\` 필드에 적고 승격한다.
`;
}

function buildNounNote(noun) {
  const word = noun.word || noun.label;
  return `---
type: noun
word: ${yamlEscape(word)}
id: ${yamlEscape(noun.id)}
aliases: [${yamlEscape(word)}]
updatedAt: ${yamlEscape(new Date().toISOString())}
source: vault-seed
---

# ${word}

## 역할
동사 옆에 붙는 **자리**로만 기억한다. 단어장식 암기 금지.

## 쉬운 한국어
${noun.easyKorean || noun.coreImage || ''}

## 자주 붙는 동사
${(noun.commonVerbIds || noun.verbIds || []).slice(0, 6).map((id) => `- [[Verbs/${id.replace(/^v_/, '')}]]`).join('\n') || '- [[Verbs/have]] / [[Verbs/need]] / [[Verbs/get]] 등과 연결'}
`;
}

function buildSceneNote({ id, title, verbs, lines }) {
  return `---
type: scene
word: ${yamlEscape(title)}
id: ${yamlEscape(id)}
updatedAt: ${yamlEscape(new Date().toISOString())}
source: vault-seed
---

# ${title}

## 한 줄
${lines[0]}

## 꺼내 쓸 동사
${verbs.map((w) => `- [[Verbs/${w}]]`).join('\n')}

## 연습 힌트
${lines.slice(1).map((l) => `- ${l}`).join('\n')}
`;
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });

  const verbs = asList(loadJson('verbs.json'), ['verbs']);
  const patterns = asList(loadJson('patterns.json'), ['patterns']);
  const nouns = asList(loadJson('nouns.json'), ['nouns']);
  const verbById = new Map(verbs.map((v) => [v.id, v]));
  const patternById = new Map(patterns.map((p) => [p.id, p]));

  const starterVerbs = STARTER_VERB_IDS.map((id) => verbById.get(id)).filter(Boolean);
  const linkedPatternIds = new Set();
  starterVerbs.forEach((v) => (v.patternIds || []).forEach((id) => linkedPatternIds.add(id)));
  const starterPatterns = patterns.filter((p) => linkedPatternIds.has(p.id));

  starterVerbs.forEach((verb) => {
    write(`Library/Verbs/${verb.word}.md`, buildVerbNote(verb, patternById));
  });

  starterPatterns.forEach((pattern) => {
    write(`Library/Patterns/${patternFileName(pattern)}`, buildPatternNote(pattern, verbById));
  });

  CORE_NOUN_WORDS.forEach((word) => {
    const noun = nouns.find((n) => String(n.word || n.label || '').toLowerCase() === word);
    if (!noun) return;
    write(`Library/Nouns/${noun.word || word}.md`, buildNounNote(noun));
  });

  const scenes = [
    {
      id: 'scene_ask_help',
      title: '부탁·도움 요청',
      verbs: ['need', 'have', 'get', 'give'],
      lines: [
        '도움이 필요할 때 need/have/get으로 짧게 연다.',
        'I need help. / Do you have a minute? / Can I get some help?',
      ],
    },
    {
      id: 'scene_time',
      title: '시간 말하기',
      verbs: ['have', 'need', 'take'],
      lines: [
        '시간 부족·여유는 have/need/take + time.',
        'I need some time. / I have time. / It takes time.',
      ],
    },
    {
      id: 'scene_home',
      title: '집·편안함',
      verbs: ['come', 'go', 'make', 'feel', 'be'],
      lines: [
        '오고 가기, 편하게 있기.',
        'Come in. / Make yourself at home. / I feel tired.',
      ],
    },
    {
      id: 'scene_plan',
      title: '계획·결정',
      verbs: ['have', 'make', 'get', 'do'],
      lines: [
        '아이디어·계획·결정을 동사로 붙인다.',
        'I have an idea. / Make a plan. / I get it.',
      ],
    },
  ];
  scenes.forEach((scene) => write(`Library/Scenes/${scene.title}.md`, buildSceneNote(scene)));

  write('Library/Drafts/.gitkeep', '');
  write('Library/Canon/.gitkeep', '');

  write('Library/Index.md', `---
type: library-index
vaultPath: Library/Index.md
updatedAt: ${yamlEscape(new Date().toISOString())}
draftCount: 0
canonCount: 0
source: vault-seed
---

# Library · 학습 자료 정원

Vault에서 자료가 자라고, 웹앱은 **승격(Canon)된 것만** 연습합니다.

## 폴더
- \`Verbs/\` \`Nouns/\` \`Patterns/\` \`Scenes/\` — 배경 지식 (원자 노트)
- \`Drafts/\` — 진화 중 후보
- \`Canon/\` — 승격 완료

## 시드 동사
${starterVerbs.map((v) => `- [[Verbs/${v.word}]] · \`${v.id}\``).join('\n')}

## 루프
수집(Gap/장면) → Draft → 체크리스트 → Canon → (리뷰 후) Active Set / Unlock 후보

## Drafts
\`\`\`dataview
TABLE status, english, coreVerb, pattern, updatedAt
WHERE contains(file.folder, "Library/Drafts") AND type = "expression-draft"
SORT updatedAt DESC
\`\`\`

## Canon
\`\`\`dataview
TABLE english, coreVerb, pattern, updatedAt
WHERE contains(file.folder, "Library/Canon") AND type = "expression-draft" AND status = "approved"
SORT updatedAt DESC
\`\`\`
`);

  write('Learners/me/English Brain Index.md', `---
type: english-brain-index
vaultPath: Learners/me/English Brain Index.md
learnerId: me
learnerName: 나
updatedAt: ${yamlEscape(new Date().toISOString())}
source: vault-seed
---

# English Brain Index · 나

제2의 영어뇌 입구. **교과서는 공유(Library), 이 폴더는 개인 공책.**

## 바로가기
- [[Learners/me/Learning/Brain State|Brain State]]
- [[Learners/me/Learning/Next Practice|Next Practice]]
- [[Learners/me/Learning/Progress|Progress]]
- [[Library/Index]]
- [[MOC/English Brain]]

## 열린 간극
\`\`\`dataview
TABLE status, expressionId, updatedAt
WHERE contains(file.folder, "Learners/me/Gaps") AND type = "gap-note" AND status = "open"
SORT updatedAt DESC
\`\`\`

## 오늘 할 일 (짧게)
1. 앱 Next Practice 10–15분 (말하기/조립 우선)
2. 열린 Gap 1–3개만 「놓친 단서」「모델 업데이트」채우기
3. 필요하면 Draft 1개 → 체크리스트

> Brain State / Next Practice / Progress 본문은 웹앱 sync가 갱신합니다. 긴 서사는 Gap·Library에만 쓰세요.
`);

  write('Learners/me/Learning/.gitkeep', '');
  write('Learners/me/Gaps/.gitkeep', '');

  write('Learners/me/Learning/Weekly Review.md', `---
type: weekly-review
learnerId: me
updatedAt: ${yamlEscape(new Date().toISOString())}
source: vault-seed
---

# Weekly Review · 나

주 1회만. 길게 쓰지 말 것.

## 이번 주 잘 나온 동사
-

## 반복된 간극 패턴
-

## 다음 주 집중 (동사 1 + 틀 1)
- 동사:
- 틀:

## Draft → Canon 후보
-
`);

  write('MOC/English Brain.md', `---
type: moc
updatedAt: ${yamlEscape(new Date().toISOString())}
source: vault-seed
---

# MOC · English Brain

## 개인
- [[Learners/me/English Brain Index]]

## 정원
- [[Library/Index]]
- 동사: ${starterVerbs.map((v) => `[[Verbs/${v.word}]]`).join(' · ')}

## 장면
${scenes.map((s) => `- [[Scenes/${s.title}]]`).join('\n')}

## 원칙
1. 한 파일 = 한 역할 (Gap / Verb / Draft)
2. 앱 자동 노트(Brain State 등)는 뼈대 유지
3. 링크 ≥1, 본문은 짧게
`);

  // Templates for Templater / manual copy
  write('Templates/Gap.md', `---
type: gap-note
id: gap_
expressionId:
mode:
status: template
createdAt: {{date}}
updatedAt: {{date}}
source: manual
---

# Gap ·

## 내 추측


## 실제 의미 / 정답


## 놓친 단서


## 모델 업데이트


## 연결
- 동사: [[Verbs/]]
- 표현 ID: \`\`
`);

  write('Templates/Verb.md', `---
type: verb
word:
id: v_
aliases: []
updatedAt: {{date}}
source: manual
---

# 

## 핵심 이미지


## 자주 쓰는 틀
- [[Patterns/]]

## 대표 장면
-
`);

  write('Templates/Draft.md', `---
type: expression-draft
id: draft_
status: template
english:
naturalKorean:
literalMeaning:
coreVerb:
pattern:
expressionId:
assEligible: true
source: manual
sourceGapId:
promoteReady: false
updatedAt: {{date}}
---

# Draft ·

## 영어 / 한국어
- EN:
- KO:

## 생각 틀
- 동사: [[Verbs/]]
- 패턴:

## 승격 체크리스트
- [ ] english
- [ ] naturalKorean
- [ ] coreVerb
- [ ] pattern
`);

  write('Templates/Scene.md', `---
type: scene
word:
id: scene_
updatedAt: {{date}}
source: manual
---

# 

## 한 줄


## 꺼내 쓸 동사
- [[Verbs/]]

## 연습 힌트
-
`);

  write('README.md', `# Project_English vault seed

영어뇌(제2 뇌)용 최적화된 Markdown 시드입니다.

## Mac에 적용

1. Obsidian + Local REST(HTTP 27123) 실행
2. 앱 Path prefix = \`Project_English\` (상위 vault인 경우)
3. 레포에서:

\`\`\`bash
cd /Users/mini/Projects/english-thinking-dictionary-quest
git pull
export OBSIDIAN_API_KEY='...'
export OBSIDIAN_PATH_PREFIX=Project_English
node scripts/seed_vault_english_brain.js
node scripts/analyze_vault_md.js
\`\`\`

\`SEED_MODE=skip-existing\` (기본)은 이미 있는 파일을 덮지 않습니다.  
강제 갱신: \`SEED_MODE=overwrite\`.

## 포함
- Library Verbs/Patterns/Nouns/Scenes (ASS 시드)
- Learners/me Index + Weekly Review + Dataview
- Templates (Gap/Verb/Draft/Scene)
- MOC

Brain State / Next Practice / Progress 는 웹앱 sync가 채웁니다.
`);

  const count = (dir) => {
    let n = 0;
    if (!fs.existsSync(dir)) return 0;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) n += count(p);
      else if (ent.name.endsWith('.md')) n += 1;
    }
    return n;
  };

  console.log(`✅ wrote seed under vault/Project_English (${count(OUT)} markdown files)`);
  console.log(`   verbs=${starterVerbs.length} patterns=${starterPatterns.length}`);
}

main();
