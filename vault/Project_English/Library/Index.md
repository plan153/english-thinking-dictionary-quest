---
type: library-index
vaultPath: Library/Index.md
updatedAt: "2026-07-26T01:26:34.551Z"
draftCount: 0
canonCount: 0
source: vault-seed
---

# Library · 학습 자료 정원

Vault에서 자료가 자라고, 웹앱은 **승격(Canon)된 것만** 연습합니다.

## 폴더
- `Verbs/` `Nouns/` `Patterns/` `Scenes/` — 배경 지식 (원자 노트)
- `Drafts/` — 진화 중 후보
- `Canon/` — 승격 완료

## 시드 동사
- [[Verbs/have]] · `v_have`
- [[Verbs/get]] · `v_get`
- [[Verbs/want]] · `v_want`
- [[Verbs/need]] · `v_need`
- [[Verbs/go]] · `v_go`
- [[Verbs/come]] · `v_come`
- [[Verbs/make]] · `v_make`
- [[Verbs/take]] · `v_take`
- [[Verbs/be]] · `v_be`
- [[Verbs/do]] · `v_do`
- [[Verbs/give]] · `v_give`
- [[Verbs/feel]] · `v_feel`

## 루프
수집(Gap/장면) → Draft → 체크리스트 → Canon → (리뷰 후) Active Set / Unlock 후보

## Drafts
```dataview
TABLE status, english, coreVerb, pattern, updatedAt
WHERE contains(file.folder, "Library/Drafts") AND type = "expression-draft"
SORT updatedAt DESC
```

## Canon
```dataview
TABLE english, coreVerb, pattern, updatedAt
WHERE contains(file.folder, "Library/Canon") AND type = "expression-draft" AND status = "approved"
SORT updatedAt DESC
```
