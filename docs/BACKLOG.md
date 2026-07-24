# 미구현·보류 백로그 (잊지 말 것)

> SoT: 이 문서.  
> 기준 tip: **v1.3.1** (모바일 UX). 이전: v1.3.0 P2 · v1.2.2 F6.  
> 에이전트/사람: 새 기능을 시작할 때 **이 목록을 먼저 읽고** 체크하거나 이어서 구현한다.

## P0 — 사용자 기기(PC/Mac) · **다음에 진행 (보류)**

> **2026-07-23 사용자 지시:** D1·D2는 지금은 건너뛰고 **나중에** 진행.

| ID | 항목 | 현재 상태 | 나중에 할 일 |
| --- | --- | --- | --- |
| D1 | **실제 Obsidian day loop** | **보류·다음에** · 러너 준비됨 | Mac에서 `run_day_loop_pc.js` |
| D2 | **Vault pathPrefix / 폴더 실측** | **보류·다음에** | D1과 함께 |

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
| O1–O3 | superseded PR / 데일리 카피 / Pages 캐시 | **완료** |
| O4 | **모바일 UX 다듬기** (iPhone/Safari) | **완료 v1.3.1** — safe-area, 하단 탭, 터치 44px, 레슨 탭 숨김, 빌드맵 복구 |
| O5 | **퀴즈 UX 복원** | **완료 v1.3.1** — 레슨에서 표현 연결도 제거 · 음성 답변 기본 / 타이핑 선택 |

## 구현 시 규칙 (갱신)

1. 퀴즈 은행 = ASS + (ON이면) Canon 런타임 + (ON이면) 해금 구동사.
2. Canon 저장소 파일 SoT(`data/expressions.json`)는 스크립트 머지 + validate 후 커밋.
3. Sync: 로컬 progress 먼저. Vault Progress는 max 병합. 비밀값은 localStorage만 (**절대 커밋 금지**).
4. 개인 vault `Learners/<id>/…`, 공유 `Library/`.
5. 구동사 매트릭스 성공은 VerbMatrixGate에 쓰지 않음.

## 다음 작업 추천 순서

1. **D1 → D2** — 보류·다음에 (PC)
2. P2 토글을 끄고 쓰려면 성장 화면 정책 체크박스

변경할 때마다 이 표의 Status를 갱신한다.
