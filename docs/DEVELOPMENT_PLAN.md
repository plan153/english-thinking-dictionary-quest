# English Thinking Dictionary Quest — 통합 개발 계획

이 문서는 다음 LLM이 그대로 이어서 작업할 수 있도록, 현재 구현 상태와 다음 작업 순서를 분리해서 적는다.

관련 문서:

- [`ACTIVE_SPEAKING_SET.md`](./ACTIVE_SPEAKING_SET.md) — 3~4세급 Active Speaking Set(ASS)과 해금 규칙
- [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md) — Obsidian 영어뇌 양방향 동기화
- [`OBSIDIAN_PLUGINS_SKILLS_FOR_LEARNING.md`](./OBSIDIAN_PLUGINS_SKILLS_FOR_LEARNING.md) — 웹앱↔Vault 플러그인·스킬 역할/효용 조사
- [`OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`](./OBSIDIAN_VAULT_WORD_LINKING_PLAN.md) — Vault 단어 overlay와 연결 정책
- [`DATA_MODEL.md`](./DATA_MODEL.md) — 표현·진행 데이터 모델
- [`CHAPTER_1_SPEC.md`](./CHAPTER_1_SPEC.md) — 연결도·복습 규칙

## 목표

웹앱에서 배우고·틀리고·익힌 기록을 Obsidian Vault(`Project_English`)에 남겨 **제2의 영어뇌 상태**를 만들고, 그 상태를 다시 읽어 약한 부분을 강화하고 익힐 순서를 정한다. 이 루프는 양방향이다 한다.

초기 우선순위는 “많이 외우기”가 아니라 **제한된 만능동사·핵심명사 코로케이션 안에서 묻기/답하기와 시제 뉘앙스를 자유자재로 쓰기**다. 실력 수준은 3~4세 구어체(또는 그 이하)부터 시작한다. Vault에 문서가 더 많아도 연습 출제는 Active Speaking Set만 사용한다.

우선순위는 아래 순서다.

1. Active Speaking Set으로 제한된 동사·명사·패턴만 출제한다.
2. **레벨 테스트로 승급을 확인하고**, 상위 레벨 연습은 **하위 레벨을 나선(spiral)으로 포함**한다.
3. 듣기/따라말하기/묻고답하기/시제 변형으로 구어체 영어를 빠르게 만든다.
4. 웹앱 학습 결과가 Obsidian에 문서화되고, Vault의 Brain State가 다시 앱의 연습 재료·순서가 된다.
5. Vault의 풍부한 배경 지식은 읽기 전용 overlay로만 쓰고, Google Drive/Git은 백업·호환 경로로만 둔다.

## 커리큘럼·동기 점검 요약 (계획 반영)

다관점 점검 결과, 뼈대(ASS 게이트, 표현 카드 → 다중 모드, 연결도·간극, 7분 퀘스트, Unlock pack)는 유지한다. 조일 항목:

| 항목 | 계획 |
| --- | --- |
| 데일리 matrix 밀도 | 의문 1회 → **평서·의문·부정 mini-matrix** |
| 승급 게이트 | 내 표현 비율만으로 자동 해금하지 않고 **레벨 테스트 통과** 후 다음 레벨 |
| 나선 연습 | 상위 레벨 해금 후에도 **하위 레벨 표현을 연습 은행에 유지·가중 출제** |
| 내 표현 정의 | 연결도(뜻·문장·말하기)를 우선하고, 횟수만으로 pack 해금하지 않도록 강화 |
| 콘텐츠 정합 | 명령문/`work` 태그 재밸런스는 후속 큐레이션 패스 |
| 홈 UX | 첫 화면 단순화는 후속 (퀘스트 CTA 유지) |

바꾸지 않는 축: `getUnlockedBank()` 단일 게이트, form variation 매트릭스, Unlock pack 철학, 영어뇌 Markdown 계약.

## 레벨 · 레벨 테스트 · 나선 연습

### 레벨 정의

| 레벨 | 내용 | 비고 |
| --- | --- | --- |
| L1 | Starter 동사 8 + 표현 40 | 기본 Active set |
| L2 | L1 + Unlock pack 1 (표현 +10) | L1 테스트 통과 후 |
| L3+ | 이후 pack / 동사 확장 | 동사 4형태 게이트와 함께 확장 |

규칙:

1. **상위는 하위를 포함한다.** L2 연습 은행 = L1 ∪ L2 신규. 하위만 따로 “버린” 은행을 쓰지 않는다.
2. 데일리/복습 후보 선정 시 상위 레벨에서는 **하위 레벨 표현을 일정 비율(초기 약 40%) 이상** 섞는다.
3. **레벨 테스트:** 현재 레벨 숙달(내 표현 비율 ≥ unlockThreshold)이 되면 테스트 가능. 통과 시에만 다음 Unlock pack/레벨 개방.
4. 레벨 테스트 구성(초기): 현재 레벨 표현에서 장면 고르기·한글→영어·mini-matrix(평서/의문/부정) 혼합, 정답률 기준 통과.
5. progress: `curriculum.unlockedPackCount`, `curriculum.passedLevelTests: string[]`.

## 현재 구현 상태 (이 저장소 기준)

### 이미 동작하는 것

1. 핵심 동사 15개, 핵심 명사 약 66개, 표현 틀 46개, 표현 카드 약 90개로 게임 모드가 동작한다.
2. 듣기 / 따라 말하기 / 한글→영어 / 영어→뜻 / 약한 연결 복습과 오늘의 7분 퀘스트가 있다.
3. `historyByExpressionId`로 뜻·문장·말하기 연결 강도와 `reviewPriority`를 저장한다.
4. 학습 기록은 브라우저 `localStorage`에 저장된다.
5. 콘텐츠 원본은 `data/*.json`이며 `python3 scripts/validate.py`로 검증한다.
6. Active Speaking Set Starter(동사 8·표현 40)가 `learning-paths.json`에 고정되어 있고, `getUnlockedBank()`가 퀴즈·데일리 퀘스트·복습·의미 선택지를 제한한다.
7. 내 표현 비율 70%에 도달하면 **레벨 테스트**가 열린다. 테스트 통과 시 Unlock pack이 해금된다. 상위 레벨 연습은 하위 표현을 나선으로 포함한다.
8. 묻기·답하기·시제 매트릭스 모드(`matrix`)와 데일리 **mini-matrix(평서·의문·부정)** 가 동작한다.
9. `gapNotes` 로컬 저장, Markdown projection export, 열린 간극 복습 가중치 +2.
10. `curriculumLevels`(L1/L2), `passedLevelTests`, 연결도 우선 “내 표현” 정의가 코드에 반영된다.

### 아직 없거나 불완전한 것

1. 파인만식 제한 어휘 설명 챌린지와 explanation → Obsidian 기록.
2. Local REST API / 로컬 브리지 자동 upsert (현재 download만). 조사: [`OBSIDIAN_PLUGINS_SKILLS_FOR_LEARNING.md`](./OBSIDIAN_PLUGINS_SKILLS_FOR_LEARNING.md).
3. Vault → 앱 Next Practice/Gaps 완전 자동 import.
4. Conflict policy 구현·테스트.
5. Vault overlay / 그래프 통합.
6. 동사 단위 매트릭스 4형태 통과 후 새 동사 해금.
7. 계정 로그인(기기 간 progress) — 로컬 학습자 프로필이 선행 설계.
8. ASS 콘텐츠 태그/명령문 큐레이션 패스.
9. 홈 첫 화면 정보량 축소.

## 확정된 충돌·원본 정책

| 데이터 | 원본(Source of Truth) | 동기화 시 우선 |
| --- | --- | --- |
| 퀴즈 진행도, 연결 강도, `reviewPriority`, Active set 해금·레벨 테스트 | 웹앱 `progress` | 앱 우선 |
| 간극 설명 본문, 수동 메모, wikilink 편집 | Obsidian Vault | Vault 우선 |
| 동일 Gap Note ID | 항상 같은 Markdown 경로로 upsert | 마지막 쓰기 시각이 같으면 앱 이벤트 로그 우선 |
| 사전 콘텐츠(`verbs/nouns/patterns/expressions`) | 저장소 `data/*.json` | JSON 우선. Vault 투영본은 파생 문서 |
| Drive / Git 백업 | 파생 복사본 | 학습 루프를 막지 않음 |

삭제 정책: 앱에서 Gap을 보관(archive)하면 Vault 노트는 삭제하지 않고 `status: archived` frontmatter만 갱신한다. Vault에서 수동 삭제한 Gap은 앱으로 재생성하지 않고 `missingInVault` 플래그만 남긴다.

## 다음 단계

### Phase 0 — Active Speaking Set 고정

- [x] Starter set ID를 `learning-paths.json`에 고정
- [x] 출제 게이트 Active set 통일
- [x] Unlock pack 정의 (70% / pack_1)
- [x] 화면 Active set 요약
- [ ] ASS 표현 큐레이션(명령문·상황 태그 재밸런스)

### Phase 1 — Obsidian 노트 최소 루프

- [x] gapNotes + Markdown export
- [ ] Local REST upsert (Phase 3)

### Phase 2 — 출력·매트릭스·레벨

- [x] qa-matrices + matrix 모드
- [x] 데일리 mini-matrix(평서·의문·부정) — 구현 대상
- [x] 레벨 정의 + 레벨 테스트 + 나선 출제 — 구현 대상
- [ ] 파인만 설명 챌린지
- [ ] 동사 4형태 게이트 후 새 동사 해금

### Phase 3 — Obsidian 우선 동기화

- SyncAdapter: `download` → `local-rest` → `bridge`
- 플러그인/스킬 역할은 [`OBSIDIAN_PLUGINS_SKILLS_FOR_LEARNING.md`](./OBSIDIAN_PLUGINS_SKILLS_FOR_LEARNING.md)
- 실패 큐, 학습 비차단
- Git/Drive는 백업만; skills는 progress 비개입

### Phase 4 — Vault overlay

- 읽기 전용 overlay, 사용자 확정 연결만 후보

### Phase 5 — 그래프 통합

- 앱=훈련, Obsidian=문서 탐색

## 설계 원칙

- 정적 앱에 OAuth/API 토큰을 넣지 않는다.
- 앱 progress가 학습 SoT, Obsidian은 영어뇌 문서·메모 SoT.
- Vault가 커도 출제는 unlocked ASS(+나선 하위)만.
- 동일 Gap ID = 동일 Markdown 경로.
- 동기화 실패가 학습을 막지 않는다.
- 어휘 확장보다 숙달·레벨 테스트 먼저.
- **상위 레벨은 하위 레벨 연습을 포함한다.**

## 다른 LLM을 위한 확인 순서

1. 이 문서 → `ACTIVE_SPEAKING_SET.md` → `OBSIDIAN_ENGLISH_BRAIN_SYNC.md` → `OBSIDIAN_PLUGINS_SKILLS_FOR_LEARNING.md`
2. `DATA_MODEL.md`, `CHAPTER_1_SPEC.md`
3. `learning-paths.json`의 `curriculumLevels` / unlock / levelTest
4. `index.html`의 level test, spiral pick, mini-matrix, `getUnlockedBank`
5. `python3 scripts/validate.py` 및 관련 테스트

## 작업 메모

- 다음 큰 기술 덩어리: Phase 3 Local REST.
- 커리큘럼 다음 조임: 동사 게이트, ASS 큐레이션, 홈 단순화.
- 로그인보다 로컬 학습자 공책(`Learners/<id>/`)이 개인 영어뇌 분리의 1순위 설계.
