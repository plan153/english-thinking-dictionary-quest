# 미구현·보류 백로그 (잊지 말 것)

> SoT: 이 문서. `DEVELOPMENT_PLAN.md`의 “다음에 구현”이 요약이고, 여기는 **아직 못 한/일부만 한** 항목을 빠짐없이 남긴다.  
> 기준 tip: **v1.2.1** (PC day-loop ops). 이전: v1.2.0 F3–F5 · v1.1.9 구동사 F1.  
> 에이전트/사람: 새 기능을 시작할 때 **이 목록을 먼저 읽고** 체크하거나 이어서 구현한다.

## P0 — 사용자 기기(PC/Mac)에서만 최종 완료

| ID | 항목 | 현재 상태 | 나중에 할 일 | 의존 |
| --- | --- | --- | --- | --- |
| D1 | **실제 Obsidian day loop** | 앱·mock smoke·**Vault 폴더 검사 버튼**·`scripts/verify_local_vault.js` 준비됨 (v1.2.1). 실 vault 한 바퀴는 미실행 | PC에서 Local REST + API key로 [`DAY_LOOP.md`](./DAY_LOOP.md) 체크리스트 통과 후 이 행을 완료로 표시 | Obsidian + Local REST, vault 접근 |
| D2 | **Vault pathPrefix / 폴더 실측** | 계약 SoT + 검사 API/스크립트가 empty↔`Project_English` 후보 시도 | PC에서 검사 PASS한 pathPrefix를 앱에 저장. 어긋나면 폴더 생성 또는 문서 수정 | D1과 같은 세션 |

> 클라우드 에이전트는 `127.0.0.1:27123` / 사용자 Mac vault에 **접근 불가**. D1·D2는 PC 실행 전까지 “도구 준비됨 / 실측 미완”으로 둔다.

## P1 — 제품 기능 (앱 코드)

| ID | 항목 | 현재 상태 | 나중에 할 일 | 비고 |
| --- | --- | --- | --- | --- |
| F1 | **구동사 심화** | **완료 v1.1.9** | — | [`PHRASAL_VERBS.md`](./PHRASAL_VERBS.md) |
| F2 | **IA 2차 정리** | **완료 v1.1.8** | — | — |
| F3 | **데일리·숙달 신호** | **완료 v1.2.0** | — | daily v5 |
| F4 | **Gap → Draft 품질** | **완료 v1.2.0** | — | — |
| F5 | **그래프 explain 바로가기** | **완료 v1.2.0** | — | — |

## P2 — 의도적으로 안 한 것 (자동 구현 금지 / 정책)

| ID | 항목 | 이유 | 예외적으로 할 때 |
| --- | --- | --- | --- |
| P2a | Canon → `expressions.json` **자동** 병합 | 퀴즈 SoT 오염 방지. 리뷰 후 수동 | 별도 PR + validate + 사람 승인 |
| P2b | Progress.md / Explanations Vault→앱 **완전** 역동기화 | 진행 숫자는 앱 SoT | weakSlots 소프트 힌트 이상은 설계 변경 필요 |
| P2c | 정적 앱에 Google OAuth / 서버 비밀 | 보안 | Drive webhook 백업 POST만 유지 |
| P2d | 구동사 표현을 `getUnlockedBank()`에 자동 합류 | ASS/구동사 분리 불변 | 절대 기본 동작으로 넣지 말 것 |

## P3 — 문서·운영 잔여

| ID | 항목 | 현재 상태 |
| --- | --- | --- |
| O1 | GitHub superseded draft PR(#3,#8–#18) | **완료** — 모두 CLOSED 확인 (2026-07-23) |
| O2 | C2 데일리 카피 (“장면×2” 폐기 → daily v5) | **완료 v1.2.1** — DEVELOPMENT_PLAN C2·카피 정리 |
| O3 | Pages 캐시 안내 | **완료 v1.2.1** — [`DAY_LOOP.md`](./DAY_LOOP.md) O3 + 성장 화면 안내 |

## 구현 시 불변 규칙 (다시 적음)

1. 퀴즈 은행 = `getUnlockedBank()` / ASS만. Vault·overlay·watchlist·Canon·구동사 메뉴 ≠ 자동 합류.
2. Draft ≠ 퀴즈. Canon ≠ 자동 JSON 병합.
3. Sync: 로컬 progress 먼저. 실패 큐. 비밀값은 localStorage만.
4. 개인 vault `Learners/<id>/…`, 공유 `Library/`.
5. 레벨업: 표현 팩 70% **와** 동사 4형태 순차 게이트는 별개. 동사 순서는 have→get→take→나머지→give…

## 다음 작업 추천 순서

1. **D1 → D2** — 사용자 PC에서 [`DAY_LOOP.md`](./DAY_LOOP.md) 순서대로 (연결 테스트 → Vault 폴더 검사 → 하루 루프)
2. P2 항목은 요청 없이 구현하지 않음

변경할 때마다 이 표의 해당 행 Status를 갱신한다.
