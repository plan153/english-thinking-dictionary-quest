# Day Loop — 앱 ↔ Obsidian 하루 루프

웹앱에서 틀리고 간극을 남기면 Vault에 기록되고, 그 기록이 다시 Next Practice가 되는 최소 하루 루프입니다.

클라우드 CI는 실제 Obsidian 없이 **mock Local REST**로 같은 경로를 검증합니다 (`scripts/smoke_day_loop.js`).  
**실 Vault 검증(D1·D2)은 사용자 PC/Mac에서만** 닫힙니다.

## 전제

1. Obsidian + [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) (권장 HTTP `127.0.0.1:27123`)
2. 앱 성장 화면에서 adapter=`local-rest`, Base URL·API Key 저장, **간극 저장 후 자동 동기화** 체크
3. 학습자 공책 루트: `Learners/<id>/` (기본 `me`)
4. Vault 폴더 계약 SoT: [`OBSIDIAN_VAULT_EVOLUTION.md`](./OBSIDIAN_VAULT_EVOLUTION.md)

## PC에서 순서대로 (D1 → D2)

클라우드 에이전트는 `127.0.0.1:27123` / Mac vault에 접근할 수 없습니다. 아래는 **사용자 PC**에서 합니다.

### 1) Local REST 준비

1. Obsidian에서 대상 vault를 연다 (`Project_English`가 vault 루트이거나, 상위 vault 안의 하위 폴더).
2. Local REST API 플러그인 활성화 → API Key 복사 → HTTP `27123` 확인.
3. 앱(로컬 파일 또는 GitHub Pages) → 성장 → 동기화 설정:
   - Adapter: `local-rest`
   - Base URL: `http://127.0.0.1:27123`
   - API Key 붙여넣기
   - Path prefix: vault 루트가 `Project_English`면 **비움**. 상위 vault 루트이고 그 아래 `Project_English/`면 `Project_English`
   - 간극 저장 후 자동 동기화 ON → 설정 저장 → **연결 테스트**

### 2) 폴더 계약 검사 (D2)

앱에서 **Vault 폴더 검사** 버튼을 누르거나, 터미널에서:

```bash
OBSIDIAN_API_KEY='(Local REST key)' node scripts/verify_local_vault.js
# 선택: OBSIDIAN_PATH_PREFIX=Project_English
```

기대 폴더:

- `Learners/<id>/Learning/`
- `Learners/<id>/Gaps/`
- `Library/Drafts/`
- `Library/Canon/`

스크립트는 pathPrefix 후보(`빈 값` ↔ `Project_English`)를 시도하고, 통과한 prefix를 알려 줍니다.  
부족하면 Obsidian에서 폴더를 만든 뒤 다시 검사합니다.

### 3) 하루 루프 한 바퀴 (D1)

1. **연습** — 오늘의 퀘스트 또는 게임 모드
2. **틀림 → 간극** — “간극 기록 만들기” 저장
3. **자동 sync** — Gaps · Brain State · Next Practice upsert (실패 시 실패 큐)
4. **Vault에서 읽기** — `Learners/<id>/Gaps/` · `Learning/Next Practice.md` 확인
5. **가져오기** — 앱 “Obsidian에서 가져오기”
6. **Next Practice** — 성장 화면에서 시작

모두 통과하면 BACKLOG D1·D2를 완료로 표시한다.

## 불변 규칙

- 퀴즈 은행 = Active Speaking Set만. Vault/Canon/watchlist는 자동 출제하지 않음
- 진행 숫자(XP·성공·해금) = 앱 SoT. Brain State import는 weakSlots 소프트 힌트만
- Gap 본문 conflict는 `updatedAt` 비교 (동률·없음은 Vault 우선)

## 자동화 (CI / mock)

```bash
node scripts/smoke_day_loop.js
# artifacts: /opt/cursor/artifacts/day-loop-smoke (or SMOKE_ARTIFACT_DIR)

# PC only (needs real Local REST):
OBSIDIAN_API_KEY='...' node scripts/verify_local_vault.js
```

CI: `.github/workflows/validate.yml` → `browser-smoke` job에서 day-loop smoke도 실행합니다.  
`verify_local_vault.js`는 API key가 없으면 exit 2로 skip 합니다(CI 필수 아님).

## O3 — 배포 후 옛 UI / 캐시

GitHub Pages 또는 로컬에서 **버전이 올랐는데 옛 화면**이 보이면:

1. 주소창 강력 새로고침 (Mac Chrome: `Cmd+Shift+R`)
2. 사이트 데이터 삭제: Chrome → 사이트 설정 → 데이터 삭제 / Safari → 고급 → 웹사이트 데이터
3. 서비스워커: DevTools → Application → Service Workers → Unregister 후 새로고침
4. 앱은 `APP_CACHE_VERSION`이 바뀌면 오래된 Cache Storage를 자동 삭제합니다

## 상태

| ID | 항목 | 클라우드 | PC |
| --- | --- | --- | --- |
| D1 | 실 day loop 한 바퀴 | mock smoke만 | **사용자 실행 필요** |
| D2 | pathPrefix·폴더 실측 | 검사 API·스크립트 준비됨 | **사용자 실행 필요** |
| O3 | Pages 캐시 안내 | 문서·성장 화면 안내 | 사용자가 캐시 지우면 즉시 해소 |

미완 SoT: [`BACKLOG.md`](./BACKLOG.md)
