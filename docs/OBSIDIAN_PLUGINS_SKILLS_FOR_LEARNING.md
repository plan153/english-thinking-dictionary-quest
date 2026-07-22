# 웹앱 ↔ Obsidian 연동: 플러그인·스킬 조사

영어학습(제2의 영어뇌)에 웹앱과 Obsidian Vault를 붙일 때, **무엇을 본선으로 쓰고 / 무엇을 쓰지 말지**를 정리한 조사 메모다.  
상세 동기화 계약은 [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md)를 따른다.

## 영어학습에서 원하는 연동 효용

| 효용 | 설명 |
| --- | --- |
| 학습 흔적 보존 | 퀴즈 진행·간극(Gap)·Brain State가 Vault에 남아 “내 영어뇌”가 된다 |
| 약점 재투입 | Vault에서 Next Practice / Gaps를 손보면 다음 연습 순서로 돌아온다 |
| 연결·복습 | wikilink로 동사·명사·간극을 잇고, 나중에 그래프/검색으로 다시 만난다 |
| 학습 비차단 | Obsidian이 꺼져 있거나 sync 실패해도 웹앱 학습은 계속된다 |

실시간(밀리초) 동기화는 목표가 아니다. **같은 공부 세션 안에 Vault에 반영**되면 충분하다.

## 역할 분담 한눈에

```text
웹앱 (퀴즈 SoT: progress)
  ↓ upsert / export          ↑ import (Next Practice, Gaps)
Obsidian Local REST (+ MCP)  ←── 본선 CRUD
  ↓
Vault Markdown (영어뇌 문서)
  ↓ 정리·wikilink·MOC
kepano/obsidian-skills · CLI   ←── 에이전트 보조 (progress 원본 금지)
  ↓ 백업만
Obsidian Git / GHVault / Drive ←── 학습 루프 밖
```

## 플러그인·스킬별 기능 · 역할 · 효용

### 1. Obsidian Local REST API (+ 내장 MCP) — **본선 (필수 후보)**

- **무엇인지:** [coddingtonbear/obsidian-local-rest-api](https://github.com/coddingtonbear/obsidian-local-rest-api). Vault를 localhost REST로 열고, 같은 능력의 **내장 MCP**(`/mcp/`)도 제공한다.
- **기능:** 노트 읽기/쓰기/append/patch, 목록·검색, (MCP로) 에이전트 도구 표면.
- **역할 (우리 앱):** `download` 다음 단계의 **자동 upsert/import adapter**. `Learners/<id>/Learning|Gaps` 경로에 Brain State·간극을 쓰고, Next Practice를 읽는다.
- **영어학습 효용:** 앱에서 틀린 직후 Gap이 Vault에 쌓이고, 약한 표현 큐를 다시 앱으로 가져올 수 있다. “제2의 영어뇌” 루프의 기술 본선.
- **제약:** Obsidian이 **켜져 있어야** 동작. API 키는 브라우저 공개 소스에 넣지 말고 로컬 설정/브리지에만. HTTPS는 self-signed(27124) 또는 HTTP(27123).
- **판정:** Phase 3에서 **1순위 구현**.

### 2. 서드파티 Obsidian MCP 서버 (mcp-obsidian 등) — **선택**

- **무엇인지:** Local REST 위를 감싼 외부 MCP 어댑터(예: atomic patch by heading).
- **역할:** Cursor/Claude 등 에이전트가 Vault를 다룰 때 도구 표면. 웹앱 퀴즈 루프의 필수는 아님.
- **효용:** 교사가 Gap 노트를 정리하거나 Index/MOC를 다듬을 때.
- **판정:** Local REST에 내장 MCP가 있으므로 **새로 필수 설치할 필요는 낮음**. 에이전트 워크플로가 필요할 때만.

### 3. kepano/obsidian-skills — **에이전트 정리 보조 (progress 금지)**

- **무엇인지:** [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills). 에이전트에게 Obsidian Markdown / Bases / Canvas / CLI 사용법을 가르치는 **Skill 모음**.
- **기능 예:** `obsidian-markdown`(wikilink·callout·properties), `obsidian-bases`, `json-canvas`, `obsidian-cli`, `defuddle`(웹→깔끔한 MD).
- **역할:** Vault **문서 품질·구조** 보조. 학습 progress 숫자·해금 상태를 바꾸면 안 된다.
- **영어학습 효용:** Gap 본문 다듬기, `English Brain Index` MOC, 동사 노트 wikilink 정리, 캔버스로 연결 지도 초안.
- **판정:** Phase 3 이후 **권장 보조**. 동기화 adapter가 아님.

### 4. Obsidian CLI — **로컬 자동화·에이전트**

- **무엇인지:** Obsidian 공식/연동 CLI로 vault·노트·명령 실행.
- **역할:** 스크립트/에이전트가 앱 밖에서 노트를 만들거나 검색.
- **효용:** 배치로 Learner 폴더 템플릿 생성, 보관(archive) 상태 일괄 점검.
- **판정:** 본선 sync 대체 아님. skills와 함께 **운영 보조**.

### 5. Obsidian Git / GHVault — **백업만**

- **기능:** Vault ↔ GitHub 백업·기기 간 파일 동기.
- **역할:** 학습 루프 SoT가 아님. Drive/Git 정책과 동일.
- **영어학습 효용:** 노트북 분실·기기 이동 시 영어뇌 문서 보존.
- **판정:** **학습 중 양방향 출제 루프에 넣지 않음**.

### 6. Google Drive 웹훅 등 — **선택 백업**

- **역할:** 앱 → 클라우드 미러. localhost REST가 불가한 환경 보완.
- **판정:** Phase 3 본선 아님. 토큰을 GitHub Pages에 넣지 말 것.

### 7. 웹앱 `download` adapter — **이미 동작하는 최소 경로**

- **기능:** Markdown/JSON 파일 다운로드 → 사용자가 Vault에 넣음.
- **효용:** 플러그인 없이 영어뇌 문서를 시작할 수 있음.
- **판정:** 항상 유지하는 fallback.

## 영어학습 도입 시 추천 스택

| 단계 | 쓰는 것 | 목적 |
| --- | --- | --- |
| 지금 | download + `Learners/<id>/` 경로 계약 | 개인 공책 export |
| Phase 3 | Local REST API (upsert/import) | 세션 중 자동 반영 |
| 보조 | obsidian-skills / CLI | Gap·Index 정리 (progress 비개입) |
| 백업 | Obsidian Git / Drive | 기기·재해 복구만 |

## 하지 말 것

1. Git/Drive를 “정답 progress SoT”로 쓰기  
2. 정적 웹앱 소스에 REST API 키 커밋  
3. skills/에이전트가 `etdQuestProgress`·해금 수치를 임의 수정  
4. 한 Vault `Learning/Brain State.md`에 여러 학습자 섞기 (개인은 `Learners/<id>/`)

## 다음 구현 연결

1. SyncAdapter: `download` → `local-rest` → (optional) `bridge`  
2. upsert 대상: `Learners/<learnerId>/Learning/*`, `Gaps/*`  
3. import 대상: Next Practice queue, open Gaps (Vault 우선 본문)  
4. 실패 큐 + “Obsidian에 동기화” 수동 버튼  
5. skills는 문서화·운영 가이드만, 앱 런타임 의존성으로 넣지 않음
