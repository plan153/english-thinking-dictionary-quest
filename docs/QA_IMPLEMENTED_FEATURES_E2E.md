# QA E2E Report — Implemented Features

- When: 2026-07-22T08:19:43.807Z
- URL: http://127.0.0.1:8766/index.html
- Runner: `node scripts/tests/e2e_implemented_features.js`
- Result: **15 passed / 0 failed / 15 total**

## Verdict

Phase 0–1 구현(Active Speaking Set, Q&A matrix, gap notes, Markdown/JSON export)은 E2E 기준으로 통과했다. 테스트 중 progress가 새로고침 후 유실되는 치명 버그를 발견·수정했다.

## Results

| ID | Case | Result | Detail |
|---|---|---|---|
| ASS-01 | 홈에 Active Speaking Set 요약이 보인다 | PASS | 동사 8 / 해금 40 / 내 표현 0 |
| ASS-02 | 데일리 카피에 묻기·답하기 변형이 포함된다 | PASS | step copy includes matrix |
| MX-01 | 홈에 묻기·답하기 변형 모드 카드가 있다 | PASS | mode card present |
| MX-02 | 매트릭스 모드가 레슨으로 진입한다 | PASS | 평서 form, 1/6 |
| GAP-01 | 오답 후 간극 기록 만들기 버튼이 보인다 | PASS | open-gap-form visible |
| GAP-02 | 간극 기록이 localStorage에 저장된다 | PASS | gapNotes saved |
| GAP-03 | 내 성장에 간극 목록/내보내기 버튼이 있다 | PASS | Markdown + JSON buttons |
| EXP-01 | 영어뇌 번들 JSON에 Brain State/Next Practice/Progress가 있다 | PASS | 5 files |
| EXP-02 | Markdown 내보내기가 하나 이상 다운로드된다 | PASS | 5 downloads |
| ASS-03 | 동사 카드에 잠긴 동사/표현 표시가 있다 | PASS | locked verbs/expressions |
| ASS-04 | 해금 표현은 퀴즈(듣기)로 진입할 수 있다 | PASS | lesson opens |
| DQ-01 | 오늘의 퀘스트 stepPlan에 matrix 스텝이 있다 | PASS | v3, step-6:matrix |
| ASS-05 | 내 표현 70% 도달 시 Unlock pack이 열린다 | PASS | pack=1, totalWords=50 |
| GAP-04 | 열린 간극 표현이 복습 추천에 우선 노출된다 | PASS | I need some time first |
| UI-01 | 모바일 홈에서 가로 오버플로가 없다 | PASS | 390×844 |

## Bugs found and fixed

1. **Progress wipe on reload (critical)**  
   `progressStorageKey` / `progressNamePrefix`가 `appState` 생성보다 뒤에 선언되어, 초기 `loadProgress()`가 TDZ `ReferenceError`를 catch하고 항상 기본 progress로 시작했다. 이후 `saveProgress()`가 빈 기록으로 localStorage를 덮어 학습 기록이 새로고침마다 유실됐다.  
   → 키 상수를 `appState` 앞으로 이동.

2. **Unlock not persisted after load**  
   데이터 로드 시 `syncCurriculumUnlock`이 pack을 열어도 localStorage에 쓰지 않았다.  
   → unlock 변경 시 `writeProgressPayload` 호출.

3. **ASS bank size (expressions order)**  
   map 예제가 expressions보다 먼저 dedupe되면 ASS ID가 누락될 수 있어, expressions를 앞에 두도록 유지.

## Artifacts

Screenshots under `/opt/cursor/artifacts/qa-e2e/`:
- `01-home-active-set.png` … `09-mobile-home.png`
- `report.json`, exported Markdown/JSON samples
