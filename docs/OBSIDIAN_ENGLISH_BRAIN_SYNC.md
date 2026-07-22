# Obsidian 영어뇌 양방향 동기화

## 목적

웹앱 학습 루프와 Obsidian Vault(`~/Obsidian Vault/Project_English` 또는 사용자가 지정한 경로)를 연결해, Vault가 **제2의 영어뇌 상태**를 갖게 한다.

```text
웹앱에서 배우고 틀림
    → local progress / gapNotes 저장
    → Obsidian Markdown upsert (Brain State, Gaps, Verbs, Nouns…)
    → Vault에서 연결·메모·약점 정리
    → 앱이 Brain State / Next Practice / Gaps를 읽어
      약한 부분 강화와 다음 연습 순서 결정
```

Drive·Git 백업은 이 루프의 본선이 아니다.

## 구현 상태

| 기능 | 상태 |
| --- | --- |
| localStorage 학습 기록 | 동작 |
| Gap Note / Markdown projection | 동작 (로컬 저장 + Markdown/JSON 다운로드) |
| Local REST API upsert (Gaps / Brain State / Progress / Library) | 동작 (설정·실패 큐 포함) |
| Vault → 앱 Gaps + Next Practice import | 동작 (Vault 본문/큐 우선 병합) |
| Google Apps Script Drive 웹훅 | 선택적 백업 경로(계획) |
| Obsidian Git / GHVault | 사용자 Vault 백업용 외부 도구 |

## Vault 폴더 계약

**폴더 SoT:** [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md). 이 절은 동기화 경로만 요약한다.

```text
Project_English/
  Learners/<learnerId>/          # 목표: 개인 영어뇌 (프로필 PR 이후)
    English Brain Index.md
    Learning/                    # Brain State, Next Practice, Progress…
    Gaps/<간극 ID>.md
  Library/                       # 공유 자료 정원
    Index.md
    Verbs/ Nouns/ Patterns/ Scenes/
    Drafts/ Canon/
  Reviews/                       # 선택
```

**과도기(현재 export):** 프로필 분리 전까지 개인 루프는 루트 `Learning/` · `Gaps/`에 쓴다. Library는 `Library/Drafts|Canon|Index`.  
레거시 루트 `Verbs/`·`Nouns/`·`Patterns/`가 있으면 overlay 시 `Library/`와 동일 ID로 병합하고, 신규 노트는 Library에만 만든다.

약점 흐름: **간극 → Library/Drafts → (승격) Canon → (리뷰 후) Unlock/JSON**. Next Practice는 연습 순서 큐다.

### `Learning/Brain State.md` (최소 frontmatter)

```yaml
---
type: brain-state
updatedAt: 2026-07-22T00:00:00Z
activeVerbIds: [v_have, v_get, v_want, v_need, v_go, v_come, v_make, v_take]
activeNounIds: [n_time, n_help, n_question]
activeExpressionCount: 48
masteredExpressionCount: 12
weakSlots:
  - expressionId: e002
    reason: output-low
  - patternId: p_have_thing
    reason: question-form
unlockReady: false
source: webapp
---
```

본문에는 Active set 요약, 약한 동사/패턴, 최근 간극 링크를 wikilink로 적는다.

### `Learning/Next Practice.md`

앱이 읽어서 오늘의 강화 순서를 정하는 파생 문서다.

```yaml
---
type: next-practice
updatedAt: 2026-07-22T00:00:00Z
queue:
  - { expressionId: e002, mode: speaking, reason: weak-output }
  - { expressionId: e010, mode: qa-matrix, reason: question-form }
source: webapp
---
```

Vault에서 사용자가 queue를 수동 수정하면 import 시 Vault 우선으로 병합한다(진행도 숫자 필드는 앱 우선).

### `Gaps/<id>.md`

```yaml
---
type: gap-note
id: gap_e002_20260722
expressionId: e002
createdAt: ...
updatedAt: ...
status: open   # open | reviewed | archived
---
```

본문: 내 추측 / 실제 의미 / 놓친 단서 / 모델 업데이트 / 관련 `[[Verbs/have]]` 링크.

## SyncAdapter 역할

정적 웹앱은 Vault 경로와 API 토큰을 소스에 넣지 않는다. 어댑터만 로컬에서 설정한다.

| adapter | 방향 | 용도 |
| --- | --- | --- |
| `download` | 앱 → 파일 | Markdown ZIP/개별 다운로드(항상 가능한 최소 경로) |
| `local-rest` | 양방향 | [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)로 upsert/read |
| `bridge` | 양방향 | Obsidian이 꺼져 있거나 REST 대신 쓸 로컬 브리지 |
| `drive-webhook` | 앱 → Drive | 백업/다른 기기 호환 |

권장 본선: **Local REST API**. 플러그인이 MCP 엔드포인트도 제공하므로 Cursor 등 에이전트가 Vault를 정리할 때 재사용할 수 있다.

## 외부 도구 활용

직접 재발명하지 말고 역할만 연결한다.

1. **Obsidian Local REST API (+ MCP)** — 웹앱/브리지의 CRUD 본선, 에이전트 도구 표면.
2. **kepano/obsidian-skills, Obsidian CLI skills** — 노트 쪼개기, wikilink, Index/MOC 정리. 학습 progress 원본을 바꾸지 않는다.
3. **Obsidian Git / GHVault** — Vault 파일의 GitHub 백업·기기 동기. 웹앱 퀴즈 루프와 분리한다.

## 동기화 규칙

1. 학습 중에는 항상 local progress를 먼저 저장한다.
2. 동기화는 비차단이다. 실패 시 큐에 넣고 나중에 재시도한다.
3. progress 숫자 필드(시도/성공/연결 강도)는 앱 우선 병합한다.
4. Gap 본문·Brain State 설명·수동 메모는 Vault 우선이다.
5. 동일 ID는 동일 경로만 사용한다. 파일명 추측으로 새 파일을 만들지 않는다.
6. Active set 밖 Vault 문서는 import해도 출제 은행에 넣지 않는다.

## 웹앱 UI 계약 (구현 시)

- `간극 기록 만들기` → local gapNotes 저장 → 설정 시 자동 sync 시도
- `Obsidian에 동기화` → Brain State / Progress / Gaps / Library Drafts·Canon upsert (`src/domain/obsidian-sync.js`)
- `Obsidian에서 가져오기` → Gaps + Next Practice 병합 (본문·큐는 Vault 우선, progress 숫자는 앱 유지)
- `Markdown 내보내기` → adapter 없이도 동작하는 fallback
- 설정: Base URL(기본 `http://127.0.0.1:27123`), API Key, path prefix, 자동 sync 토글 — **localStorage만**, 소스 커밋 금지
- CORS: Local REST 플러그인에서 앱 origin 허용. 브라우저 self-signed HTTPS(27124)보다 HTTP insecure(27123) 권장.

## 보안

- API 키·Vault 절대 경로는 브라우저 local settings 또는 로컬 브리지 설정에만 둔다.
- GitHub Pages에 배포되는 정적 파일에 비밀값을 커밋하지 않는다.
- REST는 localhost에서만 쓰고, 원격 공개 엔드포인트로 열지 않는다.

## 관련 문서

- 폴더·진화: [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md)
- overlay: [`OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`](./OBSIDIAN_VAULT_WORD_LINKING_PLAN.md)
- 정리 백로그: [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) Cleanup C0–C4

## 다음 구현 순서

1. gapNotes 스키마 + Markdown projection (순수 함수, 테스트 가능) — 완료
2. download adapter — 완료
3. local-rest adapter로 Gaps / Brain State upsert — 완료
4. import: Gaps + Next Practice — 완료
5. 실패 큐 / 자동 동기화 토글 — 완료
6. (다음) conflict 시각·필드 단위 테스트 보강, Learners/<id> 경로, Bridge adapter
