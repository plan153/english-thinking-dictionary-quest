#!/usr/bin/env node
/**
 * Browser smoke: mock Local REST → sync → import → Next Practice start.
 * Usage: node scripts/smoke_browser_sync_next_practice.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const ARTIFACT_DIR = process.env.SMOKE_ARTIFACT_DIR
  || '/opt/cursor/artifacts/browser-smoke';
const APP_PORT = Number(process.env.SMOKE_APP_PORT || 8766);
const REST_PORT = Number(process.env.SMOKE_REST_PORT || 27123);
const API_KEY = 'smoke-test-key';

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

function createMockLocalRest(port, apiKey) {
  /** @type {Map<string, string>} */
  const vault = new Map();
  // Seed importable Next Practice + Brain State + one Gap under Learners/me
  vault.set('Learners/me/Learning/Next Practice.md', `---
type: next-practice
updatedAt: 2026-07-22T12:00:00Z
queue:
  - { expressionId: e001, mode: listen, reason: smoke-vault }
  - { expressionId: e002, mode: koen, reason: smoke-vault }
source: vault
---

# Next Practice
`);
  vault.set('Learners/me/Learning/Brain State.md', `---
type: brain-state
updatedAt: 2026-07-22T12:00:00Z
activeVerbIds: [v_have, v_get]
weakSlots:
  - { expressionId: e003, reason: smoke-weak }
unlockReady: false
source: vault
---

# Brain State

## 열린 간극
- [[Gaps/gap_smoke_e001]]
`);
  vault.set('Learners/me/Gaps/gap_smoke_e001.md', `---
type: gap-note
id: gap_smoke_e001
vaultPath: Learners/me/Gaps/gap_smoke_e001.md
expressionId: e001
mode: koen
createdAt: 2026-07-22T11:00:00Z
updatedAt: 2026-07-22T12:30:00Z
status: open
source: vault
---

# Gap · I have a question.

## 내 추측
I have question

## 실제 의미 / 정답
I have a question.
- 한국어: 질문이 있어요.

## 놓친 단서
a

## 모델 업데이트
have + a question
`);

  const stats = { puts: 0, gets: 0, lists: 0, pings: 0 };

  function unauthorized(res) {
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('unauthorized');
  }

  function checkAuth(req) {
    const header = req.headers.authorization || '';
    return header === `Bearer ${apiKey}`;
  }

  function vaultKeyFromUrl(urlPath) {
    // /vault/Learners%2Fme%2F... or /vault/Learners/me/...
    const raw = urlPath.replace(/^\/vault\/?/, '');
    return decodeURIComponent(raw).replace(/\/+$/, '');
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
      const body = Buffer.concat(chunks).toString('utf8');
      vault.set(key, body);
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

async function main() {
  ensureDir(ARTIFACT_DIR);
  const log = [];
  const note = (msg) => {
    const line = `[smoke] ${msg}`;
    console.log(line);
    log.push(line);
  };

  const appServer = await createStaticServer(ROOT, APP_PORT);
  const rest = await createMockLocalRest(REST_PORT, API_KEY);
  note(`app http://127.0.0.1:${APP_PORT}`);
  note(`mock Local REST http://127.0.0.1:${REST_PORT}`);

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
  page.on('requestfailed', req => note(`requestfailed: ${req.url()} ${req.failure()?.errorText || ''}`));

  try {
    await page.goto(`http://127.0.0.1:${APP_PORT}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#startDaily', { timeout: 15000 });
    await page.waitForFunction(() => !!(window.EnglishBrainSync && window.NextPractice && window.ThinkingMapSets), { timeout: 20000 });
    await page.waitForFunction(() => {
      const total = document.getElementById('totalWords');
      return total && Number(total.textContent || 0) >= 40;
    }, { timeout: 30000 });
    const unlockedShown = await page.locator('#totalWords').innerText();
    note(`unlocked count shown: ${unlockedShown}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-home.png'), fullPage: true });
    note('home loaded (ASS unlocked count ready)');

    // Open progress screen
    await page.click('nav button[data-screen="progress"]');
    await page.waitForSelector('#nextPracticeCard', { timeout: 10000 });
    await page.waitForSelector('#obsidianSyncCard', { timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-progress.png'), fullPage: true });

    // Configure Local REST
    await page.locator('#obsidianSyncCard').scrollIntoViewIfNeeded();
    await page.selectOption('#syncAdapter', 'local-rest');
    await page.fill('#syncBaseUrl', `http://127.0.0.1:${REST_PORT}`);
    await page.fill('#syncApiKey', API_KEY);
    await page.fill('#syncPathPrefix', '');
    await page.locator('#saveSyncSettings').click();
    try {
      await waitForToast(page, '설정을 저장', 5000);
    } catch (_) {
      // Fallback: verify settings persisted even if toast timing is flaky.
      const saved = await page.evaluate(() => window.EnglishBrainSync.loadSettings());
      if (saved.adapter !== 'local-rest' || saved.apiKey !== 'smoke-test-key') {
        throw new Error(`settings not saved: ${JSON.stringify(saved)}`);
      }
      note('toast missed but settings persisted');
    }
    note('sync settings saved');

    await page.click('#testSyncConnection');
    const pingToast = await waitForToast(page, '연결 OK');
    note(`ping toast: ${pingToast.trim()}`);
    if (!/연결 OK/i.test(pingToast)) throw new Error(`unexpected ping toast: ${pingToast}`);

    // Import Vault queue BEFORE sync so seeded Next Practice is not overwritten first.
    await page.click('#importFromObsidian');
    const importToast = await waitForToast(page, '가져오기 완료');
    note(`import toast: ${importToast.trim()}`);
    if (!/Gaps|Next Practice|Brain/i.test(importToast)) {
      throw new Error(`unexpected import toast: ${importToast}`);
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-after-import.png'), fullPage: true });

    // Next Practice list should include vault-seeded e001 with real English label
    await page.waitForFunction(() => {
      const list = document.getElementById('nextPracticeList');
      return list && /I have a question/i.test(list.textContent || '');
    }, { timeout: 15000 });
    const nextHtml = await page.locator('#nextPracticeList').innerText();
    note(`next practice list:\n${nextHtml.slice(0, 400)}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-next-practice-list.png'), fullPage: true });

    await page.click('#startNextPractice');
    await page.waitForFunction(() => {
      const lesson = document.getElementById('lesson');
      return lesson && lesson.classList.contains('active');
    }, { timeout: 10000 });
    await page.waitForSelector('#questionCard', { timeout: 10000 });
    const lessonText = await page.locator('#questionCard').innerText();
    note(`lesson started:\n${lessonText.slice(0, 300)}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05-next-practice-lesson.png'), fullPage: true });
    if (!/I have a question|have a question|질문/i.test(lessonText)) {
      throw new Error(`lesson did not look like vault Next Practice item e001: ${lessonText.slice(0, 160)}`);
    }

    await page.click('#exitLesson');
    await page.click('nav button[data-screen="progress"]');
    await page.waitForSelector('#syncToObsidian', { timeout: 10000 });
    await page.click('#syncToObsidian');
    const syncToast = await waitForToast(page, '동기화');
    note(`sync toast: ${syncToast.trim()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06-after-sync.png'), fullPage: true });
    if (rest.stats.puts < 1) throw new Error(`expected PUT upserts, got ${rest.stats.puts}`);
    note(`vault files after sync: ${rest.vault.size}, puts=${rest.stats.puts}`);
    if (![...rest.vault.keys()].some(key => key.includes('Learners/me/Learning/Brain State.md'))) {
      throw new Error('sync did not write Learners/me Brain State');
    }

    // Graph shortcut smoke on thinking map — pick an ASS-unlocked example (map frames vary).
    await page.click('nav button[data-screen="map"]');
    await page.waitForSelector('#thinkingMap', { timeout: 10000 });
    await page.waitForSelector('#mapFilters [data-map="have"]', { timeout: 10000 });
    await page.click('#mapFilters [data-map="have"]');
    await page.waitForSelector('#thinkingMap [data-map-example-en="I have a question."]', { timeout: 10000 });
    await page.click('#thinkingMap [data-map-example-en="I have a question."]');
    await page.waitForSelector('#thinkingMap [data-map-example-practice="I have a question."][data-mode="listen"]', { timeout: 10000 });
    await page.click('#thinkingMap [data-map-example-practice="I have a question."][data-mode="listen"]');
    await page.waitForFunction(() => document.getElementById('lesson')?.classList.contains('active'), { timeout: 10000 });
    note('graph shortcut listen started (have · I have a question.)');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07-graph-shortcut-lesson.png'), fullPage: true });

    fs.writeFileSync(path.join(ARTIFACT_DIR, 'smoke-log.txt'), `${log.join('\n')}\n`, 'utf8');
    note('SMOKE PASS');
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
