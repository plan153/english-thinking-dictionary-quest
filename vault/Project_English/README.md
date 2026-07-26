# Project_English vault seed

영어뇌(제2 뇌)용 최적화된 Markdown 시드입니다.

## Mac에 적용

1. Obsidian + Local REST(HTTP 27123) 실행
2. 앱 Path prefix = `Project_English` (상위 vault인 경우)
3. 레포에서:

```bash
cd /Users/mini/Projects/english-thinking-dictionary-quest
git pull
export OBSIDIAN_API_KEY='...'
export OBSIDIAN_PATH_PREFIX=Project_English
node scripts/seed_vault_english_brain.js
node scripts/analyze_vault_md.js
```

`SEED_MODE=skip-existing` (기본)은 이미 있는 파일을 덮지 않습니다.  
강제 갱신: `SEED_MODE=overwrite`.

## 포함
- Library Verbs/Patterns/Nouns/Scenes (ASS 시드)
- Learners/me Index + Weekly Review + Dataview
- Templates (Gap/Verb/Draft/Scene)
- MOC

Brain State / Next Practice / Progress 는 웹앱 sync가 채웁니다.
