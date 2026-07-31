# Agent Memory (압축 스냅샷)

> 세션 간 이어갈 때 **이 문서 + [`BACKLOG.md`](./BACKLOG.md)** 먼저 읽기.  
> 기준 tip: **v1.3.52+** · 갱신: 2026-07-31

## 이어서 (토큰 절약용 · 2026-07-31)

### 간극(Gap) 제품 원칙
- **계획서 SoT:** [`GAP_LOOP_PLAN.md`](./GAP_LOOP_PLAN.md) (구현 방법 · Phase A–E)
- **목표:** Obsidian Gaps와 연동해 간극을 메운다. AI에 그때그때 묻지 않고, **스스로 어디가 다른지 찾아 적기**.
- **루프:** 틀림 → 힌트/단서 자기 발견 → 간극에 `missedClue`/`modelUpdate` 저장 → 다음 연습에 **내 간극 힌트** → 다시 맞춤 → `reviewed` → Vault sync
- **금지(현행):** 틀린 즉시 빈 간극·Draft 자동 생성 (노이즈). 정답 선공개 후 간극 폼.
- **경로:** `Learners/<id>/Gaps/<gapId>.md` (pathPrefix 비움 전제)

- **Vault CONTRACT PASS** — 루트=`Project_English` 자체. 구조: `Library/` · `Learners/me/` · `MOC/` · `_Archive/reorg-20260726/`
- **pathPrefix = 비움** (필수). `Project_English` 넣으면 `Project_English/Project_English/` 중첩 재발.
- Library 추가 허용: `Expressions/` `Prepositions/` `Verb Maps/` (계약 확장, overlay 읽기 가능)
- 입구: `Library/Index` · `Learners/me/English Brain Index` · `MOC/English Vault`
- 폰 sync 본선 아님. Mac=`local-rest`. 시드/분석: `docs/VAULT_ENGLISH_BRAIN.md`
- 학습자: 로그인 없음 · `etdLearnerProfiles` + `etdQuestProgress:<id>` · Vault `Learners/<id>/`

## 제품 한 줄
한국어 학습자용 **ASS + Obsidian 제2영어뇌** 웹앱. 퀴즈 SoT=`expressions.json`. 비밀값은 localStorage only.

## 라이브
- Pages: `https://plan153.github.io/english-thinking-dictionary-quest/`
- 캐시 의심 시: **`fresh.html`** (버전 강제)
- **사용자 요청:** 업데이트/배포 안내 때 항상 fresh URL을 함께 알린다  
  → `https://plan153.github.io/english-thinking-dictionary-quest/fresh.html`

## IA (현재)
메인 탭: **오늘 · 게임 · 그래프 · 동사 · 구동사 · 성장**
- **그래프** = Obsidian vault Graph (`#/vaultGraph` → Local REST `graph:open`)
- **문장빌드맵** = `#/map` / 사전 빌드 탭
- 홈 = 확장 선택+인라인 연습 (시드 카드: 한영 토글·듣기·따라말하기 / 아래: 의문문으로·평서문으로·이어말하기·화제전환 → 같은 화면에서 말하기)
- **영작 연습:** KO 문장 기본 · 힌트 · 타이핑 · 정답 시 확장 · 간극은 **수동 자기기록** 후 볼트 sync

## 최근 확정
| Ver | 핵심 |
| --- | --- |
| 1.3.52 | 간극 자기메우기 루프 · 자동 gap/Draft 중단 · 간극→힌트 · reviewed |
| 1.3.51 | 홈 정답 후 확장 메뉴 중복 제거 |
| 1.3.50 | 힌트 복구 · 오답/평서문 안내 중복 정리 |
| 1.3.49 | 거의맞음 위·아래 중복 피드백 제거 |
| 1.3.9 | 듣기·말하기 4버튼 |
| 1.3.10 | 이어묻기·이어답하기 Q/A |
| 1.3.11 | 매트릭스 자동 생성 |
| 1.3.12 | Safari 듣기·말하기 회귀 수정 |
| 1.3.13 | 영작 UX (KO 기본 / KO TTS / 힌트 / 정답 후 확장 / 볼트 기록) |
| 1.3.14 | be 동사 `be + -ing` 가까운·확정 미래 패턴 + 구어 예문 5 |
| 1.3.15 | be 생활 구어 표현 50 + place/phrase 패턴 |
| 1.3.16 | be 표현 직역·실제의미·사용시점(usage/nuance) + 상세 UI |
| 1.3.17 | verb_pack_be에 be 표현 59개 ASS 합류 |
| 1.3.18 | 스타터 동사에 be·get·take·want·need·do·feel 해금 |
| 1.3.19 | 사전 로딩 실패 수정(SW JSON precache 제거·cache-bust·에러 표시) |
| 1.3.20 | 이어묻기 be/관용 매트릭스 생성 수정 (Does it is… 제거) |
| 1.3.21 | 이어묻기: generated 매트릭스 런타임 재생성(캐시 잔존 방지) |
| 1.3.22 | 힌트 N/3 박스·버튼 동기화 · 표현 연결도 UI 전면 제거(결과/맵/사전) |
| 1.3.23 | 평서→이어묻기 / 의문→이어답하기 필터 · 연속 이어묻기 튕김 방지 · 힌트 라벨 동기 강화 |
| 1.3.24 | 복습 화면 타이핑으로 답하기 클릭 불가 수정(모바일 sticky 겹침) |
| 1.3.25 | v1.3.24 버전 마커 정합 + 동일 수정 배포 |
| 1.3.26 | 파인만 설명 챌린지 UI/진입점 제거 (모드 종료) |
| 1.3.27 | 홈 듣기 즉시 재생 · UI 통일 · 평서↔의문 동적 버튼 · 이어말하기=연결 문장 |
| 1.3.28 | v1.3.27 버전 마커 정합 + 동일 배포 |
| 1.3.29 | 스타터 동사(get/have/be/take/feel…) 표현·맵 예문 바로 연습 가능 |
| 1.3.30 | 시드 카드: 한영 토글(우상단) · 듣기 아래 따라말하기 · 원문 형태 판정 수정 |
| 1.3.31 | 평서/의문·이어말하기·따라말하기를 홈 시드 화면 인라인 연습으로 통합 (레슨 화면 이동 없음) |
| 1.3.32 | 모든 화면 프롬프트 기본=한국어·영작하기 (시드/인라인/레슨) |
| 1.3.33 | 영작 전 영어 숨김 · she/he 의문문 생성 수정 · 오답 안내 명확화 · 주제/명사 연결 강화 |
| 1.3.34 | 이어말하기/화제전환: Obsidian 볼트 연결 강도 1순위 (주제/명사는 폴백) |
| 1.3.35 | 볼트 브리지 수정 · 홈 듣기→recognition · Gap→Draft 자동 · active 매치 자동연결 · sync 기본 ON |
| 1.3.36 | 약한 연결 축 강제 회수 · output=0 우선 · Next Practice 구체 모드(speak/listen/koen) · 홈 시드 회수 안내 |
| 1.3.37 | 한→영 contrast(기본동사+명사) · 홈/영작/상세/오답/맵에 조립 안내 · expression-contrast.js |
| 1.3.38 | 구현된 표현·동사·구동사 해금 제한 해제 (`policyOpenImplementedBank` 기본 ON) |
| 1.3.39 | 엔진+명사 **assemble** 모드 · assembly축 Next Practice=`assemble` · D1/D2 Mac 닫기 준비 |

## 불변 규칙
1. 퀴즈 은행 = ASS + (정책 ON) Canon 런타임 + (정책 ON) 해금 구동사
2. Canon 파일 SoT는 `merge_canon_intake.js` + validate 후 커밋
3. 구동사 매트릭스 ≠ VerbMatrixGate
4. Cloud 에이전트는 Obsidian Local REST(Mac)에 도달 불가
5. **D1·D2 완료** · Local REST HTTP `27123`. **현재 Mac: pathPrefix 비움** (vault 루트=`Project_English`).  
   - 예전 상위-vault 레이아웃일 때만 prefix=`Project_English` · 절차: `DAY_LOOP.md`
6. 브랜치: `cursor/<name>-80e0` · base=`main` · PR는 ManagePullRequest

## 주요 파일
- `index.html` — UI·플로우 대부분
- `src/domain/obsidian-sync.js` — Graph open / Local REST
- `src/domain/progress-store.js` — dailyQuestV1 v6
- `docs/BACKLOG.md` — 미구현·보류 SoT
- `scripts/validate.py` / `bump_version.py` — 버전·`fresh.html`·SW 동기

## Vault 영어뇌 시드
- 레포: `vault/Project_English/` · SoT: `docs/VAULT_ENGLISH_BRAIN.md`
- Mac: `OBSIDIAN_PATH_PREFIX=` (비움) + `seed_vault_english_brain.js` → `analyze_vault_md.js`

## 다음 작업 시
1. 캐시 의심 → `fresh.html`
2. 버전 bump 시 index+VERSION+fresh+SW+package+version.json 함께
3. 듣기/말하기: `recognition.start()`는 클릭에서 동기 호출
4. **pathPrefix 비움 유지** (중첩 금지)
