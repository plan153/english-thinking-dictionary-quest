# Obsidian Vault 진화 모델 — Library 정원 + 앱 훈련장

## 한 줄

**Vault는 자료가 자라는 정원, 웹앱은 확정·해금된 표현만 연습하는 훈련장.**  
정원에서 자유롭게 늘리고, 승격(Promote)된 것만 퀴즈에 넣는다.

## 폴더 계약

```text
Project_English/
  Learners/                      # 개인 영어뇌 (진도·간극) — 학습자별
    <learnerId>/
      English Brain Index.md
      Learning/
      Gaps/
  Library/                       # 공유·진화하는 학습 자료
    Index.md
    Verbs/
    Nouns/
    Patterns/
    Scenes/                      # 장면·상황 메모
    Drafts/                      # 미확정 표현 후보 (진화 중)
    Canon/                       # 승격 완료 표현 (앱 JSON과 맞출 정식)
  MOC/
```

**이 문서가 Vault 폴더 계약의 SoT다.** SYNC·WORD_LINKING은 여기 구조를 따른다.

지금 웹앱은 로컬 학습자 공책(`etdQuestProgress:<id>`)과 export/sync 경로 `Learners/<id>/Learning|Gaps`를 쓴다.  
Library는 공유로 유지한다.

## 진화 루프

```text
1. 수집  Gap / 장면 / 수동 입력 → Library/Drafts
2. 연결  [[Verbs/need]] [[Patterns/need + noun]]
3. 승격  체크리스트 통과 → status: approved → Library/Canon
4. 편입  Canon만 ASS/Unlock 후보 또는 data/expressions.json 반영
5. 피드백 연습 → Gap/Brain State → 다시 Drafts 보강
```

## Draft frontmatter

```yaml
---
type: expression-draft
id: draft_e002_...
status: draft          # draft | approved | archived
vaultPath: Library/Drafts/draft_....md
english: I need some time.
naturalKorean: 시간이 좀 필요해요.
literalMeaning: ""
coreVerb: need
pattern: need + noun
expressionId: e002     # 기존 카드와 연결 시
assEligible: true
source: gap            # gap | manual | scene | ai
sourceGapId: gap_...
promoteReady: false
updatedAt: ...
source: webapp
---
```

## 승격 체크리스트 (필수)

1. `english` 있음  
2. `naturalKorean` 있음 (한글 연계)  
3. `coreVerb` 또는 동사 링크 있음  
4. `pattern` (생각 틀/코로케이션) 있음  
5. 직역 함정을 적었거나 `literalMeaning` 비움이 의도적임  
6. ASS 안이면 `assEligible: true`, 밖이면 Unlock 대기만  

모두 통과 → `status: approved`, 경로는 `Library/Canon/<id>.md`.

## 앱 역할 (이 단계)

| 기능 | 상태 |
| --- | --- |
| Gap → Draft 생성 | 구현 |
| Draft 로컬 저장 (`expressionDrafts`) | 구현 |
| Draft/Canon Markdown export | 구현 |
| 승격 체크리스트 UI | 구현 |
| Canon → `expressions.json` 자동 반영 | 이후 (수동/리뷰 후) |
| Vault Draft 자동 import | Phase 3+ REST |

## 하지 말 것

- Draft를 바로 Active Speaking Set 출제 은행에 넣기  
- Vault 전체 문서를 JSON 원본으로 덮어쓰기  
- 한글 없는 영어만 Canon으로 승격  

## 관련 문서

- [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md)
- [`OBSIDIAN_VAULT_WORD_LINKING_PLAN.md`](./OBSIDIAN_VAULT_WORD_LINKING_PLAN.md)
- [`ACTIVE_SPEAKING_SET.md`](./ACTIVE_SPEAKING_SET.md)
