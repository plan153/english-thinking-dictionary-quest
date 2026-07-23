# 구동사 Speaking Set (Phrasal Verbs)

> 상태: **앱 메뉴 연동됨 (v1.1.7)** — Unlock pack ≥1 이면 구동사 화면이 열림. 기본 `getUnlockedBank()`에는 합류하지 않음.


단일동사 Active Speaking Set과 **분리된** 커리큘럼이다.  
입자(back/up/on/off/out/to…)가 의미를 바꾸는 표현만 모은다.

## 규칙

1. **잠금 기본값:** Starter만 열린 동안 구동사 메뉴는 잠긴다.
2. **해금:** 표현 Unlock pack 1개 이상(`unlockedPackCount >= 1`)이면 메뉴가 열린다.
3. **출제 분리:** 해금 전·후에도 구동사는 기본 `getUnlockedBank()`에 자동 합류하지 않는다. **구동사 메뉴·구동사 연습**에서만 따로 구성한다.
4. **단일동사 비중과 혼동하지 말 것:** Starter 목표 비중은 have 40% · get 25% · take 15% · 나머지 20% (단일동사 카드 기준).

## 그룹 (v0)

| 그룹 | 핵심 | 표현 ID |
| --- | --- | --- |
| get + 장소 | get to / 도착 | e081, e085, e086, e087 |
| come back / come up | 돌아옴 · 일이 생김 | e048, e061 |
| go on / go by | 진행 · 수단 | e047, e079 |
| put on / put off | 입히기 · 미루기 | e052, e053, e078 |
| keep in touch | 연락 유지 | e056 |
| find out | 알아내다 | e063 |
| make sure | 확인하다 | e034 |

데이터 SoT: `data/phrasal-verbs.json` · `learning-paths.json` → `phrasalSpeakingSet`.

## 학습 순서 (해금 후)

1. get + 장소 (이동·도착)
2. come / go 입자
3. put on·off
4. keep in / find out / make sure

같은 입자로 평서·의문·부정을 돌려 보고, 단일동사 have/get/take 코어와 섞어 하루 루프를 늘리지 않는다.
