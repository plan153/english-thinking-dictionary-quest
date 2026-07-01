# English Thinking Dictionary Data Model

## 목적
English Thinking Dictionary는 단어를 따로 외우는 사전이 아니다. 핵심 동사, 표현 틀, 핵심 명사, 상황을 연결해 사용자가 최소한의 단어 조합으로 많은 말을 만들도록 돕는 데이터 구조다.

첫 버전의 목표는 하나의 표현 카드를 듣기, 따라 말하기, 한영 퀴즈, 영한 퀴즈, 빈칸 퀴즈, 힌트 퀴즈, 복습 추천에 공통으로 쓰는 것이다.

## 핵심 개념

### 핵심 동사
핵심 동사는 문장을 움직이는 의미 엔진이다. 예를 들어 `get`은 단순히 "얻다"가 아니라 받다, 이해하다, 도착하다, 어떤 상태가 되다를 연결한다.

각 동사는 다음을 가진다.
- `id`: 표현 카드와 패턴에서 참조하는 안정적인 ID
- `word`: 실제 영어 단어
- `coreImage`: 학습자가 떠올릴 핵심 이미지
- `easyKorean`: 쉬운 한국어 의미
- `representativeSituations`: 자주 쓰이는 상황
- `patternIds`: 연결되는 표현 틀
- `connectedVerbIds`: 같이 확장하기 좋은 동사
- `level`: 난이도

### 핵심 명사
핵심 명사는 표현 틀에 자주 꽂히는 생활 단어다. 명사는 단어장용 정의보다 표현 생산에 필요한 역할을 우선한다.

각 명사는 다음을 가진다.
- `id`
- `word`
- `easyKorean`
- `category`
- `situationTags`
- `level`

### 표현 틀
표현 틀은 문장 뼈대다. 예를 들어 `have + noun`, `need to + verb`, `give + person + noun` 같은 구조가 된다.

각 틀은 다음을 가진다.
- `id`
- `label`
- `coreVerbId`
- `structure`
- `thinkingFrame`
- `slotTypes`
- `exampleExpressionIds`
- `level`

### 표현 카드
표현 카드는 실제 학습과 퀴즈의 중심 단위다. 하나의 표현 카드는 영어 문장, 자연스러운 한국어, 직역 이미지, 핵심 동사, 표현 틀, 핵심 명사, 상황, 힌트, 오디오 텍스트, 관련 표현을 함께 가진다.

각 표현 카드는 다음을 가진다.
- `id`
- `english`
- `naturalKorean`
- `literalMeaning`
- `coreVerbId`
- `patternId`
- `nounIds`
- `situationTags`
- `level`
- `chunks`
- `hints`: 3단계 힌트
- `quizTypes`: `listening`, `speaking`, `koToEn`, `enToKo`, `blank`, `hint`
- `audioText`
- `relatedExpressionIds`

### 퀴즈
퀴즈는 별도 문장을 만들지 않고 표현 카드에서 파생한다.
- 듣기: `audioText`
- 따라 말하기: `audioText`, `chunks`
- 한영: `naturalKorean` → `english`
- 영한: `english` → `naturalKorean`
- 빈칸: `chunks`와 `patternId`
- 힌트: `hints`

### 복습 관계
복습은 표현 카드 ID를 기준으로 기록한다. 관련 표현은 `relatedExpressionIds`로 연결한다. 같은 핵심 동사, 같은 표현 틀, 같은 명사, 같은 상황 태그를 가진 카드를 우선 추천할 수 있다.

## 데이터 파일 역할

### `data/verbs.json`
핵심 동사 사전. 동사의 의미 이미지, 쉬운 한국어 의미, 대표 상황, 연결 패턴을 관리한다.

### `data/nouns.json`
핵심 명사 사전. 표현 카드에서 자주 쓰는 생활 명사와 상황 태그를 관리한다.

### `data/patterns.json`
표현 틀 사전. 핵심 동사가 어떤 뼈대로 문장을 만드는지 정의한다.

### `data/expressions.json`
실제 생활 표현 카드. 앱의 퀴즈, 듣기, 힌트, 복습은 이 파일을 중심으로 동작한다.

### `data/learning-paths.json`
학습 순서와 복습 묶음. 초보자가 어떤 동사와 표현 틀부터 만날지 정한다.

## 학습 기록 확장
- `etdQuestProgress`는 기존 `xp`, `streak`, `successes`, `attempts`, `skipped`, `recentExpressionIds`, `daily` 구조를 유지한다.
- 새 필드 `settings.soundEnabled`는 소리 켜기/끄기 상태를 저장한다.
- 새 필드 `settings.seenConnectionGuide`는 한 번만 보여줄 연결도 안내 표시 여부를 저장한다.
- 새 필드 `historyByExpressionId`는 expression ID별 학습 기록을 보관한다.
  - `lastAttemptedAt`
  - `lastCorrectAt`
  - `lastMeaningHitAt`
  - `timesSeen`
  - `timesCorrect`
  - `lastHintLevel`
  - `reviewPriority`
  - `connections`
    - `recognition`: `strength`, `updatedAt`
    - `assembly`: `strength`, `updatedAt`
    - `output`: `strength`, `updatedAt`
- `lastMeaningHitAt`은 “뜻은 전달됨” 상태에서만 기록되고, 이는 정답 성공으로 처리하지 않는다.
- `connections`는 `listening` / `enToKo` → `recognition`, `blank` / `hint` / `build` → `assembly`, `koToEn` / 직접 입력 정답 → `output`을 기준으로 매핑한다.
- `reviewPriority`는 0~10 범위로 제한되며, 비어 있는 연결 조각, 오답/다시 연결, 뜻은 전달됨, 힌트 3단계, 7일 경과 여부를 반영한다.

## 확장 규칙

1. 표현을 먼저 늘릴 때도 반드시 `coreVerbId`, `patternId`, `nounIds`를 연결한다.
2. 새 동사는 5개 이상의 표현 카드와 2개 이상의 표현 틀이 있을 때 추가한다.
3. 새 명사는 표현 카드에서 실제로 쓰일 때만 추가한다.
4. 새 패턴은 최소 3개 이상의 표현 카드가 공유할 때 추가한다.
5. `id`는 한 번 배포한 뒤 바꾸지 않는다. 이름 변경이 필요하면 표시 텍스트만 바꾼다.
6. `hints`는 쉬운 의미 힌트, 표현 틀 힌트, 빈칸/첫 글자 힌트 순서로 작성한다.
7. `quizTypes`는 표현 카드가 지원하는 퀴즈만 적는다. 기본 생활 표현은 가능한 한 6개 타입을 모두 지원한다.
8. 관련 표현은 같은 동사만이 아니라 같은 상황도 연결한다. 예: `I need some time.` ↔ `Take your time.`
