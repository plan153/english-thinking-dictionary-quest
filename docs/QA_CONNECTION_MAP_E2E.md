# QA: Connection Map E2E (Step 5 이후 행동 UX)

## 테스트 환경
- 실행 시각: 2026-07-03
- 브라우저: Chromium (Playwright)
- URL: `http://127.0.0.1:8000/index.html?fresh=20260703-inline-qa-desktop#/dictionary`
- 해상도:
  - Desktop: `1280x900`
  - Mobile: `390x844`

## 공통 합격 기준
- 단계 1~4: `selectedExpressionId === null`, `hash === #/dictionary`
- 단계 5: 실생활 문장 카드는 비클릭 카드여야 함
- 문장 카드 클릭: `selectedExpressionId`/`hash`/`scrollY` 변화 없음
- `뜻·덩어리 보기` 버튼: 지도 인라인 패널 열림, 화면 상단 이동 없음
- `문장 연습하기` 버튼: 지도 인라인 연습 카드 열림, 화면 상단 이동 없음
- `퀴즈 시작` 버튼: 이때만 퀴즈 라우트로 이동

## A. get 도착 루트

경로: `get -> 도착 -> get to + place -> work -> get to work -> I get to work at nine.`

| 항목 | 결과 | 판정 |
|---|---|---|
| 문장 카드 클릭 | `selectedExpressionId: null`, `hash: #/dictionary`, `scrollY` 변화 없음 | 통과 |
| 뜻·덩어리 보기 | 인라인 `뜻` 섹션 열림, `hash`/`scrollY` 변화 없음 | 통과 |
| 문장 연습하기 | 인라인 연습 카드(`힌트/연결도/퀴즈 버튼`) 열림 | 통과 |
| 퀴즈 시작 | `#/quiz/e087?mode=koen`로 이동, 퀴즈 화면 활성화 | 통과 |

## B. get home

경로: `get -> 도착 -> get home -> I got home late.`

| 항목 | 결과 | 판정 |
|---|---|---|
| 문장 카드 클릭 | `selectedExpressionId: null`, `hash: #/dictionary`, `scrollY` 변화 없음 | 통과 |
| 뜻·덩어리 보기 | 인라인 뜻 패널 정상 열림 | 통과 |
| 문장 연습하기 | 인라인 연습 카드 정상 열림 | 통과 |
| 퀴즈 시작 | `#/quiz/e030?mode=koen` 이동 | 통과 |

## C. want / need

검증 문장:
- `I want to try.`
- `I need to leave.`
- `I need help.`

| 문장 | 문장 클릭 무동작 | 인라인 뜻/연습 열림 | 퀴즈 시작 라우트 | 판정 |
|---|---|---|---|---|
| I want to try. | 유지 | 정상 | `#/quiz/e014?mode=koen` | 통과 |
| I need to leave. | 유지 | 정상 | `#/quiz/e084?mode=koen` | 통과 |
| I need help. | 유지 | 정상 | `#/quiz/e075?mode=koen` | 통과 |

## D. 모바일 390px

경로: `get -> 도착 -> get to + place -> work -> get to work`

| 항목 | 결과 | 판정 |
|---|---|---|
| 가로 스크롤 | `hasHorizontalScroll: false` | 통과 |
| 문장 클릭 후 상단 이동 | `scrollY` 변화 없음 | 통과 |
| 버튼 중복 제거 | 상단 액션은 `뜻·덩어리 보기 / 문장 연습하기`만 노출, 퀴즈 버튼은 연습 카드 내부 1개만 노출 | 통과 |
| 인라인 카드 가독성 | 뜻/연습 패널 정상 노출 | 통과 |

## E. 표현 연결도 UI 고급화 검증

검증 기준:
- 상태 계산 로직은 그대로 유지하고, 시각 표현만 변경
- 3단계 표기:
  - `뜻 이해 / 영어↔한국어`
  - `문장 만들기 / 빈칸·조립`
  - `직접 말하기 / 직접 입력·말하기`

상태별 검증:

| 상태 | 표시 규칙 | 판정 |
|---|---|---|
| 미완료 | 얇은 회색 테두리 원 + 단계 번호(1/2/3), 내부 점 없음 | 통과 |
| 진행 중(약한 성공) | 청록 계열 강조 + 단계 번호 유지 + `복습` 보조 태그 | 통과 |
| 강한 완료 | 청록 채움 원 + 흰 체크 아이콘 | 통과 |
| 3단계 모두 강한 완료 | 연결선 청록 전환 + `표현 연결 완료` 배지 표시 | 통과 |

적용 위치 점검:

| 위치 | 결과 | 판정 |
|---|---|---|
| 문장빌드맵 예문 카드 | `표현 연결도` 헤더와 3단계 라벨/보조문구 반영 | 통과 |
| 문장빌드맵 내부 문장 연습 카드 | 동일 연결도 컴포넌트 반영 | 통과 |
| 퀴즈 문제 카드 상단 요약 | 동일 연결도 컴포넌트 반영 | 통과 |
| 결과/리뷰 영역의 연결도 표시 | 동일 연결도 컴포넌트 반영 | 통과 |

스크린샷:
- Desktop 1280
  - `docs/qa-screenshots/connection-desktop-1280-none.png`
  - `docs/qa-screenshots/connection-desktop-1280-weak.png`
  - `docs/qa-screenshots/connection-desktop-1280-meaning-only.png`
  - `docs/qa-screenshots/connection-desktop-1280-meaning-assembly.png`
  - `docs/qa-screenshots/connection-desktop-1280-all-strong.png`
  - `docs/qa-screenshots/connection-map-practice-desktop.png`
- Mobile 390
  - `docs/qa-screenshots/connection-mobile-390-none.png`
  - `docs/qa-screenshots/connection-mobile-390-weak.png`
  - `docs/qa-screenshots/connection-mobile-390-meaning-only.png`
  - `docs/qa-screenshots/connection-mobile-390-meaning-assembly.png`
  - `docs/qa-screenshots/connection-mobile-390-all-strong.png`

## 결론
- Step 5 이후 행동이 문장 카드 클릭이 아닌 명시적 3버튼 흐름으로 동작함.
- `selectedExpressionId`는 퀴즈 버튼 클릭 시점에만 설정됨.
- 기존 지도 단계 구조(get/want/need)와 모바일 레이아웃은 유지됨.
- 연결도 계산/우선순위/힌트/퀴즈 로직은 변경 없이, UI/문구만 고급화 적용됨.
