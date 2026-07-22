# English Thinking Dictionary Quest

핵심 동사와 명사를 조합해 실제 영어 표현을 만드는 **게임형 웹 앱**입니다.

초기 목표는 3~4세 수준의 쉬운 구어체부터, **만능동사 + 핵심명사 코로케이션** 안에서 묻기·답하기·시제 뉘앙스를 자유롭게 쓰는 것입니다. Vault에 영어 문서가 더 있어도 연습 범위는 Active Speaking Set으로 제한하고, 숙달 후에만 점차 넓힙니다.

웹앱에서 배우고 틀린 기록은 Obsidian(`Project_English/Learners/<학습자>/`)에 **개인 영어뇌**로 남기고, 그 상태를 다시 읽어 약한 부분과 다음 연습 순서를 정하는 **양방향 루프**로 확장하는 것이 최종 목표입니다. 교과서는 공유하고, 진도·간극 공책은 로컬 프로필로 나눕니다(로그인은 이후 기기 이어하기용).

- [서비스 기획 및 마케팅 문서](docs/PRODUCT_STORY_AND_MARKETING.md)
- [통합 개발 계획](docs/DEVELOPMENT_PLAN.md)
- [Active Speaking Set](docs/ACTIVE_SPEAKING_SET.md)
- [Obsidian 영어뇌 동기화](docs/OBSIDIAN_ENGLISH_BRAIN_SYNC.md)

## GitHub 자동 업로드·자동 배포·자동 판올림

이 프로젝트는 GitHub Pages와 GitHub Actions를 기준으로 준비되어 있습니다.

- `main` 브랜치에 올리면: 파일 검증 후 **웹앱 자동 배포**
- `v1.0.1` 같은 버전 태그를 올리면: **릴리스 노트 + 다운로드 ZIP 자동 생성**
- `patch / minor / major` 명령을 고르면: 버전 번호, 서비스워커 캐시, Git 태그까지 함께 바뀜

### 1. 처음 한 번만: GitHub 저장소 생성·업로드

Mac 터미널에서 이 폴더로 들어가 아래를 실행합니다.

```bash
brew install gh          # gh가 없다면 한 번만
./scripts/publish-first-time.sh
```

저장소 이름을 직접 정하려면:

```bash
./scripts/publish-first-time.sh english-thinking-dictionary-quest
```

처음 실행 때 GitHub 로그인 창이 열립니다. 로그인 후 이 스크립트가 공개 저장소 생성, 첫 업로드, GitHub Pages 설정을 시도합니다.

웹 주소는 아래 형태가 됩니다.

```text
https://내깃허브아이디.github.io/english-thinking-dictionary-quest/
```

처음 배포가 시작되지 않으면 GitHub 저장소에서 한 번만 다음처럼 설정합니다.

```text
Settings → Pages → Build and deployment → Source: GitHub Actions
```

### 2. 내용만 수정해서 자동 배포

```bash
./scripts/push-update.sh "content: add new expressions"
```

`main`에 업로드되는 즉시 GitHub Pages가 새 버전으로 바뀝니다.

### 3. 정식 판올림 + 자동 릴리스

```bash
./scripts/release.sh patch   # 1.0.0 → 1.0.1, 작은 수정
./scripts/release.sh minor   # 1.0.0 → 1.1.0, 새 학습 모드/표현 묶음
./scripts/release.sh major   # 1.0.0 → 2.0.0, 큰 구조 변경
```

명령 하나로 아래가 순서대로 처리됩니다.

1. `VERSION`, `version.json`, 화면 버전, PWA 캐시 버전을 변경합니다.
2. 파일 검증을 합니다.
3. Git 커밋과 `vX.Y.Z` 태그를 만듭니다.
4. GitHub에 업로드합니다.
5. GitHub Actions가 웹앱을 배포하고, 다운로드용 ZIP과 릴리스 노트를 자동으로 생성합니다.

### 4. 자동화 파일 위치

```text
.github/workflows/validate.yml      # 업로드 시 필수 파일/버전 검사
.github/workflows/deploy-pages.yml  # main 업로드 → GitHub Pages
.github/workflows/release.yml       # vX.Y.Z 태그 → GitHub Release + ZIP
scripts/publish-first-time.sh       # 첫 저장소 생성 및 연결
scripts/push-update.sh              # 일반 업데이트 업로드
scripts/release.sh                  # patch/minor/major 판올림
```

## 로컬 실행

### 가장 쉬운 방법
`index.html` 파일을 더블 클릭해 브라우저에서 엽니다.

### PWA/음성 기능까지 안정적으로 쓰려면

```bash
python3 -m http.server 8080
```

그다음 브라우저에서 `http://localhost:8080`을 엽니다.

## 들어 있는 주요 게임 모드

1. **듣고 따라 말하기**: 브라우저 음성으로 문장을 듣고 바로 따라 말하기
2. **한글 → 영어 조립**: 한국어 장면에서 핵심 동사와 표현 덩어리 꺼내기
3. **영어 → 뜻 연결하기**: 번역보다 장면과 의미를 바로 연결하기
4. **약한 연결 복습**: 아직 약한 연결로 남아 있는 표현을 우선 반복

## 오늘의 7분 퀘스트

홈의 `오늘의 7분 퀘스트`는 `듣고 따라 말하기 1세트 → 영어 장면 고르기 2회 → 한글→영어 조립 2회 → 약한 연결 복습 1회` 순서로 자동 진행됩니다.
`힌트 사다리`는 `한글 → 영어 조립` 안의 보조 풀이로, `문장빌드맵`은 `동사 카드` 안의 동사 선택 코너로 들어갑니다.

보조 코너는 따로 분리해 두었습니다.

- **힌트 사다리**: 한글 → 영어 조립 안에서 풀이 힌트로만 사용
- **문장빌드맵**: 동사 카드 안에서 어떤 동사를 먼저 써야 할지 고르는 훈련

## 학습 설계

- 기본 동사(예: `get`, `make`, `take`, `have`)를 단순 번역이 아니라 **의미 엔진**으로 학습합니다.
- `동사 → 생각 틀 → 핵심 명사/장면` 구조로 표현을 연결합니다.
- 힌트는 `koen` 안의 보조 풀이로, 문장빌드맵은 동사 카드 안의 코너로 제공합니다.
- 한 표현을 듣기, 말하기, 한영, 영한 등 다른 채널로 반복해 실제로 꺼내 쓰게 합니다.
- 정답 횟수 3회 이상이면 “내 표현”으로 표시됩니다.
- 학습 기록은 브라우저 `localStorage`에 저장됩니다.
- 어휘를 먼저 늘리지 않습니다. Active Speaking Set을 숙달한 뒤 Unlock pack으로만 확장합니다.

### 현재 데이터 규모 (저장소 기준)

| 항목 | 규모 |
| --- | --- |
| 핵심 동사 | 15 |
| 핵심 명사 | 약 66 |
| 표현 틀 | 46 |
| 표현 카드 | 약 90 |
| 학습 경로 | Core 15 Starter |

출제 게이트는 Active Speaking Set Starter(표현 40)로 동작하며, 내 표현 70% 도달 시 Unlock pack 1(10개)이 해금됩니다. 묻기/답하기·시제 매트릭스는 `묻기 · 답하기 변형` 모드와 오늘의 퀘스트에 포함됩니다.

## 파인만식 영어뇌 · Obsidian 연동

최종 루프는 다음과 같습니다.

1. 웹앱에서 배우고 틀리고 익힌다.
2. 간극·진행·Active set 상태가 Obsidian Vault에 Markdown으로 남는다.
3. Vault에서 연결·메모를 정리한다.
4. 앱이 Brain State / Next Practice / Gaps를 읽어 약한 부분을 다시 훈련한다.

### 구현 상태

| 기능 | 상태 |
| --- | --- |
| 퀴즈·연결도·localStorage 진행 기록 | 동작 |
| Active Speaking Set 출제 제한·해금 | 동작 (Starter 40 + Unlock pack 10) |
| 묻기/답하기·시제 변형 매트릭스 | 동작 (`matrix` 모드, Active set 12군) |
| Gap Note → Obsidian Markdown 동기화 | 동작 (로컬 저장 + Markdown/JSON 다운로드) |
| Vault → 앱 Brain State / Gaps 가져오기 | 계획 |
| Local REST API / 로컬 브리지 | 계획 (본선) |
| Google Drive 웹훅 · Obsidian Git | 백업/호환 경로 |

동기화 계약과 Vault 폴더 구조는 [`docs/OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](docs/OBSIDIAN_ENGLISH_BRAIN_SYNC.md), 단계별 순서는 [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md)를 참고하세요.

### 목표 Vault 구조

```text
English Brain Index.md
Learning/Brain State.md
Learning/Next Practice.md
Learning/Progress.md
Learning/Today Review.md
Patterns/<문형>.md
Verbs/<동사>.md
Nouns/<명사>.md
Prepositions/<전치사>.md
Gaps/<간극 ID>.md
```

권장 외부 도구: Obsidian Local REST API(+ MCP)를 앱↔Vault 본선으로 쓰고, Obsidian CLI skills는 노트 정리용, Obsidian Git/GHVault는 Vault 백업용으로 분리합니다.

## 콘텐츠 구조

콘텐츠의 단일 원본은 `data/expressions.json`입니다. 게임 모드는 이 표현 카드를 읽어 듣기, 따라 말하기, 한영, 영한, 빈칸, 힌트 퀴즈를 만듭니다. 기존 내장 `phraseBank`는 데이터 파일을 읽지 못했을 때만 쓰는 예비 데이터입니다.

```json
{
  "id": "e001",
  "english": "I have a question.",
  "naturalKorean": "질문이 있어요.",
  "literalMeaning": "나는 질문 하나를 가지고 있어요.",
  "coreVerbId": "v_have",
  "patternId": "p_have_thing",
  "nounIds": ["n_question"],
  "situationTags": ["class", "work", "conversation"],
  "level": 1,
  "chunks": ["I", "have", "a question"],
  "hints": [
    "질문을 내 쪽에 가지고 있다고 생각해요.",
    "have + a question",
    "I ___ a ________."
  ],
  "quizTypes": ["listening", "speaking", "koToEn", "enToKo", "blank", "hint"],
  "audioText": "I have a question.",
  "relatedExpressionIds": ["e021", "e015"]
}
```

관련 파일은 `docs/DATA_MODEL.md`, `data/verbs.json`, `data/nouns.json`, `data/patterns.json`, `data/expressions.json`, `data/learning-paths.json`입니다.

## 권장 로컬 폴더

Mac에서는 아래처럼 **내 컴퓨터 폴더를 원본**으로 두고 작업합니다.

```text
~/Projects/english-thinking-dictionary-quest
```

`mini`는 Mac의 컴퓨터 이름이므로 폴더 경로에 넣지 않습니다.
