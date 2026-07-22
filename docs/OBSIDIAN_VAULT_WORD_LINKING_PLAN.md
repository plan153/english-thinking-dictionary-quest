# Obsidian Vault 단어 연결 계획

## 목적

Vault에 이미 있는·새로 추가하는 영어 문서(`Verbs/`, `Nouns/`, `Words/` 등)를 웹앱 표현·패턴과 연결해 영어뇌를 풍부하게 만든다.  
다만 **연결 ≠ 즉시 출제**다. Active Speaking Set 밖의 단어는 후보·해금 대기만 하고 연습 은행에 넣지 않는다.

## 범위

### 포함

- Vault Markdown을 읽기 전용 overlay로 파싱
- 동사/명사/전치사 노트를 기존 `verbs.json` / `nouns.json` / `patterns.json` / `expressions.json` ID와 결정적으로 매핑
- 낮은 확신 연결은 후보로만 표시하고 사용자 확정 후 저장
- 확정된 연결을 동사 카드·표현 상세·Obsidian wikilink에 반영

### 제외 (초기)

- Vault 문서로 `data/*.json` 원본을 자동 덮어쓰기
- Active set 밖 단어의 자동 퀴즈 출제
- 전체 Vault 의미 임베딩 검색(필요해지면 이후 단계)

## 매핑 규칙

1. frontmatter `id`가 있으면 그 ID를 최우선으로 사용한다.
2. 없으면 `word` / 파일명 stem을 정규화해 `verbs.json`·`nouns.json`과 매칭한다.
3. 동사 노트 ↔ 표현: `coreVerbId` 일치 또는 본문 wikilink.
4. 명사 노트 ↔ 표현: `nounIds` 또는 코로케이션 섹션.
5. 매칭 확신도:
   - high: ID 일치 또는 고유 word 일치
   - medium: 파일명/별칭 일치
   - low: 본문 통계적 동시출현 → 후보만

## Active set 게이트

| Vault 단어 상태 | 앱에서의 취급 |
| --- | --- |
| Active set에 이미 있음 | 연결 표현 연습 가능 |
| Unlock 후보로 표시됨 | “나중에 배우기” 목록에만 표시 |
| 배경 지식만 있음 | 사전/그래프 탐색만, 출제 안 함 |
| 사용자가 확정하지 않은 low 후보 | 연결 제안 배지지만 저장·출제 안 함 |

## UI 계획

1. 동사 카드에 `Vault 단어` 탐색 탭
2. 표현 상세에 연결된 Vault 노트 링크(`obsidian://open` 또는 브리지)
3. 후보 연결 수락/거절
4. 수락 시 Brain State의 `watchlist` 또는 다음 Unlock pack 후보에만 추가

## 구현 순서

1. Vault 노트 frontmatter 스키마 문서화 (`id`, `word`, `type`, `aliases`)
2. overlay 파서(로컬 REST/브리지 GET)
3. high/medium 자동 링크 + low 후보 큐
4. Active set 게이트와 Unlock pack 연동
5. 그래프에 Vault-only 노드는 다른 스타일로 표시

## 완료 조건

- Vault에 문서가 늘어나도 Starter Active set 출제 범위가 넓어지지 않는다.
- 사용자가 확정한 연결만 앱 학습 재료 후보가 된다.
- `data/*.json` 원본이 Vault sync 때문에 손상되지 않는다.
