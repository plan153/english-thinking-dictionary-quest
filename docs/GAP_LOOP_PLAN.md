# 간극(Gap) 루프 계획서

> SoT: 이 문서.  
> 관련: [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md) · [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md) · [`BACKLOG.md`](./BACKLOG.md) · [`AGENT_MEMORY.md`](./AGENT_MEMORY.md)  
> 기준 앱: **v1.3.52+** (자기메우기 루프 1차) · 갱신: 2026-07-31

---

## 1. 목적

영어 학습에서 생긴 **간극**(틀린 이유·놓친 단서)을 Obsidian에 남기고, 앱이 다시 꺼내 **스스로 메우게** 한다.

AI에게 그때그때 물어 고치는 방식이 아니다.  
학습자가 **어디가 다른지 찾아 적고**, 그 메모가 **다음 힌트**가 되며, Vault Gaps와 함께 메워 간다.

```text
틀림
  → 힌트/대조로 스스로 찾기 (정답 선공개 금지)
  → 간극에 missedClue / modelUpdate 저장
  → Learners/<id>/Gaps/<gapId>.md 동기화
  → 다음 연습: 「내 간극 힌트」로 회수
  → 다시 맞춤 → status: reviewed
  → (선택) Draft → Canon → Unlock
```

---

## 2. 제품 원칙 (불변)

| # | 원칙 | 의미 |
| --- | --- | --- |
| 1 | **자기 발견 우선** | 정답을 먼저 보여 주지 않는다. 단서를 적은 뒤에만 정답 확인. |
| 2 | **AI 대행 금지** | 틀린 즉시 “정답 설명 AI”나 빈 간극 자동 생성으로 메우지 않는다. |
| 3 | **피드백 → 힌트** | `missedClue` / `modelUpdate`는 다음 시도의 개인 힌트가 된다. |
| 4 | **Vault와 한몸** | 개인 간극 SoT 경로 = `Learners/<learnerId>/Gaps/<id>.md`. |
| 5 | **메움까지 닫기** | open → (연습) → `reviewed`(또는 보관 `archived`). 열린 채 방치하지 않는다. |
| 6 | **노이즈 금지** | 빈 본문 gap, 자동 Draft 폭증, 동의어 중복 UI는 제품 버그로 본다. |

---

## 3. 현재 상태 (v1.3.52)

### 3.1 동작 중

| 기능 | 구현 위치 |
| --- | --- |
| 수동 간극 폼 (단서 필수 · 정답 후공개) | `index.html` → `openGapNoteForm` |
| 홈/레슨 오답 → 간극 CTA + 자기메우기 코칭 | `checkComposeAnswer` · `showAnswerSummary` · `chooseAnswer` |
| 열린 간극 → 힌트 사다리 앞단 | `itemHintList` ← `learnerGapHintsForExpression` |
| 재성공 시 `reviewed` | `markOpenGapsReviewed` |
| 성장 화면 목록 · 메움/보관/Draft/다시연결 | `renderGapNotesList` |
| Markdown projection | `src/domain/markdown-projection.js` → `projectGapNote` |
| Local REST upsert / import merge | `src/domain/obsidian-sync.js` |
| Next Practice에 open gap 포함 | `index.html` 큐 빌드 + `src/domain/next-practice.js` |
| 스키마 `open \| reviewed \| archived` | `src/domain/progress-store.js` → `normalizeGapNote` |

### 3.2 v1.3.52에서 제거·금지한 것

- `recordPracticeEvent`가 retry마다 **빈 gap + Draft 자동 생성**하던 경로 → **중단**
- 간극 폼에 **정답 미리 채우기** → **중단** (단서 작성 후 「정답 확인」)

### 3.3 아직 미완 (BACKLOG G2–G4)

| ID | 항목 | 우선 |
| --- | --- | --- |
| G2 | 듣기/말하기 실패 UI에 간극 CTA | P1 |
| G3 | Next Practice 다중 간극 세션(큐 순회) | P1 |
| G4 | Vault-only gap `english` 표시 보강 | P2 |
| G5 | 홈에 열린 간극 수/회수 넛지 | P2 |
| G6 | classifier 오답 메시지를 단서 초안으로만 제안(강요 금지) | P2 |
| G7 | `DATA_MODEL.md`에 `gapNotes` 공식 스키마 반영 | P2 |

---

## 4. 데이터 모델

### 4.1 앱 (`progress.gapNotes[]`)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | `gap_<expressionId>_<YYYYMMDD>_<hash>` (`makeGapId`) |
| `expressionId` | string | 퀴즈 표현 ID |
| `english` / `naturalKorean` | string | 목표 문장·한국어 |
| `guess` | string | 내 추측 |
| `actual` | string | 정답(단서 작성 후 확인 시 채움) |
| `missedClue` | string | **놓친 단서** (자기메우기 핵심) |
| `modelUpdate` | string | **다음에 이렇게 생각하기** |
| `mode` | string | `koen` / `speak` / … |
| `verbId` / `verbWord` | string | 엔진 동사 |
| `status` | `open` \| `reviewed` \| `archived` | 열림 / 메움 / 보관 |
| `source` | string | `webapp` \| `vault` … |
| `missingInVault` | bool | Vault에서 삭제된 open 표식 |
| `createdAt` / `updatedAt` | ISO string | 병합 키 |

저장 키: `etdQuestProgress:<learnerId>` (localStorage).

### 4.2 Vault Markdown

경로:

```text
Learners/<learnerId>/Gaps/<gapId>.md
```

frontmatter 최소:

```yaml
---
type: gap-note
id: gap_e002_20260731_xxxx
vaultPath: Learners/me/Gaps/gap_e002_20260731_xxxx.md
learnerId: me
expressionId: e002
mode: koen
createdAt: 2026-07-31T00:00:00Z
updatedAt: 2026-07-31T00:00:00Z
status: open
source: webapp
---
```

본문 절:

1. 내 추측  
2. 실제 의미 / 정답  
3. 놓친 단서  
4. 모델 업데이트  
5. 연결 (동사 wikilink · 표현 ID)

### 4.3 병합 규칙

| 대상 | 우선 |
| --- | --- |
| XP · successes · attempts | **앱** |
| Gap 본문(`missedClue`, `modelUpdate`, …) | `updatedAt` 최신 · 동률이면 **Vault** |
| 앱에서 보관 | Vault 파일 유지, `status: archived`만 갱신 |
| Vault에서 open 삭제 | 앱에 `missingInVault`, **재생성하지 않음** |

---

## 5. UX 흐름 (화면별)

### 5.1 홈 시드 영작

```text
타이핑 확인
  ├─ correct  → 성공 · open gap 있으면 reviewed · 아래 확장 메뉴만
  ├─ almost   → 철자 피드백만 (성공 화면 X)
  └─ retry    → 오답 피드백 + 「스스로 찾아 간극에 남기세요」+ 간극 버튼
                 → openGapNoteForm(feedbackHint)
```

### 5.2 간극 폼

1. 코칭 문구 (AI 금지 · 자기 단서)  
2. 내 추측 (편집 가능)  
3. **놓친 단서 (필수)** / 다음에 이렇게 생각하기  
4. 「정답 확인」— 단서 없으면 차단  
5. 저장 → toast + `Learners/.../Gaps/...` 경로 표시 → (설정 시) auto sync  

### 5.3 힌트

`itemHintList(item)`:

1. 열린 간극의 `missedClue` / `modelUpdate` → `내 간극 힌트 · …` (최대 2)  
2. 표현 정적 `hint` / `hints`  
3. 없으면 frame · chunks · 모음 가림 폴백  

총 3단.

### 5.4 성장 화면

- 목록: status · 추측 · 놓친 단서 · 다음에  
- **메움** → `reviewed` + sync  
- **보관** → `archived` + sync  
- **Draft로** → `Library/Drafts` 후보 (의도적 승격만)  
- **다시 연결** → 가능하면 gap.mode (`koen`/`speak`/`listen`)로 연습  

### 5.5 Next Practice

우선순위(현행):

1. Vault Next Practice 큐 (있으면)  
2. open gaps (≤5)  
3. watchlist / Brain weakSlots / 약한 연결  

G3에서 큐 순회 세션으로 확장한다.

---

## 6. 구현 맵 (파일 · 함수)

| 관심사 | 파일 | 함수 / 심볼 |
| --- | --- | --- |
| 스키마 | `src/domain/progress-store.js` | `normalizeGapNote`, `defaultProgress.gapNotes` |
| ID/경로/MD | `src/domain/markdown-projection.js` | `makeGapId`, `gapVaultPath`, `projectGapNote`, `buildExportFiles` |
| Sync | `src/domain/obsidian-sync.js` | `parseGapNoteMarkdown`, `mergeGapNotes`, `importGapsAndNextPractice`, `upsertFiles` |
| 큐 | `src/domain/next-practice.js` | `buildQueue` (호출부는 `index.html`) |
| UI 오케스트레이션 | `index.html` | `openGapNoteForm`, `upsertGapNote`, `archiveGapNote`, `markOpenGapsReviewed`, `learnerGapHintsForExpression`, `itemHintList`, `renderGapNotesList`, `recordPracticeEvent`, `maybeAutoSyncAfterGap` |
| 테스트 | `scripts/tests/test_gap_note_status.js`, `test_obsidian_sync.js`, `test_markdown_projection.js`, `test_next_practice.js` |

---

## 7. 단계별 구현 계획

### Phase A — 자기메우기 코어 ✅ (v1.3.52)

**목표:** 노이즈 제거 + 단서 필수 + 힌트 회수 + reviewed.

| 작업 | 방법 |
| --- | --- |
| A1 자동 gap/Draft 제거 | `recordPracticeEvent`에서 retry 시 `upsertGapNote`/`createDraftFromGap` 호출 삭제. `practiceEvents`만 유지. |
| A2 폼 재설계 | `openGapNoteForm`: 정답 입력 숨김 → `#gapRevealAnswer`로 조건부 공개. 저장 시 `missedClue\|\|modelUpdate` 필수. |
| A3 개인 힌트 | `learnerGapHintsForExpression` + `itemHintList` 앞에 prepend. |
| A4 메움 | 정답 경로에서 `markOpenGapsReviewed(expressionId)`. 목록에 「메움」버튼. |
| A5 경로/sync | UI에 `gapVaultPathForUi`. `archiveGapNote` 후 `maybeAutoSyncAfterGap`. |
| A6 스키마 | `normalizeGapNote` status ∈ `{open,reviewed,archived}`. |

**완료 조건:** 빈 단서로 저장 불가 · 힌트에 내 간극 표시 · 재성공 시 reviewed · validate/unit pass.

---

### Phase B — 회수 면 확장 (다음)

**목표:** 간극이 생긴 모든 연습 면에서 같은 루프.

| ID | 작업 | 구현 방법 |
| --- | --- | --- |
| B1 / G2 | 듣기·말하기 실패 CTA | `renderSpeechResult` / simple-speak 실패 분기에 `gapFormMount` + `openGapNoteForm` 연결. 정답 EN 숨김 유지. |
| B2 / G5 | 홈 넛지 | `updateQuestUI`에 `getOpenGapNotes().length` 표시. 클릭 시 성장 탭 또는 해당 표현 시드. |
| B3 / G6 | 피드백 → 단서 초안 | 이미 `feedbackHint`로 전달 중. 문구를 “초안일 뿐, 고쳐 쓰세요”로 명확화. classifier 메시지를 자동 저장하지 말 것. |

**완료 조건:** speak/listen 실패에서도 동일 폼 · 홈에서 열린 간극 인지 가능.

---

### Phase C — Next Practice 세션 (G3)

**목표:** 열린 간극을 한 세션으로 순회.

| 단계 | 구현 방법 |
| --- | --- |
| C1 세션 상태 | `appState.gapPracticeSession = { queue: expressionIds[], index }` |
| C2 시작 | 성장 「Next Practice 시작」이 큐 전체를 넣고 첫 항목 `startMode('koen', id)` |
| C3 진행 | 정답/`reviewed` 후 `index++`. 끝나면 성장으로 복귀 + toast |
| C4 모드 | gap.mode 우선 (`koen` 기본). matrix gap은 추후 formId 연결 |
| C5 unlock 필터 | `buildQueue`의 local gap/brain 항목도 `filterUnlocked` 통과 |

**완료 조건:** 열린 간극 3개면 3문항 연속 연습 후 종료 화면.

---

### Phase D — Vault 정원 품질

| ID | 작업 | 구현 방법 |
| --- | --- | --- |
| D1 / G4 | vault-only 표시 | import 파서/`renderGapNotesList`에서 bank `find`로 `english`/`ko` 보강. MD 제목 `# Gap · …` 파싱 폴백. |
| D2 | 빈 단서 Vault 분석 | `vault-md-analyze.js` 경고를 성장 UI에 “단서 비어 있음 N”으로 노출. |
| D3 | Draft는 의도적만 | 자동 promote 금지 유지. 「Draft로」만 Library 후보 생성. |
| D4 / G7 | 문서 | `DATA_MODEL.md`에 §gapNotes 추가. 이 계획서 링크. |

---

### Phase E — 관측·회귀 (상시)

| 작업 | 방법 |
| --- | --- |
| E1 단위 테스트 | status 정규화 · mergeGapNotes · hint prepend(가능하면 domain 추출) |
| E2 브라우저 스모크 | `scripts/smoke_browser_sync_next_practice.js`에 open→reviewed 시나리오 추가 |
| E3 카피 회귀 | “자동 기록:” / 잘못된 `Gaps/<id>.md`(learner 누락) 문자열 grep CI |

---

## 8. 구현 시 체크리스트 (PR마다)

- [ ] 틀린 직후 **빈 gap/Draft 자동 생성**이 다시 들어오지 않았는가  
- [ ] 오답 UI가 **정답 EN을 선공개**하지 않는가 (단서 전)  
- [ ] 저장에 **놓친 단서 또는 modelUpdate**가 필요한가  
- [ ] 저장 후 같은 표현 힌트에 **내 간극 힌트**가 붙는가  
- [ ] 재성공/`메움` 시 status=`reviewed` + sync 시도하는가  
- [ ] UI 경로가 `Learners/<id>/Gaps/...`인가  
- [ ] `python3 scripts/validate.py` · 관련 `node scripts/tests/...` pass  
- [ ] `BACKLOG.md` G* 상태 갱신 · 필요 시 이 문서 Phase 체크  

---

## 9. 비목표 (Out of scope)

- 서버 로그인·클라우드 SoT (localStorage + 선택 Local REST)  
- 외부 LLM이 간극 본문을 자동 작성  
- Gap이 곧장 `expressions.json` Canon에 자동 머지 (수동/스크립트 SoT 유지)  
- 폰↔Mac 자동 병합 (Mac `local-rest`가 SoT)

---

## 10. 성공 지표 (제품)

| 지표 | 건강한 신호 |
| --- | --- |
| open gap 중 `missedClue` 비어 있음 비율 | 낮음 (폼 필수 덕분) |
| open → reviewed 전환 | 연습 후 증가 |
| 자동 생성된 “자동 기록:” gap | **0** (회귀 금지) |
| Next Practice에서 open-gap 선택 후 재성공 | 측정 가능하면 practiceEvents로 |

---

## 11. 참고 링크

- 동기화 계약: [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md)  
- Vault 진화: [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md)  
- 백로그 G1–G4: [`BACKLOG.md`](./BACKLOG.md)  
- 압축 기억: [`AGENT_MEMORY.md`](./AGENT_MEMORY.md)  
- 라이브 캐시 버스트: `https://plan153.github.io/english-thinking-dictionary-quest/fresh.html`
