# HANDOFF — English Thinking Dictionary Quest

## 프로젝트 목표
핵심 동사 30~50개, 핵심 명사 300~400개, 표현 틀을 연결하여 듣기·말하기·한영·영한·힌트 퀴즈로 익히는 게임형 영어 학습 웹앱.

## 현재 상태
- 정적 웹앱 MVP (`index.html`)가 준비되어 있음.
- GitHub Pages 자동 배포 워크플로우가 포함되어 있음.
- 로컬 폴더에서 개발하고, `git push`로 GitHub와 웹사이트에 반영하는 방식을 사용함.
- 영어 사고 사전 데이터 구조 v1이 `data/*.json`으로 분리되어 있음.
- `index.html`의 생각 사전 화면 안에 JSON 기반 `사전 탐험` 영역이 추가되어 있음.
- 게임 모드가 `data/expressions.json` 기반 표현 카드로 출제되도록 전환되어 있음.
- 기존 내장 `phraseBank`는 데이터 파일 로드 실패 시에만 쓰는 fallback 역할로 남아 있음.
- 서비스 기획 및 마케팅 문서 `docs/PRODUCT_STORY_AND_MARKETING.md`가 추가되어 있음.

## 서비스 기획 및 마케팅 요약
- 이 서비스는 영어를 더 많이 외우게 하는 앱이 아니라, 이미 알고 있는 기본 단어를 실제 말로 연결하게 돕는 게임형 영어 사고 훈련 앱으로 정의됨.
- 핵심 문제는 "영어를 몰라서"가 아니라 기본 동사와 표현 틀을 빠르게 연결해 꺼내는 훈련이 부족하다는 점으로 정리됨.
- 학습 철학은 핵심 동사 30~50개, 핵심 명사 300~400개, 표현 틀, 상황 태그, 짧은 문장 덩어리, 연결 표현, 반복 복습을 묶어 새로운 문장을 조립하게 하는 것임.
- 마케팅 포지셔닝은 단어 암기 앱, 문법 강의 앱, 회화 문장 암기 앱, AI 영어회화 앱과 달리 `동사 + 표현 틀 + 상황`을 연결하는 영어 사고 연결 지도에 가까움.
- 초기 성장 전략은 무료 체험, 핵심 동사 챌린지, 7일 영어 사고 챌린지, 오늘의 한 표현, 사용자 공유 카드, 초보자 전후 변화 사례 중심으로 제안됨.
- 로드맵은 데이터 기반 게임 완성, 학습 루트와 복습 엔진, 듣기·따라 말하기 강화, 개인화 학습, 콘텐츠 확장, 커뮤니티 및 공유, 모바일 앱/PWA 고도화 순서로 정리됨.

## 개발 원칙
1. 초보 학습자가 바로 이해할 수 있는 아주 쉬운 표현을 우선한다.
2. 단어 번역보다 `동사 → 생각 틀 → 명사/장면 → 문장` 연결을 강조한다.
3. 한 표현을 듣기·말하기·한영·영한·힌트 방식으로 반복한다.
4. 작업 전 이 파일과 README를 읽고, 작업 후에는 변경 사항과 다음 작업을 이 파일에 갱신한다.
5. 큰 변경 전에는 먼저 계획과 영향받는 파일을 짧게 보고한다.

## 데이터 구조 v1
- 구조 문서: `docs/DATA_MODEL.md`
- 핵심 동사: `data/verbs.json`
- 핵심 명사: `data/nouns.json`
- 표현 틀: `data/patterns.json`
- 표현 카드: `data/expressions.json`
- 학습 경로: `data/learning-paths.json`
- 표현 카드는 `english`, `naturalKorean`, `literalMeaning`, `coreVerbId`, `patternId`, `nounIds`, `situationTags`, `level`, `chunks`, 3단계 `hints`, `quizTypes`, `audioText`, `relatedExpressionIds`를 가진다.
- 이번 단계에서 추가된 `etdQuestProgress` 확장: `settings.soundEnabled`, `settings.seenConnectionGuide`, `historyByExpressionId` 기록과 `connections` 기반 리뷰 우선순위.
- `historyByExpressionId`는 `recognition`/`assembly`/`output` 연결 강도와 `reviewPriority` 0~10을 저장한다.

## 현재 데이터 규모
- 핵심 동사 15개: be, do, have, get, make, take, give, go, come, put, keep, find, feel, want, need
- 핵심 명사 64개
- 표현 틀 46개
- 실생활 표현 카드 80개
- 학습 경로 1개: Core 15 Starter

## 게임 모드 데이터 연결
- 듣기/따라 말하기: `audioText`, `english`, `naturalKorean`, `chunks`
- 한글 → 영어 조립: `naturalKorean` → `english`
- 영어 → 뜻 연결: `english` → `naturalKorean`
- 힌트 사다리: 3단계 `hints`
- 문장 빌드/빈칸 성격 퀴즈: `chunks`, `patternId`, `coreVerbId`, `english`
- 복습 기록: 표현 문자열이 아니라 expression `id` 기준으로 `successes`, `attempts`, `recentExpressionIds`를 저장

## 최근 테스트
- `python3 scripts/validate.py`
- `data/*.json` 파싱 및 표현 카드 참조 검증
- `index.html` inline script 파싱
- `http://localhost:8080/index.html` 및 `data/expressions.json` HTTP 응답 확인
- 사전 탐험 상세에서 `이 표현으로 퀴즈 풀기`와 관련 표현 이동 구조 추가

## 다음 작업 우선순위
1. 새 표현 카드 기반 퀴즈 결과를 모드별로 더 세분화해 저장한다.
2. 핵심 동사 30~50개와 핵심 명사 300~400개로 확장한다.
3. 데이터 로드 실패/fallback 상태를 화면 상단에 더 명확하게 표시한다.
4. 음성 인식 기반 따라 말하기의 실제 판정 방식을 설계한다.
5. 모바일 UI와 접근성을 점검한다.

## 남은 결정 사항
- 표현 카드 ID를 사람이 읽기 쉬운 slug로 바꿀지, 현재처럼 안정적인 번호형 ID를 유지할지 결정 필요.
- `quizTypes`별 난이도와 출제 순서를 별도 파일로 분리할지 결정 필요.
- 오프라인 PWA에서 `data/*.json`을 서비스워커 캐시에 포함할지 결정 필요.
- `literalMeaning`을 학습자 화면에 항상 보여줄지, 힌트 단계에서만 보여줄지 결정 필요.
