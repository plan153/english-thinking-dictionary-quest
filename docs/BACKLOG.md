# 미구현·보류 백로그 (잊지 말 것)

> SoT: 이 문서.  
> 기준 tip: **v1.3.9** (듣기·말하기 UI 단순화). 이전: v1.3.8 누적 횟수.  
> 에이전트/사람: 새 기능을 시작할 때 **이 목록을 먼저 읽고** 체크하거나 이어서 구현한다.  
> 세션 압축 기억: [`AGENT_MEMORY.md`](./AGENT_MEMORY.md)

## P0 — 사용자 기기(PC/Mac) · **다음에 진행 (보류)**

> **2026-07-23 사용자 지시:** D1·D2는 지금은 건너뛰고 **나중에** 진행.  
> **Vault 확정 (Mac Mini):** `~/Obsidian Vault/Project_English` · 앱 Path prefix **비움**  
> (`mini`는 컴퓨터 이름 — 폴더 경로에 넣지 않음.) · 절차 SoT: [`DAY_LOOP.md`](./DAY_LOOP.md)

| ID | 항목 | 현재 상태 | 나중에 할 일 |
| --- | --- | --- | --- |
| D1 | **실제 Obsidian day loop** | **보류·다음에** · 러너 준비됨 | Mac에서 Local REST 켠 뒤 `OBSIDIAN_API_KEY=… node scripts/run_day_loop_pc.js` |
| D2 | **Vault pathPrefix / 폴더 실측** | **보류·다음에** (D1과 함께) | pathPrefix **비움** 확인 + 폴더 계약 검사 PASS |

## P1 — 제품 기능 (앱 코드)

| ID | 항목 | 현재 상태 |
| --- | --- | --- |
| F1–F6 | 구동사·IA·숙달·Draft·explain·구동사 매트릭스 | **완료** (v1.1.8–v1.2.2) |

## P2 — 정책 해제 후 구현 (v1.3.0)

> **2026-07-23 사용자 지시:** 금지 풀고 4항목 모두 진행.

| ID | 항목 | 현재 상태 | 사용법 |
| --- | --- | --- | --- |
| P2a | Canon → 퀴즈 은행 합류 | **완료 v1.3.0** — 런타임 `canonExpressions` + 대기열 합류. 저장소 SoT는 `scripts/merge_canon_intake.js` | 성장 화면 정책 체크 `policyCanonAutoMerge` |
| P2b | Progress / Explanations Vault→앱 | **완료 v1.3.0** — import 시 Progress max 병합 + Explanations upsert | `policyImportProgressFromVault` / `policyImportExplanationsFromVault` |
| P2c | Google OAuth / Drive 비밀 | **완료 v1.3.0** — adapter `drive-oauth` (Client ID + Access Token은 **localStorage only**, 커밋 금지) | 성장 → drive-oauth |
| P2d | 구동사 → `getUnlockedBank()` | **완료 v1.3.0** — 해금된 구동사 합류 (토글) | `policyPhrasalInAssBank` |

기본값은 모두 **ON**. 끌 수 있음.

## P3 — 문서·운영

| ID | 항목 | 현재 상태 |
| --- | --- | --- |
| O1–O3 | superseded PR / 데일리 카피 / Pages 캐시 | **완료** · O3 강화: `fresh.html` + HTML no-store SW (v1.3.2) |
| O4 | **모바일 UX 다듬기** (iPhone/Safari) | **완료 v1.3.1+** — safe-area, 하단 탭, 터치 44px, 레슨 탭 숨김, 빌드맵 복구 |
| O5 | **퀴즈·성장 UX 복원** | **완료 v1.3.1+** — 레슨·Next Practice·복습 목록에서 표현 연결도 제거 · 음성 기본/타이핑 선택 |
| O6 | **구어 확장 선택판** | **완료 v1.3.3** — 듣기/따라하기/이어묻기·답하기/이어말하기/화제전환을 **순서 없는 선택**으로. 오늘의 말은 클리어가 아니라 이어가기 동기 |
| O7 | **문장빌드맵/그래프 빈 화면** | **완료 v1.3.4** — get/want/need route 잔여 `selectedRouteId`가 일반 동사 빌드맵에서 무한 재귀를 내던 버그 수정 |
| O8 | **그래프 메인 메뉴** | **정정 v1.3.6** — `그래프` = **Obsidian 볼트 Graph view** (`#/vaultGraph` → Local REST `graph:open`). 문장빌드맵(`#/map`)은 훈련용·동사 카드 보조 진입 |
| O9 | **전체 검수** | **완료 v1.3.7** — 비데일리 `finishLesson` 확장판 강제 제거 · `questContext` 누수 정리 · 문서/README v6 정합 · package.json 버전 동기 |
| O10 | **말하기 누적 횟수** | **완료 v1.3.8** — 듣기/따라하기 등 `N/3 완료` 미션 게이트 제거 → **누적 학습 N회** 표시 · 더 말하기/다음 선택 |
| O11 | **듣기·말하기 UI 단순화** | **완료 v1.3.9** — 한영전환 / 듣기 / 말하기 / 정답보기 4버튼 |

## 구현 시 규칙 (갱신)

1. 퀴즈 은행 = ASS + (ON이면) Canon 런타임 + (ON이면) 해금 구동사.
2. Canon 저장소 파일 SoT(`data/expressions.json`)는 스크립트 머지 + validate 후 커밋.
3. Sync: 로컬 progress 먼저. Vault Progress는 max 병합. 비밀값은 localStorage만 (**절대 커밋 금지**).
4. 개인 vault `Learners/<id>/…`, 공유 `Library/`.
5. 구동사 매트릭스 성공은 VerbMatrixGate에 쓰지 않음.

## 다음 작업 추천 순서

1. **D1 → D2** — 보류·다음에 (Mac Mini · vault=`~/Obsidian Vault/Project_English` · pathPrefix 비움)
2. P2 토글을 끄고 쓰려면 성장 화면 정책 체크박스

변경할 때마다 이 표의 Status를 갱신한다.
