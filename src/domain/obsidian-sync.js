/**
 * Obsidian English-brain SyncAdapter.
 * Adapters: download (fallback), local-rest (Phase 3).
 * API keys stay in localStorage only — never commit secrets.
 * Browser: window.EnglishBrainSync
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.EnglishBrainSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SETTINGS_KEY = 'etdObsidianSyncSettings';
  const QUEUE_KEY = 'etdObsidianSyncQueue';
  const MAX_QUEUE = 80;
  const MAX_ATTEMPTS = 5;

  function defaultSettings() {
    return {
      adapter: 'download', // download | local-rest
      baseUrl: 'http://127.0.0.1:27123',
      apiKey: '',
      pathPrefix: '', // e.g. Project_English when vault root is parent
      autoSyncAfterGap: false,
      lastSyncAt: null,
      lastSyncError: null,
      lastImportAt: null,
    };
  }

  function normalizeSettings(raw) {
    const base = defaultSettings();
    const src = raw && typeof raw === 'object' ? raw : {};
    const adapter = src.adapter === 'local-rest' ? 'local-rest' : 'download';
    return {
      ...base,
      ...src,
      adapter,
      baseUrl: String(src.baseUrl || base.baseUrl).replace(/\/$/, ''),
      apiKey: String(src.apiKey || ''),
      pathPrefix: String(src.pathPrefix || '').replace(/^\/+|\/+$/g, ''),
      autoSyncAfterGap: Boolean(src.autoSyncAfterGap),
    };
  }

  function loadSettings(storage) {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return defaultSettings();
    try {
      const raw = store.getItem(SETTINGS_KEY);
      return normalizeSettings(raw ? JSON.parse(raw) : null);
    } catch (_) {
      return defaultSettings();
    }
  }

  function saveSettings(settings, storage) {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const normalized = normalizeSettings(settings);
    if (store) store.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function loadQueue(storage) {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return [];
    try {
      const raw = store.getItem(QUEUE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  function saveQueue(queue, storage) {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const trimmed = (Array.isArray(queue) ? queue : []).slice(0, MAX_QUEUE);
    if (store) store.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }

  function enqueueUpsert(job, storage) {
    const queue = loadQueue(storage);
    const path = job.path;
    const existing = queue.findIndex(item => item.path === path && item.type === 'upsert');
    const entry = {
      type: 'upsert',
      path,
      markdown: job.markdown,
      attempts: job.attempts || 0,
      lastError: job.lastError || null,
      updatedAt: new Date().toISOString(),
    };
    if (existing >= 0) queue[existing] = { ...queue[existing], ...entry };
    else queue.unshift(entry);
    return saveQueue(queue, storage);
  }

  function withPrefix(pathPrefix, vaultPath) {
    const clean = String(vaultPath || '').replace(/^\/+/, '');
    if (!pathPrefix) return clean;
    if (clean.startsWith(`${pathPrefix}/`) || clean === pathPrefix) return clean;
    return `${pathPrefix}/${clean}`;
  }

  function encodeVaultPath(path) {
    return String(path || '')
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');
  }

  function createLocalRestClient(settings, fetchImpl) {
    const cfg = normalizeSettings(settings);
    const fetchFn = fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    if (!fetchFn) throw new Error('fetch is not available');

    async function request(method, vaultPath, options = {}) {
      const fullPath = withPrefix(cfg.pathPrefix, vaultPath);
      const url = `${cfg.baseUrl}/vault/${encodeVaultPath(fullPath)}${options.asDirectory ? '/' : ''}`;
      const headers = {
        Authorization: `Bearer ${cfg.apiKey}`,
        ...(options.headers || {}),
      };
      if (options.body != null && !headers['Content-Type']) {
        headers['Content-Type'] = 'text/markdown';
      }
      const response = await fetchFn(url, {
        method,
        headers,
        body: options.body,
      });
      return response;
    }

    return {
      settings: cfg,
      async ping() {
        const url = `${cfg.baseUrl}/`;
        const response = await fetchFn(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
        });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Local REST ping failed (${response.status}): ${text.slice(0, 160)}`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return response.json();
        return { ok: true, status: response.status };
      },
      async putFile(vaultPath, markdown) {
        const response = await request('PUT', vaultPath, { body: markdown });
        if (!(response.status === 200 || response.status === 204)) {
          const text = await response.text().catch(() => '');
          throw new Error(`PUT ${vaultPath} failed (${response.status}): ${text.slice(0, 200)}`);
        }
        return true;
      },
      async getFile(vaultPath) {
        const response = await request('GET', vaultPath, {
          headers: { Accept: 'text/markdown' },
        });
        if (response.status === 404) return null;
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`GET ${vaultPath} failed (${response.status}): ${text.slice(0, 200)}`);
        }
        return response.text();
      },
      async listDirectory(vaultDir) {
        const response = await request('GET', vaultDir.replace(/\/?$/, ''), { asDirectory: true });
        if (response.status === 404) return [];
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`LIST ${vaultDir} failed (${response.status}): ${text.slice(0, 200)}`);
        }
        const data = await response.json();
        return Array.isArray(data.files) ? data.files : [];
      },
    };
  }

  function parseFrontmatter(markdown) {
    const text = String(markdown || '');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { attributes: {}, body: text };
    const raw = match[1];
    const body = match[2] || '';
    const attributes = {};
    raw.split(/\r?\n/).forEach(line => {
      const idx = line.indexOf(':');
      if (idx < 0) return;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (!key) return;
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        try { value = JSON.parse(value.replace(/^'/, '"').replace(/'$/, '"')); } catch (_) { value = value.slice(1, -1); }
      }
      attributes[key] = value;
    });
    return { attributes, body };
  }

  function sectionAfterHeading(body, heading) {
    const lines = String(body || '').split(/\r?\n/);
    const start = lines.findIndex(line => line.trim() === `## ${heading}`);
    if (start < 0) return '';
    const chunk = [];
    for (let i = start + 1; i < lines.length; i += 1) {
      if (/^##\s+/.test(lines[i])) break;
      chunk.push(lines[i]);
    }
    return chunk.join('\n').trim();
  }

  function parseGapNoteMarkdown(markdown, fallbackPath) {
    const { attributes, body } = parseFrontmatter(markdown);
    const id = attributes.id || String(fallbackPath || '').split('/').pop()?.replace(/\.md$/, '') || '';
    const guess = sectionAfterHeading(body, '내 추측');
    const actualBlock = sectionAfterHeading(body, '실제 의미 / 정답');
    const missedClue = sectionAfterHeading(body, '놓친 단서');
    const modelUpdate = sectionAfterHeading(body, '모델 업데이트');
    let actual = actualBlock;
    let naturalKorean = '';
    const koMatch = actualBlock.match(/^- 한국어:\s*(.+)$/m);
    if (koMatch) {
      naturalKorean = koMatch[1].trim();
      actual = actualBlock.replace(/^- 한국어:\s*.+$/m, '').trim();
    }
    return {
      id,
      expressionId: attributes.expressionId || '',
      mode: attributes.mode || '',
      status: attributes.status || 'open',
      createdAt: attributes.createdAt || null,
      updatedAt: attributes.updatedAt || attributes.createdAt || null,
      guess: guess === '(없음)' ? '' : guess,
      actual,
      naturalKorean,
      missedClue: missedClue === '(아직 적지 않음)' ? '' : missedClue,
      modelUpdate: modelUpdate === '(아직 적지 않음)' ? '' : modelUpdate,
      english: '',
      source: 'vault',
      vaultPath: attributes.vaultPath || fallbackPath || '',
    };
  }

  function parseNextPracticeMarkdown(markdown) {
    const text = String(markdown || '');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const raw = match ? match[1] : '';
    const updatedAtMatch = raw.match(/^updatedAt:\s*(.+)$/m);
    const updatedAt = updatedAtMatch ? updatedAtMatch[1].trim().replace(/^"|"$/g, '') : null;
    const queue = [];
    const queueBlock = raw.split(/^queue:\s*/m)[1] || '';
    const lines = queueBlock.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('-')) {
        if (trimmed && !trimmed.startsWith('{') && queue.length) break;
        if (trimmed === '[]') break;
        continue;
      }
      const expressionId = (trimmed.match(/expressionId:\s*([^,}]+)/) || [])[1];
      const mode = (trimmed.match(/mode:\s*([^,}]+)/) || [])[1];
      const reason = (trimmed.match(/reason:\s*([^,}]+)/) || [])[1];
      if (!expressionId) continue;
      queue.push({
        expressionId: expressionId.trim().replace(/^"|"$/g, ''),
        mode: (mode || 'review').trim().replace(/^"|"$/g, ''),
        reason: (reason || '').trim().replace(/^"|"$/g, ''),
      });
    }
    return { updatedAt, queue };
  }

  function mergeGapNotes(localGaps, vaultGaps) {
    const local = Array.isArray(localGaps) ? localGaps.slice() : [];
    const byId = new Map(local.map(gap => [gap.id, { ...gap }]));
    const vaultIds = new Set();

    (vaultGaps || []).forEach(vaultGap => {
      if (!vaultGap?.id) return;
      vaultIds.add(vaultGap.id);
      const existing = byId.get(vaultGap.id);
      if (!existing) {
        byId.set(vaultGap.id, { ...vaultGap, source: 'vault' });
        return;
      }
      // Vault priority for narrative fields; keep local ids/expression links.
      byId.set(vaultGap.id, {
        ...existing,
        missedClue: vaultGap.missedClue || existing.missedClue || '',
        modelUpdate: vaultGap.modelUpdate || existing.modelUpdate || '',
        guess: vaultGap.guess || existing.guess || '',
        actual: vaultGap.actual || existing.actual || '',
        naturalKorean: vaultGap.naturalKorean || existing.naturalKorean || '',
        status: vaultGap.status || existing.status || 'open',
        updatedAt: vaultGap.updatedAt || existing.updatedAt,
        missingInVault: false,
        source: existing.source || 'webapp',
      });
    });

    byId.forEach((gap, id) => {
      if ((gap.status || 'open') === 'open' && !vaultIds.has(id) && gap.source !== 'vault') {
        byId.set(id, { ...gap, missingInVault: true });
      }
    });

    return [...byId.values()].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }

  function mergeNextPractice(appQueue, vaultPayload) {
    const vaultQueue = Array.isArray(vaultPayload?.queue) ? vaultPayload.queue : [];
    if (!vaultQueue.length) {
      return {
        queue: Array.isArray(appQueue) ? appQueue : [],
        source: 'app',
        updatedAt: null,
      };
    }
    return {
      queue: vaultQueue,
      source: 'vault',
      updatedAt: vaultPayload.updatedAt || new Date().toISOString(),
    };
  }

  async function upsertFiles(client, files, options = {}) {
    const entries = Object.entries(files || {});
    const results = { ok: [], failed: [] };
    for (const [path, markdown] of entries) {
      try {
        await client.putFile(path, markdown);
        results.ok.push(path);
      } catch (error) {
        results.failed.push({ path, error: String(error.message || error) });
        if (options.enqueueOnFail !== false) {
          enqueueUpsert({ path, markdown, lastError: String(error.message || error) }, options.storage);
        }
      }
    }
    return results;
  }

  async function flushQueue(client, storage) {
    const queue = loadQueue(storage);
    const remaining = [];
    const flushed = [];
    for (const job of queue) {
      if (job.type !== 'upsert') {
        remaining.push(job);
        continue;
      }
      try {
        await client.putFile(job.path, job.markdown);
        flushed.push(job.path);
      } catch (error) {
        const attempts = (job.attempts || 0) + 1;
        if (attempts < MAX_ATTEMPTS) {
          remaining.push({
            ...job,
            attempts,
            lastError: String(error.message || error),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
    saveQueue(remaining, storage);
    return { flushed, remaining: remaining.length };
  }

  async function importGapsAndNextPractice(client, options = {}) {
    const personalRoot = String(options.personalRoot || '').replace(/^\/+|\/+$/g, '');
    const gapDir = personalRoot ? `${personalRoot}/Gaps` : 'Gaps';
    const nextPracticePath = personalRoot
      ? `${personalRoot}/Learning/Next Practice.md`
      : 'Learning/Next Practice.md';
    const files = await client.listDirectory(gapDir);
    const vaultGaps = [];
    for (const name of files) {
      if (!String(name).endsWith('.md') || String(name).endsWith('/')) continue;
      const path = `${gapDir}/${name}`;
      const markdown = await client.getFile(path);
      if (!markdown) continue;
      vaultGaps.push(parseGapNoteMarkdown(markdown, path));
    }

    let nextPractice = { updatedAt: null, queue: [] };
    try {
      const nextMd = await client.getFile(nextPracticePath);
      if (nextMd) nextPractice = parseNextPracticeMarkdown(nextMd);
    } catch (_) {
      // optional
    }

    return {
      personalRoot: personalRoot || '',
      vaultGaps,
      mergedGaps: mergeGapNotes(options.localGaps || [], vaultGaps),
      nextPractice: mergeNextPractice(options.appQueue || [], nextPractice),
    };
  }

  return {
    SETTINGS_KEY,
    QUEUE_KEY,
    MAX_ATTEMPTS,
    defaultSettings,
    normalizeSettings,
    loadSettings,
    saveSettings,
    loadQueue,
    saveQueue,
    enqueueUpsert,
    withPrefix,
    encodeVaultPath,
    createLocalRestClient,
    parseFrontmatter,
    parseGapNoteMarkdown,
    parseNextPracticeMarkdown,
    mergeGapNotes,
    mergeNextPractice,
    upsertFiles,
    flushQueue,
    importGapsAndNextPractice,
  };
});
