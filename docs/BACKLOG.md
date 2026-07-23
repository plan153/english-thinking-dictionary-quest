# 미구현·보류 백로그 (잊지 말 것)

> SoT: 이 문서. `DEVELOPMENT_PLAN.md`의 “다음에 구현”이 요약이고, 여기는 **아직 못 한/일부만 한** 항목을 빠짐없이 남긴다.  
> 기준 tip: **v1.1.9** (구동사 F1). 이전: v1.1.8 IA F2 · v1.1.7 구동사 메뉴.  
> 에이전트/사람: 새 기능을 시작할 때 **이 목록을 먼저 읽고** 체크하거나 이어서 구현한다.

## P0 — 사용자 기기에서만 완성 가능 (앱 코드는 준비됨)

| ID | 항목 | 현재 상태 | 나중에 할 일 | 의존 |
| --- | --- | --- | --- | --- |
| D1 | **실제 Obsidian day loop** | 앱: sync UI·체크리스트·실패 큐. CI: mock Local REST smoke만 | 사용자 Mac에서 Local REST(`127.0.0.1:27123`) + API key + `Learners/<id>/` 경로로 **실 Vault** 한 바퀴 검증. `Project_English` pathPrefix 확인 | Obsidian + Local REST 플러그인, vault 접근 |
| D2 | **Vault pathPrefix / 폴더 실측** | 계약 문서만 SoT | 실제 vault 트리와 `OBSIDIAN_VAULT_EVOLUTION.md`가 맞는지 대조 후 어긋나면 문서·기본값 수정 | D1 |

절차 참고: [`DAY_LOOP.md`](./DAY_LOOP.md)

## P1 — 제품 기능으로 아직 얕거나 빠진 것

| ID | 항목 | 현재 상태 | 나중에 할 일 | 비고 |
| --- | --- | --- | --- | --- |
| F1 | **구동사 심화** | **완료 v1.1.9** — 4단계 순차 해금(get장소→come/go→put→keep/find/make) · 입자 드릴 · 잠금 사유 UX. 하루 루프/ASS 비합류 유지 | — | [`PHRASAL_VERBS.md`](./PHRASAL_VERBS.md) |
| F2 | **IA 2차 정리** | **완료 v1.1.8** — 홈은 하루 루프만(범위/더연습은 `<details>`). 레슨 exit은 퀘스트→홈 / 구동사→구동사 / Next Practice·복습→성장 / 맵·사전→각각 / 기본→게임모드 | — | 디자인 감사 잔여 |
| F3 | **데일리·숙달 신호 추가 다듬기** | daily v4 + 내 표현 output touch | “내 표현” OR 경로가 여전히 느슨하면 output **성공**(strength)만 인정으로 강화. 데일리 step-7 speak가 약한 연결 우선 선택이 되는지 점검 | 교육 감사 잔여 |
| F4 | **Gap → Draft 품질** | Gap→Draft→Canon 흐름 있음 | Draft가 메모 창고로만 쌓이지 않게: 승격 체크리스트 강화, 오래된 draft 정리 UX, Canon 대기열 리뷰 화면 개선 | 정원 정책 |
| F5 | **그래프 explain 바로가기** | listen/speak/koen/matrix만 맵에서 바로가기 | 맵/표현 상세에서 `explain`(파인만) 바로가기 옵션 | Phase 5 잔여 |

## P2 — 의도적으로 안 한 것 (자동 구현 금지 / 정책)

| ID | 항목 | 이유 | 예외적으로 할 때 |
| --- | --- | --- | --- |
| P2a | Canon → `expressions.json` **자동** 병합 | 퀴즈 SoT 오염 방지. 리뷰 후 수동 | 별도 PR + validate + 사람 승인 |
| P2b | Progress.md / Explanations Vault→앱 **완전** 역동기화 | 진행 숫자는 앱 SoT | weakSlots 소프트 힌트 이상은 설계 변경 필요 |
| P2c | 정적 앱에 Google OAuth / 서버 비밀 | 보안 | Drive webhook 백업 POST만 유지 |
| P2d | 구동사 표현을 `getUnlockedBank()`에 자동 합류 | ASS/구동사 분리 불변 | 절대 기본 동작으로 넣지 말 것 |

## P3 — 문서·운영 잔여

| ID | 항목 | 할 일 |
| --- | --- | --- |
| O1 | GitHub superseded draft PR(#3,#8–#18) | 사람이 GitHub에서 닫기 (코드 작업 아님) |
| O2 | C2 데일리 카피 체크리스트 | DEVELOPMENT_PLAN C2에 “장면×2” 등 구식 문구 → daily v4 문구로 문서만 갱신 |
| O3 | Pages 캐시 | 배포 후 iPhone/Chrome이 옛 UI면 SW·사이트 데이터 삭제 안내 |

## 구현 시 불변 규칙 (다시 적음)

1. 퀴즈 은행 = `getUnlockedBank()` / ASS만. Vault·overlay·watchlist·Canon·구동사 메뉴 ≠ 자동 합류.
2. Draft ≠ 퀴즈. Canon ≠ 자동 JSON 병합.
3. Sync: 로컬 progress 먼저. 실패 큐. 비밀값은 localStorage만.
4. 개인 vault `Learners/<id>/…`, 공유 `Library/`.
5. 레벨업: 표현 팩 70% **와** 동사 4형태 순차 게이트는 별개. 동사 순서는 have→get→take→나머지→give…

## 다음 작업 추천 순서

1. **D1** 사용자와 실 Obsidian day loop 검증 (막히면 로그·adapter 설정만 수정)
2. ~~**F1** 구동사 심화~~ **완료 v1.1.9**
3. ~~**F2** IA 2차~~ **완료 v1.1.8**
4. **F3–F5** 숙달/Draft/explain 다듬기
5. P2 항목은 요청 없이 구현하지 않음

변경할 때마다 이 표의 해당 행을 `[x]` 하거나 “완료: vX.Y.Z / PR#”를 Status에 적어 둔다.
