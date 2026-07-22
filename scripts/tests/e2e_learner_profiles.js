/**
 * Learner profile smoke: separate progress notebooks + export paths.
 * Run: node scripts/tests/e2e_learner_profiles.js
 */
const { chromium } = require('playwright');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8767;
const BASE = `http://127.0.0.1:${PORT}`;
const ARTIFACTS = '/opt/cursor/artifacts/qa-learner-profiles';

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

(async () => {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: '/workspace', stdio: 'ignore' });
  await waitForServer(`${BASE}/index.html`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const failures = [];

  try {
    await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#learnerPillName');

    const boot = await page.evaluate(() => ({
      pill: document.getElementById('learnerPillName')?.textContent,
      profiles: JSON.parse(localStorage.getItem('etdLearnerProfiles') || '{}'),
      meKey: !!localStorage.getItem('etdQuestProgress:me'),
      legacy: !!localStorage.getItem('etdQuestProgress'),
    }));
    if (boot.pill !== '나' || boot.profiles.activeLearnerId !== 'me' || !boot.meKey || boot.legacy) {
      failures.push(`boot=${JSON.stringify(boot)}`);
    }

    // Mark progress on default learner
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('etdQuestProgress:me'));
      raw.xp = 42;
      raw.successes = { e001: 3 };
      localStorage.setItem('etdQuestProgress:me', JSON.stringify(raw));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#xp');
    const xpMe = await page.locator('#xp').innerText();
    if (xpMe.trim() !== '42') failures.push(`expected xp 42 got ${xpMe}`);

    // Add second learner
    await page.locator('#learnerPill').click();
    await page.waitForSelector('#newLearnerName');
    await page.fill('#newLearnerName', '민수');
    await page.locator('#addLearnerBtn').click();
    await page.waitForTimeout(500);
    const afterAdd = await page.evaluate(() => ({
      pill: document.getElementById('learnerPillName')?.textContent,
      xp: document.getElementById('xp')?.textContent,
      active: JSON.parse(localStorage.getItem('etdLearnerProfiles') || '{}').activeLearnerId,
      keys: Object.keys(localStorage).filter(k => k.startsWith('etdQuestProgress:')),
    }));
    if (afterAdd.pill !== '민수' || afterAdd.xp.trim() !== '0') {
      failures.push(`afterAdd=${JSON.stringify(afterAdd)}`);
    }

    // Switch back to 나
    await page.selectOption('#learnerSelect', 'me');
    await page.locator('#switchLearnerBtn').click();
    await page.waitForTimeout(400);
    const back = await page.evaluate(() => ({
      pill: document.getElementById('learnerPillName')?.textContent,
      xp: document.getElementById('xp')?.textContent,
    }));
    if (back.pill !== '나' || back.xp.trim() !== '42') failures.push(`back=${JSON.stringify(back)}`);

    // Export paths include Learners/<id>/
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.locator('#exportBrainJson').click(),
    ]);
    const downloadPath = path.join(ARTIFACTS, await download.suggestedFilename());
    await download.saveAs(downloadPath);
    const payload = JSON.parse(fs.readFileSync(downloadPath, 'utf8'));
    const fileKeys = Object.keys(payload.files || {});
    if (!fileKeys.some(k => k.startsWith('Learners/me/'))) {
      failures.push(`export paths missing Learners/me: ${fileKeys.slice(0, 5).join(',')}`);
    }
    if (payload.learnerId !== 'me') failures.push(`learnerId=${payload.learnerId}`);

    // Also verify in-page projection without relying on download alone
    const projected = await page.evaluate(() => {
      const api = window.EnglishBrainMarkdown;
      const files = api.buildExportFiles({
        brainState: { updatedAt: new Date().toISOString(), activeExpressionCount: 40, masteredExpressionCount: 0, openGapIds: [] },
        nextPractice: { updatedAt: new Date().toISOString(), queue: [] },
        progress: { updatedAt: new Date().toISOString(), xp: 0, streak: 0, mineCount: 0, activeExpressionCount: 40, openGapCount: 0 },
        gaps: [],
        learnerId: 'me',
        learnerName: '나',
      });
      return Object.keys(files);
    });
    if (!projected.some(k => k.startsWith('Learners/me/'))) {
      failures.push(`projected keys missing Learners/me: ${projected.join(',')}`);
    }

    await page.screenshot({ path: path.join(ARTIFACTS, 'learner-profiles.png'), fullPage: true });
  } catch (error) {
    failures.push(error.stack || String(error));
    try { await page.screenshot({ path: path.join(ARTIFACTS, 'error.png'), fullPage: true }); } catch {}
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }

  if (failures.length) {
    console.error('FAIL\n' + failures.join('\n'));
    process.exit(1);
  }
  console.log('✅ learner profile e2e passed');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
