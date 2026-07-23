# Day Loop — 앱 ↔ Obsidian 하루 루프

웹앱에서 틀리고 간극을 남기면 Vault에 기록되고, 그 기록이 다시 Next Practice가 되는 최소 하루 루프입니다.

클라우드 CI는 실제 Obsidian 없이 **mock Local REST**로 같은 경로를 검증합니다 (`scripts/smoke_day_loop.js`).

## 전제

1. Obsidian + [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) (권장 HTTP `127.0.0.1:27123`)
2. 앱 성장 화면에서 adapter=`local-rest`, Base URL·API Key 저장, **간극 저장 후 자동 동기화** 체크
3. 학습자 공책 루트: `Learners/<id>/` (기본 `me`)

## 하루 체크리스트

1. **연습** — 오늘의 퀘스트 또는 게임 모드(듣기 / 한글→영어 / 영어→뜻 등)
2. **틀림 → 간극** — 틀린 뒤 “간극 기록 만들기” → 추측·놓친 단서·모델 업데이트 저장
3. **자동 sync** — Local REST가 켜져 있으면 Gaps · Brain State · Next Practice upsert (실패해도 로컬 학습은 계속)
4. **Vault에서 읽기(선택)** — Obsidian에서 `Learners/<id>/Gaps/` · `Learning/Next Practice.md` 확인·메모 보강
5. **가져오기** — 앱에서 “Vault에서 가져오기” (Gaps 본문 · Next Practice 큐 · Brain 약한 슬롯 힌트)
6. **Next Practice** — 성장 화면에서 큐 확인 후 “Next Practice 시작”

## 불변 규칙

- 퀴즈 은행 = Active Speaking Set만. Vault/Canon/watchlist는 자동 출제하지 않음
- 진행 숫자(XP·성공·해금) = 앱 SoT. Brain State import는 weakSlots 소프트 힌트만
- Gap 본문 conflict는 `updatedAt` 비교 (동률·없음은 Vault 우선)

## 자동화

```bash
node scripts/smoke_day_loop.js
# artifacts: /opt/cursor/artifacts/day-loop-smoke (or SMOKE_ARTIFACT_DIR)
```

CI: `.github/workflows/validate.yml` → `browser-smoke` job에서 day-loop smoke도 실행합니다.

## 아직 안 한 것 (BACKLOG D1)

- [ ] **실기기** Obsidian Local REST + 실제 Vault로 위 체크리스트 한 바퀴 통과 확인
- [ ] `pathPrefix`(예: `Project_English`)가 사용자 vault와 일치하는지 확인
- [ ] 실패 시 앱 토스트·실패 큐·Gaps 경로 로그를 보고 보정

클라우드/CI는 mock만 검증한다. 미완 항목 SoT: [`BACKLOG.md`](./BACKLOG.md) D1·D2.
