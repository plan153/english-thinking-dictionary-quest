#!/usr/bin/env node
/**
 * D1 closeout on PC/Mac — real Obsidian Local REST day loop.
 *
 * Cloud agents cannot reach 127.0.0.1:27123. Run this on the machine
 * where Obsidian + Local REST are open:
 *
 *   OBSIDIAN_API_KEY='...' node scripts/run_day_loop_pc.js
 *
 * Optional:
 *   OBSIDIAN_BASE_URL=http://127.0.0.1:27123
 *   OBSIDIAN_PATH_PREFIX=            # or Project_English
 *   OBSIDIAN_LEARNER_ID=me
 *   OBSIDIAN_SEED_FOLDERS=1          # create missing contract notes (default 1)
 *   SMOKE_APP_PORT=8790
 *
 * Exit: 0 PASS · 1 FAIL · 2 SKIP (no key / Local REST unreachable)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sync = require(path.join(__dirname, '..', 'src', 'domain', 'obsidian-sync.js'));

const ROOT = path.join(__dirname, '..');
const ARTIFACT_DIR = process.env.SMOKE_ARTIFACT_DIR
  || '/opt/cursor/artifacts/day-loop-pc';
const APP_PORT = Number(process.env.SMOKE_APP_PORT || 8790);
const API_KEY = String(process.env.OBSIDIAN_API_KEY || '').trim();
const BASE_URL = String(process.env.OBSIDIAN_BASE_URL || 'http://127.0.0.1:27123').replace(/\/$/, '');
const PATH_PREFIX = String(process.env.OBSIDIAN_PATH_PREFIX || '').replace(/^\/+|\/+$/g, '');
const LEARNER_ID = String(process.env.OBSIDIAN_LEARNER_ID || 'me').trim() || 'me';
const SEED = String(process.env.OBSIDIAN_SEED_FOLDERS || '1') !== '0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function createStaticServer(root, port) {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/') rel = '/index.html';
      const filePath = path.join(root, rel.replace(/^\/+/, ''));
      if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });
  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function waitForToast(page, includes, timeout = 12000) {
  await page.waitForFunction((needle) => {
    const el = document.getElementById('toast');
    if (!el) return false;
    const text = el.textContent || '';
    const visible = el.classList.contains('show') || Number(getComputedStyle(el).opacity) > 0.5;
    return visible && text.includes(needle);
  }, includes, { timeout });
  return page.locator('#toast').innerText();
}

async function pickWorkingPrefix(note) {
  const prefixes = [PATH_PREFIX];
  for (const alt of ['', 'Project_English']) {
    if (!prefixes.includes(alt)) prefixes.push(alt);
  }
  let lastError = null;
  for (const prefix of prefixes) {
    const client = sync.createLocalRestClient({
      adapter: 'local-rest',
      baseUrl: BASE_URL,
      apiKey: API_KEY,
      pathPrefix: prefix,
    });
    try {
      await client.ping();
      if (SEED) {
        const seeds = [
          [`Learners/${LEARNER_ID}/Learning/Progress.md`, `# Progress\n\nseeded by run_day_loop_pc\n`],
          [`Learners/${LEARNER_ID}/Gaps/_keep.md`, `# Gaps keep\n\nseeded by run_day_loop_pc\n`],
          [`Library/Drafts/_keep.md`, `# Drafts keep\n\nseeded by run_day_loop_pc\n`],
          [`Library/Canon/_keep.md`, `# Canon keep\n\nseeded by run_day_loop_pc\n`],
          [`Library/Index.md`, `# Library Index\n\nseeded by run_day_loop_pc\n`],
        ];
        for (const [vaultPath, markdown] of seeds) {
          try {
            await client.putFile(vaultPath, markdown);
          } catch (error) {
            note(`seed warn ${vaultPath}: ${error.message || error}`);
          }
        }
      }
      const report = await sync.verifyVaultContract(client, { learnerId: LEARNER_ID, probe: true });
      note(`pathPrefix=${prefix || '(empty)'} contract=${report.ready ? 'PASS' : 'FAIL'} missing=${(report.missing || []).join(',') || '—'}`);
      if (report.ready) return { prefix, client, report };
      lastError = new Error(`folder contract fail: ${(report.missing || []).join(', ')}`);
    } catch (error) {
      lastError = error;
      note(`pathPrefix=${prefix || '(empty)'} error: ${error.message || error}`);
      if (/ECONNREFUSED|fetch failed|network/i.test(String(error.message || error))) {
        throw error;
      }
    }
  }
  throw lastError || new Error('no working pathPrefix');
}

async function main() {
  ensureDir(ARTIFACT_DIR);
  const log = [];
  const note = (msg) => {
    const line = `[day-loop-pc] ${msg}`;
    console.log(line);
    log.push(line);
  };

  if (!API_KEY) {
    note('SKIP: set OBSIDIAN_API_KEY (Obsidian Local REST key on your Mac).');
    note("Example: OBSIDIAN_API_KEY='...' node scripts/run_day_loop_pc.js");
    note('Cloud agents cannot reach 127.0.0.1:27123 — this closes BACKLOG D1 only on PC.');
    process.exit(2);
  }

  let appServer = null;
  let browser = null;
  try {
    note(`Local REST ${BASE_URL} · learner=${LEARNER_ID}`);
    const { prefix, client, report } = await pickWorkingPrefix(note);
    note(`D2 ok · pathPrefix=${prefix || '(empty)'} · probe=${report.probe?.ok ? 'yes' : 'no'}`);

    appServer = await createStaticServer(ROOT, APP_PORT);
    note(`app http://127.0.0.1:${APP_PORT}`);

    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => {
      const sw = {
        register: async () => ({ unregister: async () => true }),
        getRegistrations: async () => [],
        ready: Promise.resolve({ unregister: async () => true }),
      };
      Object.defineProperty(navigator, 'serviceWorker', { configurable: true, get: () => sw });
    });
    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') note(`console.error: ${msg.text()}`);
    });
    page.on('pageerror', err => note(`pageerror: ${err.message}`));

    await page.goto(`http://127.0.0.1:${APP_PORT}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#startDaily', { timeout: 15000 });
    await page.waitForFunction(() => !!(window.EnglishBrainSync && window.NextPractice), { timeout: 20000 });
    await page.waitForFunction(() => {
      const total = document.getElementById('totalWords');
      return total && Number(total.textContent || 0) >= 40;
    }, { timeout: 30000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-home.png'), fullPage: true });
    note('home ready');

    await page.click('nav button[data-screen="progress"]');
    await page.waitForSelector('#obsidianSyncCard', { timeout: 10000 });
    await page.locator('#obsidianSyncCard').scrollIntoViewIfNeeded();
    await page.selectOption('#syncAdapter', 'local-rest');
    await page.fill('#syncBaseUrl', BASE_URL);
    await page.fill('#syncApiKey', API_KEY);
    await page.fill('#syncPathPrefix', prefix);
    await page.check('#syncAutoAfterGap');
    await page.locator('#saveSyncSettings').click();
    try {
      await waitForToast(page, '설정을 저장', 5000);
    } catch (_) {
      const saved = await page.evaluate(() => window.EnglishBrainSync.loadSettings());
      if (saved.adapter !== 'local-rest' || !saved.autoSyncAfterGap) {
        throw new Error(`settings not saved: ${JSON.stringify(saved)}`);
      }
      note('toast missed but settings persisted');
    }
    await page.click('#testSyncConnection');
    await waitForToast(page, '연결 OK');
    note('sync configured');

    await page.click('#inspectVaultFolders');
    await waitForToast(page, 'Vault', 15000);
    const inspectText = await page.locator('#vaultInspectText').innerText();
    note(`vault inspect: ${inspectText.slice(0, 240)}`);
    if (!/PASS/i.test(inspectText)) {
      throw new Error(`Vault 폴더 검사 FAIL: ${inspectText}`);
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-vault-inspect.png'), fullPage: true });

    await page.click('nav button[data-screen="play"]');
    await page.waitForSelector('#gameModes .start-mode[data-mode="enko"]', { timeout: 10000 });
    await page.click('#gameModes .start-mode[data-mode="enko"]');
    await page.waitForFunction(() => document.getElementById('lesson')?.classList.contains('active'), { timeout: 10000 });
    await page.waitForSelector('#choices .choice', { timeout: 10000 });

    const promptEn = (await page.locator('#questionCard h2').innerText()).trim();
    note(`enko prompt: ${promptEn}`);

    const wrongInfo = await page.evaluate(async (en) => {
      const res = await fetch('./data/expressions.json');
      const list = await res.json();
      const row = list.find(item => item.english === en || item.audioText === en);
      const correctKo = (row?.naturalKorean || '').trim();
      const buttons = [...document.querySelectorAll('#choices .choice')];
      const wrong = buttons.find(btn => (btn.dataset.value || '').trim() !== correctKo);
      if (!wrong) return { correctKo, expressionId: row?.id || '', value: null };
      wrong.click();
      return {
        value: wrong.dataset.value || '',
        correctKo,
        expressionId: row?.id || '',
        english: row?.english || en,
      };
    }, promptEn);
    if (!wrongInfo?.value) throw new Error(`no wrong choice for ${promptEn}`);
    note(`wrong choice → ${wrongInfo.value} (id ${wrongInfo.expressionId})`);

    await page.waitForSelector('.open-gap-form', { timeout: 8000 });
    await page.click('.open-gap-form');
    await page.waitForSelector('#gapGuess', { timeout: 5000 });
    await page.fill('#gapMissed', 'D1 PC day-loop: missed clue');
    await page.fill('#gapModel', 'D1 PC day-loop: model update');
    await page.click('.save-gap-note');
    await waitForToast(page, '간극 기록');
    note('gap saved (auto-sync should PUT to real vault)');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-gap-saved.png'), fullPage: true });

    // Wait for real vault notes
    const deadline = Date.now() + 20000;
    let gapFiles = [];
    let hasNext = false;
    let hasBrain = false;
    while (Date.now() < deadline) {
      gapFiles = await client.listDirectory(`Learners/${LEARNER_ID}/Gaps`);
      const learning = await client.listDirectory(`Learners/${LEARNER_ID}/Learning`);
      hasNext = learning.some(name => String(name).includes('Next Practice'));
      hasBrain = learning.some(name => String(name).includes('Brain State'));
      if (gapFiles.length && hasNext && hasBrain) break;
      await new Promise(r => setTimeout(r, 400));
    }
    note(`vault Gaps=${gapFiles.length} NextPractice=${hasNext} BrainState=${hasBrain}`);
    if (!gapFiles.length || !hasNext || !hasBrain) {
      throw new Error('auto-sync did not write Gap/Next Practice/Brain State to real vault');
    }

    await page.click('#exitLesson');
    await page.click('nav button[data-screen="progress"]');
    await page.waitForSelector('#nextPracticeList', { timeout: 10000 });
    await page.waitForFunction(() => {
      const list = document.getElementById('nextPracticeList');
      return list && !/지금은 제안할 Next Practice가 없어요/.test(list.textContent || '');
    }, { timeout: 15000 });

    await page.locator('#obsidianSyncCard').scrollIntoViewIfNeeded();
    await page.click('#importFromObsidian');
    const importToast = await waitForToast(page, '가져오기 완료');
    note(`import toast: ${importToast.trim()}`);

    await page.click('#startNextPractice');
    await page.waitForFunction(() => document.getElementById('lesson')?.classList.contains('active'), { timeout: 10000 });
    await page.waitForSelector('#questionCard', { timeout: 10000 });
    const lessonText = await page.locator('#questionCard').innerText();
    note(`Next Practice lesson:\n${lessonText.slice(0, 300)}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-next-practice.png'), fullPage: true });

    const snippet = (wrongInfo.english || promptEn).replace(/[.?!]$/, '').slice(0, 10);
    if (!lessonText.includes(snippet) && !lessonText.includes((wrongInfo.correctKo || '').slice(0, 4))) {
      throw new Error(`Next Practice lesson did not match gapped expression: ${lessonText.slice(0, 160)}`);
    }

    const passPath = path.join(ARTIFACT_DIR, 'D1_PASS.json');
    fs.writeFileSync(passPath, JSON.stringify({
      passedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      pathPrefix: prefix,
      learnerId: LEARNER_ID,
      expressionId: wrongInfo.expressionId,
      english: wrongInfo.english,
    }, null, 2));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smoke-log.txt'), `${log.join('\n')}\n`, 'utf8');
    note('D1 DAY-LOOP PASS (real Obsidian Local REST)');
    note(`Wrote ${passPath}`);
    note('Mark BACKLOG D1·D2 complete after this run on your Mac.');
  } catch (error) {
    const message = String(error.message || error);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smoke-log.txt'), `${log.join('\n')}\nERROR: ${error.stack || error}\n`, 'utf8');
    if (/ECONNREFUSED|fetch failed|network/i.test(message)) {
      note('Local REST unreachable. Open Obsidian + Local REST (HTTP 27123) on this PC, then retry.');
      process.exitCode = 2;
    } else {
      console.error(error);
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (appServer) await new Promise(r => appServer.close(r));
  }
}

if (require.main === module) {
  main();
}
