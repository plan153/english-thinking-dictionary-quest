# Agent Memory (압축 스냅샷)

> 세션 간 이어갈 때 **이 문서 + [`BACKLOG.md`](./BACKLOG.md)** 먼저 읽기.  
> 기준 tip: **v1.3.15** · 갱신: 2026-07-24

## 제품 한 줄
한국어 학습자용 **ASS + Obsidian 제2영어뇌** 웹앱. 퀴즈 SoT=`expressions.json`. 비밀값은 localStorage only.

## 라이브
- Pages: `https://plan153.github.io/english-thinking-dictionary-quest/`
- 캐시 의심 시: **`fresh.html`** (버전 강제)

## IA (현재)
메인 탭: **오늘 · 게임 · 그래프 · 동사 · 구동사 · 성장**
- **그래프** = Obsidian vault Graph (`#/vaultGraph` → Local REST `graph:open`)
- **문장빌드맵** = `#/map` / 사전 빌드 탭
- 홈 = 확장 선택 (듣기/따라하기/이어묻기/이어답하기/이어말하기/화제전환)
- **영작 연습(v1.3.13)**: KO 문장 기본 · 듣기=KO TTS · 영어로 말하기+힌트 · 타이핑 확인 · 정답 시 EN 듣기+확장 선택 · 정오답 `practiceEvents`+gap → 볼트 quiet sync

## 최근 확정
| Ver | 핵심 |
| --- | --- |
| 1.3.9 | 듣기·말하기 4버튼 |
| 1.3.10 | 이어묻기·이어답하기 Q/A |
| 1.3.11 | 매트릭스 자동 생성 |
| 1.3.12 | Safari 듣기·말하기 회귀 수정 |
| 1.3.13 | 영작 UX (KO 기본 / KO TTS / 힌트 / 정답 후 확장 / 볼트 기록) |
| 1.3.14 | be 동사 `be + -ing` 가까운·확정 미래 패턴 + 구어 예문 5 |
| 1.3.15 | be 생활 구어 표현 50 + place/phrase 패턴 |

## 불변 규칙
1. 퀴즈 은행 = ASS + (정책 ON) Canon 런타임 + (정책 ON) 해금 구동사
2. Canon 파일 SoT는 `merge_canon_intake.js` + validate 후 커밋
3. 구동사 매트릭스 ≠ VerbMatrixGate
4. Cloud 에이전트는 Obsidian Local REST(Mac)에 도달 불가
5. **D1·D2(실제 day loop / vault path 실측) = 보류** — 사용자 지시 전까지 열지 않음  
   - Mac Mini vault: `~/Obsidian Vault/Project_English` · pathPrefix **비움** · 절차: `DAY_LOOP.md`
6. 브랜치: `cursor/<name>-80e0` · base=`main` · PR는 ManagePullRequest

## 주요 파일
- `index.html` — UI·플로우 대부분
- `src/domain/obsidian-sync.js` — Graph open / Local REST
- `src/domain/progress-store.js` — dailyQuestV1 v6
- `docs/BACKLOG.md` — 미구현·보류 SoT
- `scripts/validate.py` / `bump_version.py` — 버전·`fresh.html`·SW 동기

## 다음 작업 시
1. `BACKLOG.md` P0(D1/D2) 건드리지 말 것 (명시 요청 전)
2. 듣기 UI 옛 스크린샷(`0/3`) = 캐시 → `fresh.html`
3. 버전 올릴 때 `index.html` + VERSION + fresh + SW + package + version.json **함께**
4. **듣기/말하기 수정 시:** `recognition.start()`는 클릭 핸들러에서 동기 호출 (await getUserMedia 금지). TTS는 cancel 후 짧은 재시도.
