# English Thinking Dictionary Quest — 통합 개발 계획

이 문서는 다음 LLM이 그대로 이어서 작업할 수 있도록, 현재 구현 상태와 다음 작업 순서를 분리해서 적는다.

관련 문서:

- [`ACTIVE_SPEAKING_SET.md`](./ACTIVE_SPEAKING_SET.md) — 3~4세급 Active Speaking Set(ASS)과 해금 규칙
- [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md) — Obsidian 영어뇌 양방향 동기화(규칙·adapter)
- [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md) — Vault 폴더 계약 SoT (Library 정원 + Learners)
- [`OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`](./OBSIDIAN_VAULT_WORD_LINKING_PLAN.md) — Vault 단어 overlay와 연결 정책
- [`DATA_MODEL.md`](./DATA_MODEL.md) — 표현·진행 데이터 모델
- [`CHAPTER_1_SPEC.md`](./CHAPTER_1_SPEC.md) — 연결도·복습 규칙
- [`PRODUCT_STORY_AND_MARKETING.md`](./PRODUCT_STORY_AND_MARKETING.md) — 비전·마케팅(개발 Phase 번호와 별개)

## 목표

웹앱에서 배우고·틀리고·익힌 기록을 Obsidian Vault(`Project_English`)에 남겨 **제2의 영어뇌 상태**를 만들고, 그 상태를 다시 읽어 약한 부분을 강화하고 익힐 순서를 정한다. 이 루프는 양방향이어야 한다.

초기 우선순위는 “많이 외우기”가 아니라 **제한된 만능동사·핵심명사 코로케이션 안에서 묻기/답하기와 시제 뉘앙스를 자유자재로 쓰기**다. 실력 수준은 3~4세 구어체(또는 그 이하)부터 시작한다. Vault에 문서가 더 많아도 연습 출제는 Active Speaking Set만 사용한다.

우선순위는 아래 순서다.

1. Active Speaking Set으로 제한된 동사·명사·패턴만 출제한다.
2. 듣기/따라말하기/묻고답하기/시제 변형으로 구어체 영어를 빠르게 만든다.
3. 웹앱 학습 결과가 Obsidian에 문서화되고, Vault의 Brain State가 다시 앱의 연습 재료·순서가 된다.
4. Vault의 풍부한 배경 지식은 읽기 전용 overlay로만 쓰고, Google Drive/Git은 백업·호환 경로로만 둔다.

**비전 규모 vs 지금 연습 은행:** 마케팅 문서의 동사 30–50 · 명사 300–400은 장기 비전이다. 지금 입 훈련 범위는 ASS Starter(동사 8 · 표현 ~40) + Unlock pack만이다. UI/카피에서 둘을 섞지 않는다.

## 현재 구현 상태 (이 저장소 기준)

### 이미 동작하는 것

1. 핵심 동사 15개, 핵심 명사 약 66개, 표현 틀 46개, 표현 카드 약 90개로 게임 모드가 동작한다.
2. 듣기 / 따라 말하기 / 한글→영어 / 영어→뜻 / 약한 연결 복습과 오늘의 7분 퀘스트가 있다.
3. `historyByExpressionId`로 뜻·문장·말하기 연결 강도와 `reviewPriority`를 저장한다.
4. 학습 기록은 브라우저 `localStorage`에 저장된다. (`progressStorageKey`는 `appState` 생성 **이전**에 선언해야 한다.)
5. 콘텐츠 원본은 `data/*.json`이며 `python3 scripts/validate.py`로 검증한다.
6. Active Speaking Set Starter(동사 8·표현 40)가 `learning-paths.json`에 고정되어 있고, `getUnlockedBank()`가 퀴즈·데일리 퀘스트·복습·의미 선택지를 제한한다.
7. **내 표현** = 연결도 3축 강함 **또는** 성공 ≥ masteryThreshold. 비율 70%면 다음 Unlock pack(`pack_1` 10 · `pack_2` 9)이 해금된다. 홈/성장에 Active set 요약이 표시된다.
8. 묻기·답하기·시제 매트릭스 모드(`matrix`)가 Active set 표현군 12개에 대해 평서/의문/부정/짧은 답/과거/가까운 미래를 연습한다. 오늘의 퀘스트 6번째 스텝은 **의문 형태 맛보기**다.
9. `gapNotes` 로컬 저장, 퀴즈 결과의 간극 기록 UI, Obsidian Markdown projection(`src/domain/markdown-projection.js`)과 내보내기가 동작한다. 열린 간극은 복습 우선순위에 +2 반영된다.
10. Vault **Library 정원**: Gap → `expressionDrafts` → `Library/Drafts` export, 체크리스트 승격 시 `Library/Canon`. Canon이 곧장 퀴즈 은행에 들어가지는 않는다.
11. **Phase 3 Local REST**: `src/domain/obsidian-sync.js`로 upsert·import·실패 큐·설정 UI.
12. **Learners 경로**: 로그인 없이 공책 전환, export/sync 개인 루트 `Learners/<id>/…`, Library 공유 유지.
13. **Canon 편입 도구**: 승인 Draft → JSON 후보 번들 / Unlock 대기열(자동 출제 없음).
14. **동사 매트릭스 4형태 게이트**: 현재 해금 동사 4형태 통과 시 다음 동사 팩 순차 해금 (`verb_pack_give` → `verb_pack_be`).
15. **Phase 4 Vault overlay**: `vault-overlay.js` + 동사 카드 `Vault 연결` 탭. Local REST로 Library/legacy 노트 매칭 → 확정/watchlist/숨기기. 퀴즈 은행 불변.
16. **파인만 설명 챌린지**: 모드 `explain` — Active set 제한 어휘로 설명, `explanations` + `Learning/Explanations/*.md`.
17. **Conflict 시각 병합 + Bridge adapter**: Gap 본문은 `updatedAt` 비교(동률·없음은 Vault 우선). `bridge`(:8787)는 Local REST와 동일 `/vault` 계약.
18. **파인만 음성**: 설명 챌린지에서 마이크 인식 → `speechTranscript` + Markdown `## 음성 인식`.
19. **Phase 5 그래프 스타일**: `graph-style.js`로 active / vault-linked / vault-only / locked. 동사 칩·문장빌드맵·생각 맵에 반영.
20. **Drive webhook adapter**: `drive-webhook` — Apps Script 등으로 JSON 백업 POST (읽기/import 없음).
21. **모듈 분리(C4)**: `progress-store.js` · `active-speaking-set.js` · `english-brain-export.js` (index는 얇은 래퍼).
22. **Next Practice 세션**: 성장 화면에서 큐를 보고 바로 연습 시작. Vault/간극/watchlist/Brain 힌트 반영.
23. **Brain State 역동기화(소프트)**: import 시 weakSlots·openGapIds 힌트만 저장. XP/성공/해금은 앱 SoT.
24. **Phase 5 그래프 바로가기**: 문장빌드맵·생각 맵·표현 상세에서 듣기/말하기/한글→영어/묻기·답하기.
25. **Watchlist → Next Practice**: 이미 해금된 표현만 제안(퀴즈 은행 불변). Brain State에 watchlist 투영.
26. **생각 맵 데이터 분리**: `src/data/thinking-map-sets.js` + `next-practice.js`.


### 아직 없거나 불완전한 것

1. Drive webhook은 백업 POST만. Google OAuth를 정적 앱에 넣지 않는다.
2. Local REST·Bridge upsert/import/실패 큐가 동작한다. Brain State import는 weakSlots 소프트 힌트만(진행 숫자 불변).
3. Progress.md / Explanations의 Vault→앱 완전 역동기화는 하지 않는다(앱 SoT).
4. Conflict policy는 시각·필드 단위 테스트로 고정.
5. 그래프 연습 바로가기는 듣기/말하기/koen/matrix까지 동작. explain은 모드 카드에서.
6. 동사 매트릭스 4형태 게이트로 `verbUnlockPacks`가 give→be 순차 해금된다. 표현 Unlock pack(`pack_1`/`pack_2`)과 별개.
7. Canon → JSON 후보 번들/Unlock 대기열은 동작한다. `data/expressions.json` 자동 병합은 하지 않는다(리뷰 후 수동).
8. 로컬 학습자 프로필: `etdQuestProgress:<learnerId>` + Vault `Learners/<id>/Learning|Gaps`. Library는 공유.
9. 열린 draft PR(#3, #8–#18)은 tip(#19 등)에 흡수됨. 사람이 GitHub에서 superseded로 닫으면 C0 완료.

## 확정된 충돌·원본 정책

| 데이터 | 원본(Source of Truth) | 동기화 시 우선 |
| --- | --- | --- |
| 퀴즈 진행도, 연결 강도, `reviewPriority`, Active set 해금 상태 | 웹앱 `progress` (localStorage → 이후 progress sync) | 앱 우선 |
| 간극 설명 본문, 수동 메모, wikilink 편집 | Obsidian Vault | Vault 우선 |
| 동일 Gap Note ID | 항상 같은 Markdown 경로로 upsert | 마지막 쓰기 시각이 같으면 앱 이벤트 로그 우선 |
| 사전 콘텐츠(`verbs/nouns/patterns/expressions`) | 저장소 `data/*.json` | JSON 우선. Vault 투영본은 파생 문서 |
| Drive / Git 백업 | 파생 복사본 | 학습 루프를 막지 않음 |

삭제 정책: 앱에서 Gap을 보관(archive)하면 Vault 노트는 삭제하지 않고 `status: archived` frontmatter만 갱신한다. Vault에서 수동 삭제한 Gap은 앱으로 재생성하지 않고 `missingInVault` 플래그만 남긴다.

## 정리·단순화 백로그 (Cleanup)

감사에서 나온 중복·과복잡을 단계적으로 줄인다. **유지할 것:** `getUnlockedBank()` 게이트, 퀴즈 문장 SoT=`expressions.json`, Draft≠자동 출제, Canon≠자동 JSON, 연결 3축 + gap→review+2.

### Cleanup C0 — PR·SoT 정렬 (프로세스)

권장 머지 순서: progress TDZ/E2E(#8) → learner profiles(#9) → level/spiral 계획(#10) → Library garden(#11) → 본 Cleanup.

- [x] tip(#19)이 `main`에 합쳐짐. “이미 동작”을 main 기준으로 갱신. 하위 draft(#3,#8–#18) supersede 종료.
- [x] 개발 Phase 번호(0–5)와 마케팅 Phase(1–7)를 분리한다. 마케팅은 비전 로드맵만.
- [x] Vault 폴더 계약 SoT를 [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md)로 고정하고 SYNC/WORD_LINKING은 이를 참조한다.
- [x] `docs/development-plan-and-changelog.docx|html`는 파생 아카이브로 두고, 편집 SoT는 이 Markdown만 쓴다.

### Cleanup C1 — 문서 정리

- [x] ASS “현재 저장소와의 간격” 구식 표를 구현 상태에 맞게 고친다.
- [x] SYNC Phase 3 경로 목록을 Library/Learners 계약과 맞춘다.
- [x] 읽기 순서에 EVOLUTION을 넣고, 약점 큐를 “간극 → Draft → Next Practice” 한 줄로 적는다.
- [x] Unlock pack vs Library Canon 역할을 문서/카피에서 섞지 않는다.

### Cleanup C2 — 앱 단순화 (홈·퀘스트·진행)

- [x] `progressStorageKey`를 `appState` 생성 전에 선언해 새로고침 시 진행도 유실을 막는다.
- [x] 홈에 `#questArea`를 연결해 데일리 퀘스트 시작/이어하기 UI가 실제로 보이게 한다.
- [x] 홈 첫 구간: 히어로(한 줄 목표) + 오늘의 퀘스트만. Active set·연결·모드 그리드는 아래 구간.
- [x] 데일리 카피를 실제 7스텝(듣기→말하기→장면×2→조립→매트릭스 맛보기→복습)과 맞춘다.
- [x] 해금 카피: “레벨업 = 팩 해금(내 표현 %)”만. 동사 4형태·레벨테스트는 이후 게이트로만 문서화.

### Cleanup C3 — 내 표현·숙달 신호 통일

- [x] `isMineExpression`: 연결도 3축 강함 **우선**, 없으면 성공 횟수 ≥ threshold (둘 다 인정).
- [x] 헤더/성장의 주신호는 내 표현 수·해금 범위. XP/streak는 보조 유지.
- [x] 성장 화면에서 내 표현·연결도 스트립을 주신호로, XP/streak·말하기 세션 카운트를 보조로 정렬.

### Cleanup C4 — 이후 구현 게이트 (아직 코드 안 함)

- [x] 학습자 프로필 머지 시 export 루트를 `Learners/<id>/Learning|Gaps`로 이전.
- [x] Canon → Unlock 후보/JSON 편입 도구(수동 리뷰 후, 자동 출제 없음).
- [x] 동사 매트릭스 4형태 통과 시 새 동사 순차 해금 (`verb_pack_give` → `verb_pack_be`).
- [x] conflict 시각·필드 단위 테스트 보강 · Bridge adapter.
- [x] `index.html`에서 progress/ASS/export 모듈 분리(동작 동일 유지).

## 다음 단계 (기능 Phase)

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
- [x] Local REST API / 브리지로 자동 upsert (Phase 3) — `local-rest` adapter + 실패 큐. bridge는 이후.
- 상세 계약은 [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md)를 따른다.

### Phase 2 — 파인만 출력 · 묻기/답하기 · 시제 변형

- [x] 제한 어휘 설명 챌린지를 만든다. (`explain` 모드 · `src/domain/feynman-challenge.js`)
- [x] 문장 구조 치환 매트릭스로 평서/의문/부정과 간단한 시제 뉘앙스를 반복한다. (`data/qa-matrices.json`, mode `matrix`)
- [x] 녹음/음성 인식 결과를 설명 노트에 추가한다. (`speechTranscript` · Markdown `## 음성 인식`)
- [x] 설명 결과를 `explanations` 필드와 Markdown(`Learning/Explanations/`)에 기록한다.
- [x] 동일 표현군 안에서만 변형시켜 Active set 밖으로 새지 않게 한다.

### Phase 3 — Obsidian 우선 동기화

- [x] `SyncAdapter`로 `download`, `local-rest`, `bridge`, `drive-webhook` 분리 (`src/domain/obsidian-sync.js`).
- [x] Obsidian Local REST API로 Vault upsert/read (Gaps, Learning/*, Library Drafts·Canon·Index).
- [x] 실패 큐와 재시도. 동기화 실패가 학습을 막지 않음.
- [x] import: Gaps + Next Practice + Brain State weakSlots 소프트 힌트 (Vault 본문/큐 우선, 진행 숫자는 앱).
- [x] Bridge adapter(`:8787`, 동일 `/vault` 계약) · Gap conflict `updatedAt` 병합 테스트.
- [x] Drive webhook: 앱 → JSON 백업 POST (import 없음, 비밀값은 localStorage만).
- 파일 경로: 개인 `Learners/<id>/Learning|Gaps` (+ optional Vault `pathPrefix`), 공유 `Library/...`.
- Google Drive 웹훅과 Obsidian Git/GHVault는 Vault 백업·기기 동기용으로만 유지한다.
- AI 에이전트 보조는 Local REST API의 MCP, 또는 Obsidian CLI skills로 Vault 정리만 담당한다.

### Phase 4 — Vault overlay와 Active set 연결

- [x] Vault의 `Library/Verbs|Nouns|Patterns` (및 legacy 루트 노트)를 읽기 전용 overlay로 가져온다. (`src/domain/vault-overlay.js`)
- [x] 자동 연결은 후보만 보여 주고 사용자가 확정한다. (동사 카드 `Vault 연결` 탭 · confirmed / watchlist / dismissed)
- [x] overlay 단어가 Active set 밖이면 연습 출제에 넣지 않고 “나중에 해금” 후보로만 표시한다.
- [x] watchlist 중 이미 해금된 표현만 Next Practice 제안에 넣고, Brain State에 watchlist를 투영한다.
- 상세는 [`OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`](./OBSIDIAN_VAULT_WORD_LINKING_PLAN.md).

### Phase 5 — 그래프와 연습 화면 통합

- 앱 그래프는 핵심 동사/명사 허브 + Active set 표현 중심이다.
- [x] Vault 연결 동사 칩에 `vault-linked` 스타일 표시 (탐색용 구분).
- [x] `graph-style.js`: active / vault-linked / vault-only / locked 분류.
- [x] 문장빌드맵 문장 카드 · 생각 맵 엔진/예문에 Vault·잠김 스타일 반영.
- [x] 노드/예문에서 듣기 · 말하기 · 한글→영어 · 묻기/답하기 바로가기.
- Obsidian 그래프는 문서 탐색용, 앱 그래프는 훈련용으로 역할을 분리한다.

## 설계 원칙

- 정적 앱에 Google OAuth 비밀값이나 Obsidian API 토큰을 넣지 않는다.
- 앱의 원본 학습 데이터는 JSON과 진행 기록이며, Obsidian은 파생 지식 문서이자 영어뇌 상태 저장소다.
- Vault에 정보가 많아도 연습 출제는 Active Speaking Set만 사용한다.
- 동일한 Gap Note ID는 항상 같은 Markdown 경로를 사용한다.
- 동기화 실패가 학습 진행을 막지 않도록 로컬 저장을 먼저 성공시킨다.
- 어휘를 먼저 늘리지 않는다. Active set 숙달 후에만 해금한다.
- 약점 흐름은 **간극(Gap) → Library Draft → (승격) Canon → (리뷰 후) Unlock/JSON** 이다. Next Practice는 그 큐의 연습 순서다.
- 모든 스키마 변경은 이 문서와 관련 설계 문서에 기록한다.

## 다른 LLM을 위한 확인 순서

1. 이 문서(Cleanup + Phase) → `ACTIVE_SPEAKING_SET.md` → `OBSIDIAN_VAULT_EVOLUTION.md`(폴더 SoT) → `OBSIDIAN_ENGLISH_BRAIN_SYNC.md`(동기화 규칙) → `OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`.
2. `DATA_MODEL.md`와 `CHAPTER_1_SPEC.md`에서 진행·복습 규칙을 확인한다.
3. `index.html`의 `defaultProgress`, `markStudy`, daily quest 루프, `isMineExpression`, `getUnlockedBank`를 확인한다.
4. Obsidian 관련 코드가 추가되면 `obsidian-sync.js`, Markdown projection, 브리지/REST adapter 스키마를 유지한다.
5. 변경 후 `python3 scripts/validate.py`와 브라우저 smoke를 실행한다.

## 이 문서를 이어받는 LLM에게 남기는 작업 메모

- 사용자 목표는 “3~4세급 쉬운 말로 시작해, 제한된 만능동사·핵심명사로 실제 말이 되게 만들고, 그 기록이 Obsidian 영어뇌에 남아 다시 앱 학습 재료가 되는 구조”다.
- Phase 0–5 + Feynman + Bridge/conflict + Drive webhook + Next Practice 세션 + Brain soft import + 그래프 바로가기 + watchlist 연동 + mapSets 분리까지 구현됨.
- tip(#19)은 main에 있음. 하위 draft(#3,#8–#18)는 superseded로 닫아 C0를 마무리하면 된다.
