# English Thinking Dictionary Quest

핵심 동사와 명사를 조합해 실제 영어 표현을 만드는 **게임형 웹 앱**입니다.

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

## 들어 있는 게임 모드

1. **듣고 따라 말하기**: 브라우저 음성으로 문장을 듣고 입으로 반복
2. **한글 → 영어 조립**: 한국어 장면에서 핵심 동사와 표현 덩어리 꺼내기
3. **영어 → 뜻 연결하기**: 번역보다 장면과 의미를 바로 연결하기
4. **힌트 사다리**: 뜻 → 생각 틀 → 문장 뼈대 → 첫 글자
5. **문장 빌드 랩**: 기본 동사와 생각 틀을 사용해 문장 만들기
6. **약한 연결 복습**: 아직 3회 성공하지 않은 표현을 우선 반복

## 학습 설계

- 기본 동사(예: `get`, `make`, `take`, `have`)를 단순 번역이 아니라 **의미 엔진**으로 학습합니다.
- `동사 → 생각 틀 → 핵심 명사/장면` 구조로 표현을 연결합니다.
- 한 표현을 듣기, 말하기, 한영, 영한 등 다른 채널로 반복해 실제로 꺼내 쓰게 합니다.
- 정답 횟수 3회 이상이면 “내 표현”으로 표시됩니다.
- 학습 기록은 브라우저 `localStorage`에 저장됩니다.

## 콘텐츠 구조 예시

```js
{
  id: 'p3',
  en: 'Let’s make a plan.',
  ko: '계획을 세우자.',
  verb: 'make',
  nouns: ['plan'],
  frame: 'make + plan',
  hint: [
    '계획을 “만들다” = make a plan',
    'Let’s + make a plan',
    'Let’s ____ _ ____.',
    'L__’_ m___ _ p___.'
  ]
}
```

## 권장 로컬 폴더

Mac에서는 아래처럼 **내 컴퓨터 폴더를 원본**으로 두고 작업합니다.

```text
~/Projects/english-thinking-dictionary-quest
```

`mini`는 Mac의 컴퓨터 이름이므로 폴더 경로에 넣지 않습니다.
