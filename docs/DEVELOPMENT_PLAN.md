# English Thinking Dictionary Quest — 통합 개발 계획

이 문서는 다음 LLM이 그대로 이어서 작업할 수 있도록, 현재 구현 상태와 다음 작업 순서를 분리해서 적는다.

관련 문서:

- [`ACTIVE_SPEAKING_SET.md`](./ACTIVE_SPEAKING_SET.md) — 3~4세급 Active Speaking Set(ASS)과 해금 규칙
- [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md) — Obsidian 영어뇌 양방향 동기화
- [`OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`](./OBSIDIAN_VAULT_WORD_LINKING_PLAN.md) — Vault 단어 overlay와 연결 정책
- [`DATA_MODEL.md`](./DATA_MODEL.md) — 표현·진행 데이터 모델
- [`CHAPTER_1_SPEC.md`](./CHAPTER_1_SPEC.md) — 연결도·복습 규칙

## 목표

웹앱에서 배우고·틀리고·익힌 기록을 Obsidian Vault(`Project_English`)에 남겨 **제2의 영어뇌 상태**를 만들고, 그 상태를 다시 읽어 약한 부분을 강화하고 익힐 순서를 정한다. 이 루프는 양방향이다 한다.

초기 우선순위는 “많이 외우기”가 아니라 **제한된 만능동사·핵심명사 코로케이션 안에서 묻기/답하기와 시제 뉘앙스를 자유자재로 쓰기**다. 실력 수준은 3~4세 구어체(또는 그 이하)부터 시작한다. Vault에 문서가 더 많아도 연습 출제는 Active Speaking Set만 사용한다.

우선순위는 아래 순서다.

1. Active Speaking Set으로 제한된 동사·명사·패턴만 출제한다.
2. 듣기/따라말하기/묻고답하기/시제 변형으로 구어체 영어를 빠르게 만든다.
3. 웹앱 학습 결과가 Obsidian에 문서화되고, Vault의 Brain State가 다시 앱의 연습 재료·순서가 된다.
4. Vault의 풍부한 배경 지식은 읽기 전용 overlay로만 쓰고, Google Drive/Git은 백업·호환 경로로만 둔다.

## 현재 구현 상태 (이 저장소 기준)

### 이미 동작하는 것

1. 핵심 동사 15개, 핵심 명사 약 66개, 표현 틀 46개, 표현 카드 약 90개로 게임 모드가 동작한다.
2. 듣기 / 따라 말하기 / 한글→영어 / 영어→뜻 / 약한 연결 복습과 오늘의 7분 퀘스트가 있다.
3. `historyByExpressionId`로 뜻·문장·말하기 연결 강도와 `reviewPriority`를 저장한다.
4. 학습 기록은 브라우저 `localStorage`에 저장된다.
5. 콘텐츠 원본은 `data/*.json`이며 `python3 scripts/validate.py`로 검증한다.
6. Active Speaking Set Starter(동사 8·표현 40)가 `learning-paths.json`에 고정되어 있고, `getUnlockedBank()`가 퀴즈·데일리 퀘스트·복습·의미 선택지를 제한한다.
7. 내 표현 비율 70%에 도달하면 Unlock pack 1(표현 10개)이 해금된다. 홈/성장에 Active set 요약이 표시된다.
8. 묻기·답하기·시제 매트릭스 모드(`matrix`)가 Active set 표현군 12개에 대해 평서/의문/부정/짧은 답/과거/가까운 미래를 연습한다. 오늘의 퀘스트 6번째 스텝에도 들어간다.
9. `gapNotes` 로컬 저장, 퀴즈 결과의 간극 기록 UI, Obsidian Markdown projection(`src/domain/markdown-projection.js`)과 내보내기가 동작한다. 열린 간극은 복습 우선순위에 +2 반영된다.
10. 로컬 학습자 프로필(로그인 없음): `etdLearnerProfiles` + `etdQuestProgress:<learnerId>`. 영어뇌 내보내기는 `Learners/<learnerId>/` 아래에 둔다. 공통 교과서는 `data/*.json` / Vault `Verbs|Nouns|Patterns`를 공유한다.

### 아직 없거나 불완전한 것

1. 파인만식 제한 어휘 설명 챌린지와 explanation → Obsidian 기록은 아직이다.
2. Local REST API / 로컬 브리지로 Vault에 자동 upsert하는 기능은 아직이다. 현재는 다운로드 adapter만 있다.
3. Obsidian에서 수동 수정한 내용의 완전 자동 역동기화가 없다.
4. Conflict policy는 아래에서 확정했지만, 구현·테스트는 아직이다.
5. Vault 단어/표현 overlay와 앱·Obsidian 그래프 통합은 계획 단계다.
6. 동사 단위 매트릭스 4형태 통과 조건으로 새 동사 해금하는 규칙은 아직 표현 팩 해금만 구현했다.
7. 계정 로그인으로 기기 간 progress 이어하기는 아직이다(로컬 프로필만).

## 확정된 충돌·원본 정책

| 데이터 | 원본(Source of Truth) | 동기화 시 우선 |
| --- | --- | --- |
| 퀴즈 진행도, 연결 강도, `reviewPriority`, Active set 해금 상태 | 웹앱 `progress` (`etdQuestProgress:<learnerId>` → 이후 로그인 sync) | 앱 우선 |
| 간극 설명 본문, 수동 메모, wikilink 편집 | Obsidian Vault | Vault 우선 |
| 동일 Gap Note ID | 항상 같은 Markdown 경로로 upsert | 마지막 쓰기 시각이 같으면 앱 이벤트 로그 우선 |
| 사전 콘텐츠(`verbs/nouns/patterns/expressions`) | 저장소 `data/*.json` | JSON 우선. Vault 투영본은 파생 문서 |
| Drive / Git 백업 | 파생 복사본 | 학습 루프를 막지 않음 |

삭제 정책: 앱에서 Gap을 보관(archive)하면 Vault 노트는 삭제하지 않고 `status: archived` frontmatter만 갱신한다. Vault에서 수동 삭제한 Gap은 앱으로 재생성하지 않고 `missingInVault` 플래그만 남긴다.

## 다음 단계

### Phase 0 — Active Speaking Set 고정

- [x] [`ACTIVE_SPEAKING_SET.md`](./ACTIVE_SPEAKING_SET.md)의 Starter 세트(동사·명사·패턴·표현 ID)를 `learning-paths.json` 또는 `CURRICULUM_CONFIG`로 코드에 고정한다.
- [x] 퀴즈·사전 탐험·복습 출제를 Active set으로 제한한다. Vault/전체 JSON에 더 있어도 잠근다.
- [x] mastery 기준(연결도 또는 성공 횟수)을 충족하면 다음 묶음만 해금한다. 한 번에 전체 사전을 열지 않는다.
- [x] 화면과 README에 “지금 연습 중인 영어뇌 범위”를 보여 준다.

### Phase 1 — 학습 이벤트를 Obsidian 노트로 남기는 최소 루프

- [x] `gapNotes` 스키마와 마이그레이션을 확정한다.
- [x] 문제 풀이 직후 “간극 기록 만들기” UI를 표준화한다.
- [x] 간극 노트를 복습 후보 가중치에 반영한다.
- [x] Markdown frontmatter와 `Learning/Brain State.md`, `Learning/Next Practice.md`, `Learning/Progress.md`를 안정적으로 생성한다.
- [x] 같은 ID는 같은 Markdown 경로로만 갱신한다.
- [ ] Local REST API / 브리지로 자동 upsert (Phase 3)
- 상세 계약은 [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md)를 따른다.

### Phase 2 — 파인만 출력 · 묻기/답하기 · 시제 변형

- [ ] 제한 어휘 설명 챌린지를 만든다.
- [x] 문장 구조 치환 매트릭스로 평서/의문/부정과 간단한 시제 뉘앙스를 반복한다. (`data/qa-matrices.json`, mode `matrix`)
- [ ] 녹음/음성 인식 결과를 설명 노트에 추가한다.
- [ ] 설명 결과를 `explanation` 필드와 Markdown 본문에 기록한다.
- [x] 동일 표현군 안에서만 변형시켜 Active set 밖으로 새지 않게 한다.

### Phase 3 — Obsidian 우선 동기화

- `SyncAdapter`로 `download`, `local-rest`, `bridge`, `drive-webhook`을 분리한다.
- 1순위 구현은 Obsidian Local REST API(또는 동등 로컬 브리지)로 Vault upsert/read다.
- 파일 경로: `Gaps/`, `Learning/`, `Patterns/`, `Verbs/`, `Nouns/`, `Prepositions/`, `Reviews/`.
- 실패 큐와 재시도 상태를 추가한다. 동기화 실패가 학습을 막지 않는다.
- Google Drive 웹훅과 Obsidian Git/GHVault는 Vault 백업·기기 동기용으로만 유지한다.
- AI 에이전트 보조는 Local REST API의 MCP, 또는 Obsidian CLI skills로 Vault 정리만 담당한다.

### Phase 4 — Vault overlay와 Active set 연결

- Vault의 `Verbs/`, `Nouns/`, `Prepositions/`, `Words/`를 읽기 전용 overlay로 가져온다.
- 자동 연결은 후보만 보여 주고 사용자가 확정한다.
- overlay 단어가 Active set 밖이면 연습 출제에 넣지 않고 “나중에 해금” 후보로만 표시한다.
- 상세는 [`OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`](./OBSIDIAN_VAULT_WORD_LINKING_PLAN.md).

### Phase 5 — 그래프와 연습 화면 통합

- 앱 그래프는 핵심 동사/명사 허브 + Active set 표현 중심이다.
- 노드 클릭 시 생각틀과 묻기/답하기/듣기 연습으로 바로 넘어간다.
- Obsidian 그래프는 문서 탐색용, 앱 그래프는 훈련용으로 역할을 분리한다.

## 설계 원칙

- 정적 앱에 Google OAuth 비밀값이나 Obsidian API 토큰을 넣지 않는다.
- 앱의 원본 학습 데이터는 JSON과 진행 기록이며, Obsidian은 파생 지식 문서이자 영어뇌 상태 저장소다.
- Vault에 정보가 많아도 연습 출제는 Active Speaking Set만 사용한다.
- 동일한 Gap Note ID는 항상 같은 Markdown 경로를 사용한다.
- 동기화 실패가 학습 진행을 막지 않도록 로컬 저장을 먼저 성공시킨다.
- 어휘를 먼저 늘리지 않는다. Active set 숙달 후에만 해금한다.
- 모든 스키마 변경은 이 문서와 관련 설계 문서에 기록한다.

## 다른 LLM을 위한 확인 순서

1. 이 문서 → `ACTIVE_SPEAKING_SET.md` → `OBSIDIAN_ENGLISH_BRAIN_SYNC.md` → `OBSIDIAN_VAULT_WORD_LINKING_PLAN.md` 순으로 읽는다.
2. `DATA_MODEL.md`와 `CHAPTER_1_SPEC.md`에서 진행·복습 규칙을 확인한다.
3. `index.html`의 `defaultProgress`, `markStudy`, daily quest 루프를 확인한다.
4. Obsidian 관련 코드가 추가되면 `obsidian-sync.js`, Markdown projection, 브리지/REST adapter 스키마를 유지한다.
5. 변경 후 `python3 scripts/validate.py`와 브라우저 smoke를 실행한다.

## 이 문서를 이어받는 LLM에게 남기는 작업 메모

- 사용자 목표는 “3~4세급 쉬운 말로 시작해, 제한된 만능동사·핵심명사로 실제 말이 되게 만들고, 그 기록이 Obsidian 영어뇌에 남아 다시 앱 학습 재료가 되는 구조”다.
- 당장 필요한 것은 콘텐츠 양 확장보다 Active set 경계와 학습 이벤트 → Vault → Next Practice 루프다.
- 다음 구현 우선순위: `Phase 3 local-rest sync` → `Phase 4 overlay` → 파인만 설명 챌린지.
- Phase 0 Active Speaking Set, Phase 2 매트릭스, Phase 1 gapNotes/Markdown export는 구현됨.
