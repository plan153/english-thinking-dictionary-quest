# Vault English Brain — MD 시드·최적화

## 목적

Obsidian `Project_English`를 **제2의 영어뇌**로 쓰되, 웹앱은 훈련장으로 남긴다.

| 역할 | 위치 | 누가 씀 |
| --- | --- | --- |
| 개인 공책 | `Learners/<id>/` | 앱 sync + 사람(Gap 본문) |
| 공유 정원 | `Library/` | 사람 + 시드, 퀴즈 자동 확대 없음 |
| 템플릿 | `Templates/` | Templater/수동 복사 |

## 레포 시드

경로: [`vault/Project_English/`](../vault/Project_English/)

생성:

```bash
node scripts/build_vault_english_brain_seed.js
```

Mac 실볼트에 넣기 (기존 파일은 기본 유지):

```bash
export OBSIDIAN_API_KEY='...'
export OBSIDIAN_PATH_PREFIX=Project_English
node scripts/seed_vault_english_brain.js
node scripts/analyze_vault_md.js
```

강제 덮어쓰기: `SEED_MODE=overwrite`.

## 최적화 원칙 (적용됨)

1. **원자 노트** — Verb/Noun/Pattern/Scene/Gap 각 1파일 1역할  
2. **frontmatter** — `type` · `id` · `word` · `status` 일관  
3. **짧은 본문 + wikilink** — 긴 서사는 Gap/Weekly Review만  
4. **앱 자동 노트** — Brain State / Next Practice / Progress는 sync가 채움 (시드에 넣지 않음)  
5. **Draft → Canon**만 승격 — Drafts/Canon은 빈 폴더로 시작  

## 폰·Mac

- Mac: `local-rest` 본선  
- 폰: 연습만 (Drive/수동 이전은 선택). iCloud로 웹앱 진도 동기화는 하지 않음  

## 관련

- [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md)
- [`OBSIDIAN_ENGLISH_BRAIN_SYNC.md`](./OBSIDIAN_ENGLISH_BRAIN_SYNC.md)
- [`DAY_LOOP.md`](./DAY_LOOP.md) §2b 분석
