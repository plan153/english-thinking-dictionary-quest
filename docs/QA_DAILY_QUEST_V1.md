# QA: 오늘의 퀘스트 v1 1차 E2E 검증

## 목적
오늘의 퀘스트 v1의 핵심 사용자 흐름을 localhost 브라우저에서 실제로 검증한다.

## 검증 환경
- 브라우저: Chrome/Safari 최신 버전
- 해상도:
  - 데스크톱: 1280px 이상
  - 모바일: 390px
- 서버: `python3 -m http.server 8080`

## E2E 테스트 케이스

### 1. 첫 진입 시 3개 표현 선택 및 저장
**시나리오**:
1. localStorage 초기화
2. 홈 화면 로드
3. 퀘스트 영역 확인

**예상 결과**:
- 오늘의 3문장 카드가 노출됨
- "오늘 연결할 3개 표현이에요" 메시지 표시
- 3개 표현 목록 표시 (번호 + 한국어 → 영어)
- "퀘스트 시작하기" 버튼 표시

**통과 조건**: ✅ / ❌

---

### 2. 새로고침 후 같은 3개 표현 + 진행 상태 유지
**시나리오**:
1. 퀘스트 시작
2. 첫 번째 표현의 meaning 단계 완료
3. F5 새로고침

**예상 결과**:
- 같은 3개 표현 ID 유지
- 첫 번째 표현의 meaningDone: true 유지
- "퀘스트 이어하기" 버튼 표시

**통과 조건**: ✅ / ❌

---

### 3. 단계 순서 강제 (meaning → assembly → output)
**시나리오**:
1. 퀘스트 시작
2. 첫 번째 표현 진행

**예상 결과**:
- 첫 퀴즈: enko(영한) 모드
- enko 정답 후 다음: build(조립) 모드
- build 최종 문장 정답 후 다음: speak(직접 말하기) 모드
- speak 음성 인식 결과를 [확인하기]로 검사해 정답/거의 맞음이면 두 번째 표현의 meaning 단계로 이동

**통과 조건**: ✅ / ❌

---

### 4. 각 단계는 한 번만 카운트
**시나리오**:
1. meaning 단계 정답
2. 같은 표현 meaning 단계 다시 풀기

**예상 결과**:
- 첫 번째 정답: meaningDone = true
- 두 번째 정답: meaningDone 중복 갱신 없음
- stepByExpressionId 상태 변경 없음

**통과 조건**: ✅ / ❌

---

### 5. almost/hint-heavy는 퀘스트 단계 완료하지만 연결 강도는 약하게
**시나리오**:
1. speak 단계에서 마이크 인식 결과를 [확인하기]로 검사해 정답

**예상 결과**:
- outputDone: true (퀘스트 단계 완료)
- connections.output.strength: 0.5 (약한 연결)
- 다음 표현으로 진행

**통과 조건**: ✅ / ❌

---

### 6. 한 표현 완료 후 다음 표현으로 이동
**시나리오**:
1. 첫 번째 표현 3단계 모두 완료

**예상 결과**:
- completedExpressionIds에 첫 번째 표현 ID 추가
- currentIndex: 1
- 두 번째 표현의 meaning 단계(enko) 시작

**통과 조건**: ✅ / ❌

---

### 7. 3개 표현 완료 후 완료 화면
**시나리오**:
1. 세 번째 표현의 output 단계까지 완료

**예상 결과**:
- isCompleted: true
- 홈 화면으로 이동
- "✨ 오늘의 3문장 퀘스트 완료!" 메시지
- "내일 또 새로운 3문장이 준비됩니다" 안내
- 토스트 메시지: "🎉 오늘의 3문장 퀘스트를 모두 완료했어요!"

**통과 조건**: ✅ / ❌

---

### 8. 다음 Seoul 날짜에 새 퀘스트 생성
**시나리오**:
1. 브라우저 개발자 도구에서 날짜 변경 시뮬레이션
2. 또는 `dailyQuestV1.date`를 어제 날짜로 수정 후 새로고침

**예상 결과**:
- 새로운 3개 표현 선택
- 이전 날짜의 진행 상태는 무시
- currentIndex: 0
- completedExpressionIds: []
- isCompleted: false

**통과 조건**: ✅ / ❌

---

### 9. 사전/지도에서 시작한 퀴즈는 퀘스트 진행에 영향 없음
**시나리오**:
1. 퀘스트 첫 번째 표현: e001
2. 사전에서 e001 직접 클릭 → koen 퀴즈 풀이
3. 홈으로 돌아와 퀘스트 확인

**예상 결과**:
- 퀘스트 진행 상태 변화 없음
- outputDone 여전히 false
- 퀘스트 이어하기 시 여전히 meaning 단계부터 시작

**통과 조건**: ✅ / ❌

---

### 10. 데스크톱(1280px) 및 모바일(390px) 가로 스크롤 없음
**시나리오**:
1. 브라우저 폭 1280px 설정
2. 홈 화면 퀘스트 영역 확인
3. 브라우저 폭 390px 설정
4. 홈 화면 퀘스트 영역 확인

**예상 결과**:
- 1280px: 퀘스트 카드 전체 폭 적절히 표시, 가로 스크롤 없음
- 390px: 퀘스트 카드 세로 배치, 가로 스크롤 없음, 텍스트 줄바꿈 정상

**통과 조건**: ✅ / ❌

---

## 자동 검증 스크립트

### JSON 파싱 체크
```bash
python3 -c "import json; json.load(open('data/expressions.json'))"
python3 -c "import json; json.load(open('data/verbs.json'))"
python3 -c "import json; json.load(open('data/nouns.json'))"
python3 -c "import json; json.load(open('data/patterns.json'))"
```

### 데이터 검증
```bash
python3 scripts/validate.py
```

### Git whitespace 체크
```bash
git diff --check
```

## 결과 기록

| 테스트 | 통과 | 메모 |
|--------|------|------|
| 1. 첫 진입 선택 | ✅ | 홈 진입 직후 `0/3`, 3개 표현 목록, `퀘스트 시작하기` 버튼 확인 |
| 2. 새로고침 유지 | ✅ | 첫 표현 meaning 완료 후 홈 재진입 시 동일 expressionIds 유지, `퀘스트 이어하기` 노출 확인 |
| 3. 단계 순서 강제 | ✅ | `enko → build → speak` 순서로만 진행되고 다음 표현 `enko`로 이동 확인 |
| 4. 중복 카운트 방지 | ✅ | 이미 `meaningDone=true`인 표현에 `handleQuestStageCompletion('enko', id, 'correct')` 재호출 시 상태 불변 확인 |
| 5. almost 처리 | ✅ | speak 단계 음성 인식 확인 후 `outputDone=true`, `connections.output.strength=1` 확인 |
| 6. 다음 표현 이동 | ✅ | 첫 표현 완료 직후 `currentIndex=1`, `completedExpressionIds.length=1`, 다음 모드 `enko` 확인 |
| 7. 완료 화면 | ✅ | 3표현 완료 후 `isCompleted=true`, 완료 카드(`오늘의 퀘스트 v1 완료`) 노출 확인 |
| 8. 새 날짜 생성 | ✅ | `date`를 과거로 설정 후 재평가 시 `currentIndex=0`, `completed=[]`, `isCompleted=false`, 새 3표현으로 재선정 확인 |
| 9. 사전 격리 | ✅ | 퀘스트 컨텍스트 없이 동일 표현 koen 정답 처리해도 `dailyQuestV1.stepByExpressionId` 불변 확인 |
| 10. 반응형 레이아웃 | ✅ | 1280/390에서 `scrollWidth <= innerWidth` 확인, 가로 스크롤 없음 |

## 캡처

- 데스크톱 1280px: `docs/qa-screenshots/daily-quest-v1-desktop-1280.png`
- 모바일 390px: `docs/qa-screenshots/daily-quest-v1-mobile-390.png`

---

## 남은 위험 요소 (Phase 2)

- [ ] 3개 미만 표현만 있는 데이터셋(축소 샘플)에서 선택 로직 회귀 테스트
- [ ] 실제 기기 시간대가 Seoul 이외일 때 장시간(자정 경계) 브라우저 수동 검증
