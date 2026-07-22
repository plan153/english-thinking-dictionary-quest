/**
 * Tester E2E suite for implemented features through Phase 1.
 * Run: node scripts/tests/e2e_implemented_features.js
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const PORT = 8766;
const BASE = `http://127.0.0.1:${PORT}`;
const ARTIFACTS = '/opt/cursor/artifacts/qa-e2e';
const results = [];

function record(id, title, pass, detail = '') {
  results.push({ id, title, pass: Boolean(pass), detail: String(detail || '') });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${id} ${title}${detail ? ` — ${detail}` : ''}`);
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, res => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) resolve();
          else reject(new Error(`status ${res.statusCode}`));
        });
        req.on('error', reject);
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 250));
    }
  }
  throw new Error(`Server not ready: ${url}`);
}

async function freshPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    try { localStorage.clear(); } catch {}
    try { window.name = ''; } catch {}
  });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const data = window.appState?.dictionaryData;
    return data && (data.isLoaded || data.error);
  }, null, { timeout: 15000 }).catch(() => {});
  // appState may not be global — wait for Active set UI instead
  await page.waitForSelector('#activeSetStats', { timeout: 15000 });
  await page.waitForTimeout(500);
  return { context, page };
}

async function getProgress(page) {
  return page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('etdQuestProgress') || '{}');
    } catch {
      return {};
    }
  });
}

async function openWithProgress(browser, progress, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1280, height: 900 },
    isMobile: Boolean(options.isMobile),
    acceptDownloads: true,
  });
  const page = await context.newPage();
  await page.addInitScript(data => {
    try {
      localStorage.setItem('etdQuestProgress', JSON.stringify(data));
    } catch {}
  }, progress);
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#activeSetStats', { timeout: 15000 });
  await page.waitForTimeout(500);
  return { context, page };
}

(async () => {
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: '/workspace',
    stdio: 'ignore',
  });
  await waitForServer(`${BASE}/index.html`);

  const browser = await chromium.launch({ headless: true });
  let context;
  let page;

  try {
    // --- 1. Home Active Speaking Set summary ---
    ({ context, page } = await freshPage(browser));
    const activeSetText = await page.locator('#activeSetStats').innerText();
    const activePercent = await page.locator('#activeSetPercent').innerText();
    const dailyCopy = await page.locator('#dailyCopy').innerText();
    const mastered = await page.locator('#mastered').innerText();
    const totalWords = await page.locator('#totalWords').innerText();
    await page.screenshot({ path: path.join(ARTIFACTS, '01-home-active-set.png'), fullPage: true });
    record(
      'ASS-01',
      '홈에 Active Speaking Set 요약이 보인다',
      /동사\s*8/.test(activeSetText) && /해금\s*40/.test(activeSetText) && totalWords.trim() === '40',
      `stats=${activeSetText.replace(/\s+/g, ' ')} total=${totalWords} mastered=${mastered} percent=${activePercent}`
    );
    record(
      'ASS-02',
      '데일리 카피에 묻기·답하기 변형이 포함된다',
      dailyCopy.includes('묻기·답하기 변형'),
      dailyCopy
    );

    // --- 2. Unlocked bank size via game mode ---
    const bankInfo = await page.evaluate(async () => {
      // expose via clicking matrix and inspecting lesson length after start
      return {
        hasMatrixCard: !!Array.from(document.querySelectorAll('.mode-card h3')).find(el => el.textContent.includes('묻기')),
        homeModeTitles: Array.from(document.querySelectorAll('#homeModes h3')).map(el => el.textContent.trim()),
      };
    });
    record(
      'MX-01',
      '홈에 묻기·답하기 변형 모드 카드가 있다',
      bankInfo.hasMatrixCard,
      bankInfo.homeModeTitles.join(' | ')
    );

    // Start matrix mode
    await page.locator('#homeModes .mode-card', { hasText: '묻기' }).locator('button.start-mode').click();
    await page.waitForSelector('#lesson.active, #questionCard', { timeout: 10000 });
    await page.waitForTimeout(400);
    const matrixLabel = await page.locator('#questionCard .lesson-label, #questionCard .matrix-form-badge').first().innerText().catch(() => '');
    const matrixBadge = await page.locator('.matrix-form-badge').innerText().catch(() => '');
    const lessonCountText = await page.locator('#lessonProgressText').innerText();
    await page.screenshot({ path: path.join(ARTIFACTS, '02-matrix-mode.png'), fullPage: true });
    record(
      'MX-02',
      '매트릭스 모드가 레슨으로 진입한다',
      /묻기|변형|평서|의문/.test(`${matrixLabel} ${matrixBadge}`) || Number((lessonCountText.split('/')[1] || '0')) >= 4,
      `label=${matrixLabel} badge=${matrixBadge} progress=${lessonCountText}`
    );

    // Answer first matrix form if input present
    const answerVisible = await page.locator('#answerInput').isVisible().catch(() => false);
    if (answerVisible) {
      const expected = await page.evaluate(() => {
        // try to read from hint final or leave empty and use show path
        return null;
      });
      // Use next-hint thrice then check - better: type from known matrices by reading Korean
      const ko = await page.locator('#questionCard h2').innerText();
      // Fill a wrong answer to trigger gap UI
      await page.fill('#answerInput', 'WRONG ANSWER FOR GAP');
      await page.locator('.check-answer').click();
      await page.waitForTimeout(400);
      const gapBtn = page.locator('.open-gap-form');
      const gapVisible = await gapBtn.isVisible().catch(() => false);
      await page.screenshot({ path: path.join(ARTIFACTS, '03-gap-button.png'), fullPage: true });
      record('GAP-01', '오답 후 간극 기록 만들기 버튼이 보인다', gapVisible, `ko=${ko}`);

      if (gapVisible) {
        await gapBtn.click();
        await page.waitForSelector('#gapGuess', { timeout: 5000 });
        await page.fill('#gapMissed', 'some 이 빠짐');
        await page.fill('#gapModel', 'need + some time');
        await page.locator('.save-gap-note').click();
        await page.waitForTimeout(400);
        const progress = await getProgress(page);
        const gaps = progress.gapNotes || [];
        record(
          'GAP-02',
          '간극 기록이 localStorage에 저장된다',
          gaps.length >= 1 && gaps[0].missedClue.includes('some'),
          `count=${gaps.length} id=${gaps[0]?.id || ''}`
        );
      } else {
        record('GAP-02', '간극 기록이 localStorage에 저장된다', false, 'gap button missing');
      }
    } else {
      record('GAP-01', '오답 후 간극 기록 만들기 버튼이 보인다', false, 'answer input missing');
      record('GAP-02', '간극 기록이 localStorage에 저장된다', false, 'skipped');
    }

    // --- 3. Progress screen export + gap list ---
    await page.locator('.nav button[data-screen="progress"]').click();
    await page.waitForSelector('#progress.active', { timeout: 5000 });
    await page.waitForTimeout(300);
    const gapListText = await page.locator('#gapNotesList').innerText();
    const exportMdVisible = await page.locator('#exportBrainMarkdown').isVisible();
    const exportJsonVisible = await page.locator('#exportBrainJson').isVisible();
    await page.screenshot({ path: path.join(ARTIFACTS, '04-progress-gaps.png'), fullPage: true });
    record(
      'GAP-03',
      '내 성장에 간극 목록/내보내기 버튼이 있다',
      exportMdVisible && exportJsonVisible,
      `list=${gapListText.slice(0, 120)}`
    );

    // JSON export download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.locator('#exportBrainJson').click(),
    ]);
    const downloadPath = path.join(ARTIFACTS, await download.suggestedFilename());
    await download.saveAs(downloadPath);
    let jsonOk = false;
    let jsonDetail = '';
    try {
      const payload = JSON.parse(fs.readFileSync(downloadPath, 'utf8'));
      jsonOk = payload.files
        && payload.files['Learning/Brain State.md']
        && payload.files['Learning/Next Practice.md']
        && payload.files['Learning/Progress.md']
        && payload.files['English Brain Index.md'];
      jsonDetail = `files=${Object.keys(payload.files || {}).length} gaps=${(payload.gapNotes || []).length}`;
    } catch (error) {
      jsonDetail = String(error.message || error);
    }
    record('EXP-01', '영어뇌 번들 JSON에 Brain State/Next Practice/Progress가 있다', jsonOk, jsonDetail);

    // Markdown export triggers at least one download
    let mdDownloadCount = 0;
    page.on('download', async d => {
      mdDownloadCount += 1;
      const p = path.join(ARTIFACTS, `md-${mdDownloadCount}-${(await d.suggestedFilename()).replace(/\//g, '_')}`);
      try { await d.saveAs(p); } catch {}
    });
    await page.locator('#exportBrainMarkdown').click();
    await page.waitForTimeout(2500);
    record('EXP-02', 'Markdown 내보내기가 하나 이상 다운로드된다', mdDownloadCount >= 1, `count=${mdDownloadCount}`);

    // --- 4. Dictionary locked expressions ---
    await page.goto(`${BASE}/index.html#/dictionary?view=verbs`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    // ensure verbs view
    const verbsTab = page.locator('.dictionary-tab[data-dictionary-view="verbs"]');
    if (await verbsTab.isVisible().catch(() => false)) await verbsTab.click();
    await page.waitForSelector('.verb-chip', { timeout: 10000 });
    await page.waitForTimeout(400);
    // pick a non-active verb if present (be/do/give...)
    const lockedVerb = page.locator('.verb-chip.locked').first();
    const hasLockedVerb = await lockedVerb.count();
    if (hasLockedVerb) {
      await lockedVerb.click();
      await page.waitForTimeout(300);
      const expressionsTab = page.locator('.dictionary-tab[data-dictionary-view="expressions"]');
      if (await expressionsTab.isVisible().catch(() => false)) await expressionsTab.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(ARTIFACTS, '05-dictionary-lock.png'), fullPage: true });
    const lockedExpr = await page.locator('.expression-item.locked').count();
    const lockedVerbCount = await page.locator('.verb-chip.locked').count();
    record(
      'ASS-03',
      '동사 카드에 잠긴 동사/표현 표시가 있다',
      lockedVerbCount > 0 || lockedExpr > 0,
      `lockedVerbs=${lockedVerbCount} lockedExpr=${lockedExpr}`
    );

    // Active verb should allow quiz
    const activeVerb = page.locator('.verb-chip:not(.locked)').first();
    if (await activeVerb.count()) {
      await activeVerb.click();
      await page.waitForTimeout(200);
      const expressionsTab2 = page.locator('.dictionary-tab[data-dictionary-view="expressions"]');
      await expressionsTab2.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
      // Prefer quiz button on detail panel if visible
      const quizBtn = page.locator('.quiz-expression:not([disabled])').first();
      if (await quizBtn.isVisible().catch(() => false)) {
        await quizBtn.click();
        await page.waitForTimeout(1000);
        const onLesson = await page.locator('#lesson.active').isVisible().catch(() => false);
        record('ASS-04', '해금 표현은 퀴즈(듣기)로 진입할 수 있다', onLesson, `via=quiz-button lesson=${onLesson}`);
      } else {
        const unlockedExpr = page.locator('#expressionExplorerList .expression-item:not(.locked)').first();
        await unlockedExpr.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        if (await unlockedExpr.isVisible().catch(() => false)) {
          await unlockedExpr.click();
          await page.waitForTimeout(1000);
          const onLesson = await page.locator('#lesson.active').isVisible().catch(() => false);
          record('ASS-04', '해금 표현은 퀴즈(듣기)로 진입할 수 있다', onLesson, `via=expression-item lesson=${onLesson}`);
        } else {
          // fallback: start review mode with known unlocked id
          await page.goto(`${BASE}/index.html#/quiz/e001?mode=listen`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(800);
          const onLesson = await page.locator('#lesson.active').isVisible().catch(() => false);
          record('ASS-04', '해금 표현은 퀴즈(듣기)로 진입할 수 있다', onLesson, `via=hash-fallback lesson=${onLesson}`);
        }
      }
    } else {
      record('ASS-04', '해금 표현은 퀴즈(듣기)로 진입할 수 있다', false, 'no active verb chip');
    }

    // --- 5. Daily quest includes matrix step ---
    await context.close();
    ({ context, page } = await freshPage(browser));
    await page.locator('#startDaily').click();
    await page.waitForSelector('#lesson.active', { timeout: 10000 });
    await page.waitForTimeout(400);
    // Force regenerate quest by clearing and inspecting progress after ensure
    const questPlan = await page.evaluate(() => {
      const raw = localStorage.getItem('etdQuestProgress');
      const progress = raw ? JSON.parse(raw) : {};
      return progress.dailyQuestV1 || {};
    });
    // May need to go home to ensure quest created - startDaily should have created it
    const steps = questPlan.stepPlan || [];
    const hasMatrixStep = steps.some(step => step.mode === 'matrix' || /묻기/.test(step.label || ''));
    await page.screenshot({ path: path.join(ARTIFACTS, '06-daily-quest.png'), fullPage: true });
    record(
      'DQ-01',
      '오늘의 퀘스트 stepPlan에 matrix 스텝이 있다',
      hasMatrixStep && steps.length === 7,
      `version=${questPlan.version} steps=${steps.map(s => `${s.key}:${s.mode}`).join(',')}`
    );

    // --- 6. Unlock pack logic (seed successes before first paint) ---
    await context.close();
    {
      const starter = [
        'e001','e003','e068','e002','e044','e009','e005','e006','e018','e026','e069','e015','e047','e048','e035','e038',
        'e021','e030','e083','e074','e045','e061','e020','e039','e022','e004','e014','e090','e046','e033','e036','e024',
        'e019','e070','e075','e079','e031','e037','e025','e029'
      ];
      const unlockProgress = {
        xp: 0, streak: 0, lastStudyDate: null, successes: {}, attempts: {}, skipped: {}, recentExpressionIds: [],
        daily: { date: null, done: [] },
        dailyQuestV1: { version: 3, date: null, stepPlan: [], currentIndex: 0, completedStepKeys: [], startedAt: null, finishedAt: null, isCompleted: false },
        settings: { soundEnabled: true, seenConnectionGuide: true },
        historyByExpressionId: {},
        curriculum: { unlockedPackCount: 0, lastUnlockAt: null },
        gapNotes: [],
      };
      starter.slice(0, 28).forEach(id => { unlockProgress.successes[id] = 3; });
      ({ context, page } = await openWithProgress(browser, unlockProgress));
    }
    await page.waitForTimeout(800);
    await page.locator('.nav button[data-screen="progress"]').click();
    await page.waitForTimeout(400);
    await page.locator('.nav button[data-screen="home"]').click();
    await page.waitForTimeout(600);
    const afterUnlock = await getProgress(page);
    const unlockedCountText = await page.locator('#totalWords').innerText();
    const unlockedPack = afterUnlock.curriculum?.unlockedPackCount || 0;
    await page.screenshot({ path: path.join(ARTIFACTS, '07-unlock-pack.png'), fullPage: true });
    record(
      'ASS-05',
      '내 표현 70% 도달 시 Unlock pack이 열린다',
      unlockedPack >= 1 && Number(unlockedCountText) >= 50,
      `pack=${unlockedPack} totalWords=${unlockedCountText} successes=${Object.keys(afterUnlock.successes || {}).length}`
    );

    // --- 7. Open gap boosts review priority ---
    await context.close();
    ({ context, page } = await openWithProgress(browser, {
      xp: 0, streak: 0, successes: {}, attempts: {}, skipped: {}, recentExpressionIds: [],
      daily: { date: null, done: [] },
      dailyQuestV1: { version: 3, date: null, stepPlan: [], currentIndex: 0, completedStepKeys: [] },
      settings: { soundEnabled: true, seenConnectionGuide: true },
      historyByExpressionId: {
        e002: {
          lastAttemptedAt: new Date().toISOString(),
          lastOutcome: 'retry',
          timesSeen: 1,
          timesCorrect: 0,
          reviewPriority: 8,
          lastHintLevel: 0,
          connections: {
            recognition: { strength: 0, updatedAt: null },
            assembly: { strength: 0, updatedAt: null },
            output: { strength: 0, updatedAt: null },
          },
        },
      },
      curriculum: { unlockedPackCount: 0 },
      gapNotes: [{
        id: 'gap_e002_test',
        expressionId: 'e002',
        english: 'I need some time.',
        guess: 'I need time',
        status: 'open',
        mode: 'koen',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
    }));
    await page.locator('.nav button[data-screen="progress"]').click();
    await page.waitForTimeout(800);
    const reviewText = await page.locator('#reviewList').innerText();
    await page.screenshot({ path: path.join(ARTIFACTS, '08-review-gap-boost.png'), fullPage: true });
    record(
      'GAP-04',
      '열린 간극 표현이 복습 추천에 우선 노출된다',
      /I need some time/i.test(reviewText) || /need some time/i.test(reviewText),
      reviewText.slice(0, 160)
    );

    // --- 8. Mobile smoke ---
    await context.close();
    context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    page = await context.newPage();
    await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
    await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#activeSetStats', { timeout: 15000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    await page.screenshot({ path: path.join(ARTIFACTS, '09-mobile-home.png'), fullPage: true });
    record('UI-01', '모바일 홈에서 가로 오버플로가 없다', !overflow, `scrollWidth check overflow=${overflow}`);

  } catch (error) {
    record('RUN', '테스트 러너 예외 없음', false, error.stack || String(error));
    try {
      if (page) await page.screenshot({ path: path.join(ARTIFACTS, 'zz-error.png'), fullPage: true });
    } catch {}
  } finally {
    try { await context?.close(); } catch {}
    await browser.close();
    server.kill('SIGTERM');
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    passed,
    failed,
    total: results.length,
    results,
  };
  fs.writeFileSync(path.join(ARTIFACTS, 'report.json'), JSON.stringify(report, null, 2));

  const md = [
    '# QA E2E Report — Implemented Features',
    '',
    `- When: ${report.generatedAt}`,
    `- URL: ${BASE}/index.html`,
    `- Result: **${passed} passed / ${failed} failed / ${results.length} total**`,
    '',
    '| ID | Case | Result | Detail |',
    '|---|---|---|---|',
    ...results.map(r => `| ${r.id} | ${r.title} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |`),
    '',
    '## Screenshots',
    ...fs.readdirSync(ARTIFACTS).filter(f => f.endsWith('.png')).sort().map(f => `- ${f}`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ARTIFACTS, 'REPORT.md'), md);
  fs.writeFileSync('/workspace/docs/QA_IMPLEMENTED_FEATURES_E2E.md', md);

  console.log('\n' + md);
  process.exit(failed ? 1 : 0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
