#!/usr/bin/env node
/**
 * Day-loop browser smoke (mock Local REST):
 * lesson → wrong answer → gap save → auto-sync → import → Next Practice
 *
 * Usage: node scripts/smoke_day_loop.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const ARTIFACT_DIR = process.env.SMOKE_ARTIFACT_DIR
  || '/opt/cursor/artifacts/day-loop-smoke';
const APP_PORT = Number(process.env.SMOKE_APP_PORT || 8767);
const REST_PORT = Number(process.env.SMOKE_REST_PORT || 27124);
const API_KEY = 'day-loop-smoke-key';

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

function createEmptyMockLocalRest(port, apiKey) {
  /** @type {Map<string, string>} */
  const vault = new Map();
  const stats = { puts: 0, gets: 0, lists: 0, pings: 0 };

  function unauthorized(res) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('unauthorized');
  }

  function checkAuth(req) {
    return (req.headers.authorization || '') === `Bearer ${apiKey}`;
  }

  function vaultKeyFromUrl(urlPath) {
    return decodeURIComponent(urlPath.replace(/^\/vault\/?/, '')).replace(/\/+$/, '');
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (!checkAuth(req)) return unauthorized(res);

    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    if (url.pathname === '/' && req.method === 'GET') {
      stats.pings += 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'OK', authenticated: true, service: 'mock-local-rest' }));
      return;
    }
    if (!url.pathname.startsWith('/vault')) {
      res.writeHead(404);
      res.end('not found');
      return;
    }

    const asDirectory = url.pathname.endsWith('/');
    const key = vaultKeyFromUrl(url.pathname);

    if (req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      vault.set(key, Buffer.concat(chunks).toString('utf8'));
      stats.puts += 1;
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && asDirectory) {
      stats.lists += 1;
      const prefix = key ? `${key}/` : '';
      const files = [...vault.keys()]
        .filter(name => name.startsWith(prefix))
        .map(name => name.slice(prefix.length))
        .filter(name => name && !name.includes('/'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
      return;
    }

    if (req.method === 'GET') {
      stats.gets += 1;
      if (!vault.has(key)) {
        res.writeHead(404);
        res.end('missing');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
      res.end(vault.get(key));
      return;
    }

    res.writeHead(405);
    res.end('method');
  });

  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => resolve({ server, vault, stats }));
  });
}

async function waitForToast(page, includes, timeout = 8000) {
  await page.waitForFunction((needle) => {
    const el = document.getElementById('toast');
    if (!el) return false;
    const text = el.textContent || '';
    const visible = el.classList.contains('show') || Number(getComputedStyle(el).opacity) > 0.5;
    return visible && text.includes(needle);
  }, includes, { timeout });
  return page.locator('#toast').innerText();
}

async function waitForPuts(rest, before, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (rest.stats.puts <= before && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 150));
  }
  return rest.stats.puts;
}

async function main() {
  ensureDir(ARTIFACT_DIR);
  const log = [];
  const note = (msg) => {
    const line = `[day-loop] ${msg}`;
    console.log(line);
    log.push(line);
  };

  const appServer = await createStaticServer(ROOT, APP_PORT);
  const rest = await createEmptyMockLocalRest(REST_PORT, API_KEY);
  note(`app http://127.0.0.1:${APP_PORT}`);
  note(`mock Local REST http://127.0.0.1:${REST_PORT} (empty vault)`);

  const browser = await chromium.launch({
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

  try {
    await page.goto(`http://127.0.0.1:${APP_PORT}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#startDaily', { timeout: 15000 });
    await page.waitForFunction(() => !!(window.EnglishBrainSync && window.NextPractice), { timeout: 20000 });
    await page.waitForFunction(() => {
      const total = document.getElementById('totalWords');
      return total && Number(total.textContent || 0) >= 40;
    }, { timeout: 30000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-home.png'), fullPage: true });
    note('home ready');

    // Configure Local REST + auto-sync after gap
    await page.click('nav button[data-screen="progress"]');
    await page.waitForSelector('#obsidianSyncCard', { timeout: 10000 });
    await page.locator('#obsidianSyncCard').scrollIntoViewIfNeeded();
    await page.selectOption('#syncAdapter', 'local-rest');
    await page.fill('#syncBaseUrl', `http://127.0.0.1:${REST_PORT}`);
    await page.fill('#syncApiKey', API_KEY);
    await page.fill('#syncPathPrefix', '');
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
    note('sync configured with autoSyncAfterGap');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-sync-settings.png'), fullPage: true });

    // Lesson: English → meaning (multiple choice) on play screen
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
    await page.fill('#gapMissed', 'day-loop smoke: missed clue');
    await page.fill('#gapModel', 'day-loop smoke: model update');
    const putsBefore = rest.stats.puts;
    await page.click('.save-gap-note');
    await waitForToast(page, '간극 기록');
    note('gap saved');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-gap-saved.png'), fullPage: true });

    const putsAfter = await waitForPuts(rest, putsBefore, 15000);
    if (putsAfter <= putsBefore) {
      throw new Error(`auto-sync did not PUT after gap (puts=${putsAfter})`);
    }
    note(`auto-sync puts=${putsAfter} (was ${putsBefore})`);
    const vaultKeys = [...rest.vault.keys()];
    note(`vault keys: ${vaultKeys.join(', ')}`);
    if (!vaultKeys.some(key => /Learners\/me\/Gaps\//.test(key))) {
      throw new Error('auto-sync did not write a Gap note');
    }
    if (!vaultKeys.some(key => key.includes('Learners/me/Learning/Next Practice.md'))) {
      throw new Error('auto-sync did not write Next Practice');
    }
    if (!vaultKeys.some(key => key.includes('Learners/me/Learning/Brain State.md'))) {
      throw new Error('auto-sync did not write Brain State');
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-after-autosync.png'), fullPage: true });

    // Progress: Next Practice from open gap
    await page.click('#exitLesson');
    await page.click('nav button[data-screen="progress"]');
    await page.waitForSelector('#nextPracticeList', { timeout: 10000 });
    await page.waitForFunction(() => {
      const list = document.getElementById('nextPracticeList');
      return list && !/지금은 제안할 Next Practice가 없어요/.test(list.textContent || '');
    }, { timeout: 15000 });
    const nextList = await page.locator('#nextPracticeList').innerText();
    note(`next practice before import:\n${nextList.slice(0, 400)}`);
    if (!nextList.includes('열린 간극') && !nextList.includes(wrongInfo.english) && !nextList.includes(wrongInfo.expressionId)) {
      throw new Error(`Next Practice missing open-gap item: ${nextList.slice(0, 240)}`);
    }

    // Import Vault notes written by auto-sync
    await page.locator('#obsidianSyncCard').scrollIntoViewIfNeeded();
    await page.click('#importFromObsidian');
    const importToast = await waitForToast(page, '가져오기 완료');
    note(`import toast: ${importToast.trim()}`);
    if (!/Gaps|Next Practice|Brain/i.test(importToast)) {
      throw new Error(`unexpected import toast: ${importToast}`);
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-after-import.png'), fullPage: true });

    await page.waitForFunction(() => {
      const list = document.getElementById('nextPracticeList');
      return list && list.textContent && !/지금은 제안할 Next Practice가 없어요/.test(list.textContent);
    }, { timeout: 15000 });
    const afterImport = await page.locator('#nextPracticeList').innerText();
    note(`next practice after import:\n${afterImport.slice(0, 400)}`);

    await page.click('#startNextPractice');
    await page.waitForFunction(() => document.getElementById('lesson')?.classList.contains('active'), { timeout: 10000 });
    await page.waitForSelector('#questionCard', { timeout: 10000 });
    const lessonText = await page.locator('#questionCard').innerText();
    note(`Next Practice lesson:\n${lessonText.slice(0, 300)}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-next-practice-lesson.png'), fullPage: true });

    const snippet = (wrongInfo.english || promptEn).replace(/[.?!]$/, '').slice(0, 10);
    if (!lessonText.includes(snippet) && !lessonText.includes((wrongInfo.correctKo || '').slice(0, 4))) {
      throw new Error(`Next Practice lesson did not match gapped expression (${wrongInfo.expressionId}): ${lessonText.slice(0, 160)}`);
    }

    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smoke-log.txt'), `${log.join('\n')}\n`, 'utf8');
    note('DAY-LOOP SMOKE PASS');
  } catch (error) {
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'FAIL.png'), fullPage: true }).catch(() => {});
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smoke-log.txt'), `${log.join('\n')}\nERROR: ${error.stack || error}\n`, 'utf8');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
    await new Promise(r => appServer.close(r));
    await new Promise(r => rest.server.close(r));
  }
}

if (require.main === module) {
  main();
}
