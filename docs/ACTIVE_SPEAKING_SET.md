# Active Speaking Set (ASS)

## 목적

Vault나 `data/*.json`에 정보가 더 있어도, **지금 입으로 훈련하는 범위**를 좁게 고정한다.  
목표는 3~4세 수준의 쉬운 구어체를 제한된 만능동사·핵심명사 코로케이션 안에서 자유자재로 쓰는 것이다. 숙달 후에만 다음 묶음을 해금한다.

## 용어

| 용어 | 의미 |
| --- | --- |
| Active Speaking Set | 현재 퀴즈·복습·해금 UI에 나오는 동사·명사·패턴·표현 ID 집합 |
| Vault knowledge | Obsidian의 배경 지식·메모. 읽기/연결 후보는 될 수 있으나 자동 출제하지 않음 |
| Unlock pack | Active set mastery 후 추가되는 작은 묶음(기본 표현 10개 또는 동사 1~2개) |
| Brain State | Obsidian `Learning/Brain State.md`에 기록되는 현재 Active set과 약점 요약 |

## Starter Set v0 (초기 목표)

코드 반영 전까지의 설계 기본값이다. 구현 시 `learning-paths.json`의 path 또는 `CURRICULUM_CONFIG`로 옮긴다.

### 만능동사 (우선 8 → 최대 15)

1차 필수: `have`, `get`, `want`, `need`, `go`, `come`, `make`, `take`  
2차 확장: `be`, `do`, `give`, `put`, `keep`, `find`, `feel`

### 핵심 명사·대명사 코로케이션 (약 40~80)

우선 범주:

- 사람/대명사: `I`, `you`, `me`, `it`
- 시간: `time`, `minute`, `second`, `now`, `today`
- 장소: `home`, `here`, `there`, `place`
- 요청/도움: `help`, `question`, `problem`
- 상태/진행: `idea`, `plan`, `way`

명사는 “단어장”이 아니라 **동사와 자주 붙는 자리**로만 넣는다. 표현 카드에 쓰이지 않는 명사는 Active set에 넣지 않는다.

### 문장 뼈대 (Starter)

- `I/You + VERB + NOUN`
- `Do you + VERB + ...?`
- `I don’t + VERB + ...`
- `I need/want to + VERB`
- 같은 뼈대의 현재 / 아주 간단한 past(`did`, 불규칙 최소) / 가까운 미래(`going to` 또는 `will` 중 하나)

### 표현 카드

- Starter 출제 상한: 약 40~50개 (기존 Core-50 목표와 정렬)
- 현재 저장소의 `lp_starter_core_15`(표현 80개)는 **전체 후보 풀**로 두고, Active set은 그 부분집합으로 시작한다.
- 상황 태그는 `daily`, `home`, `conversation`, `request`를 우선하고 `work`/`travel` 비중은 해금 이후로 미룬다.

## 묻기 · 답하기 · 시제 매트릭스

한 표현군 예: `have + time`

| 형태 | 예 |
| --- | --- |
| 평서 | I have time. |
| 의문 | Do you have time? |
| 부정 | I don’t have time. |
| 짧은 답 | Yes, I do. / No, I don’t. |
| 과거(간단) | I had time. / Did you have time? |
| 가까운 미래 | I’m going to have time. |

규칙:

1. 매트릭스는 Active set 동사·명사 안에서만 생성한다.
2. 새 단어를 위해 매트릭스를 늘리지 않는다. 같은 단어로 변형을 늘린다.
3. 퀴즈 모드는 평서→의문→부정→짧은 답 순서를 기본으로 한다.

## 해금 규칙

1. 표현 단위(**내 표현**): 연결도 `recognition`·`assembly`·`output`이 모두 강함이면 우선 인정. 아니면 성공 횟수 ≥ masteryThreshold(기본 3)여도 인정. (`isMineExpression`)
2. 팩 단위(**지금 레벨업 스토리**): Active set 내 “내 표현” 비율이 임계값(70%)을 넘으면 다음 Unlock pack(표현 약 10개)만 연다.
3. 동사 단위(**이후 게이트**): 대표 매트릭스 4형태(평서/의문/부정/짧은 답) 통과 전에는 새 동사 해금 안 함 — 아직 미구현. UI는 팩 해금만 말한다.
4. Vault overlay / Library Canon 단어는 자동 해금하지 않는다. Unlock pack 후보 또는 리뷰 후 JSON 편입만 한다.

## 웹앱 반영 지점

- `getUnlockedBank()` 또는 동등 함수가 모든 출제·사전 탐험·복습의 단일 게이트가 된다.
- 홈/성장 화면에 Active set 요약(동사 N, 명사 N, 내 표현 N)을 보여 준다.
- Obsidian으로 보낼 때 `Learning/Brain State.md`와 `Learning/Next Practice.md`에 Active set과 약한 슬롯을 쓴다.

## 구현 상태

| 항목 | 상태 |
| --- | --- |
| Starter 동사 8 · 표현 ~40 출제 제한 | 구현 (`getUnlockedBank`) |
| Unlock pack 70% / +10 | 구현 |
| 묻기·답하기·시제 매트릭스 | 구현 (`qa-matrices.json` + mode `matrix`) |
| Brain State / Next Practice export | 구현 (다운로드) |
| 동사 4형태 통과 후 새 동사 해금 | 미구현 (이후 게이트) |
| Local REST 자동 sync | 미구현 (Phase 3) |

## 구현 체크리스트

- [x] Starter set ID 목록을 데이터 파일로 고정 (`data/learning-paths.json` → `activeSpeakingSet`)
- [x] 출제 게이트를 Active set으로 통일 (`getUnlockedBank`)
- [x] 해금 임계값과 Unlock pack 정의 (70% / pack_1 10개)
- [x] 묻기/답하기/시제 매트릭스 콘텐츠 또는 생성 규칙 (`data/qa-matrices.json` + mode `matrix`)
- [x] Brain State / Next Practice projection 필드 연결 (Markdown export)
- [x] 홈·성장 화면에 Active set 요약 표시
- [x] 동사 카드에서 잠긴 표현 퀴즈 차단
- [ ] 동사 단위 매트릭스 4형태 해금 게이트
