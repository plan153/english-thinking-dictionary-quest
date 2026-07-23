/**
 * Obsidian English-brain SyncAdapter.
 * Adapters: download (fallback), local-rest, bridge, drive-webhook (backup).
 * API keys / webhook URLs stay in localStorage only — never commit secrets.
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
      adapter: 'download', // download | local-rest | bridge | drive-webhook | drive-oauth
      baseUrl: 'http://127.0.0.1:27123',
      webhookUrl: '',
      apiKey: '',
      pathPrefix: '', // e.g. Project_English when vault root is parent
      // P2c: Google OAuth tokens/ids — localStorage only, never commit
      googleClientId: '',
      googleAccessToken: '',
      driveFolderId: '',
      autoSyncAfterGap: false,
      lastSyncAt: null,
      lastSyncError: null,
      lastImportAt: null,
    };
  }

  function normalizeSettings(raw) {
    const base = defaultSettings();
    const src = raw && typeof raw === 'object' ? raw : {};
    const adapter = ['local-rest', 'bridge', 'drive-webhook', 'drive-oauth'].includes(src.adapter)
      ? src.adapter
      : 'download';
    let baseUrl = String(src.baseUrl || base.baseUrl).replace(/\/$/, '');
    if (adapter === 'bridge' && !src.baseUrl) {
      baseUrl = 'http://127.0.0.1:8787';
    }
    return {
      ...base,
      ...src,
      adapter,
      baseUrl,
      webhookUrl: String(src.webhookUrl || '').trim(),
      apiKey: String(src.apiKey || ''),
      pathPrefix: String(src.pathPrefix || '').replace(/^\/+|\/+$/g, ''),
      googleClientId: String(src.googleClientId || '').trim(),
      googleAccessToken: String(src.googleAccessToken || '').trim(),
      driveFolderId: String(src.driveFolderId || '').trim(),
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
      kind: 'local-rest',
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
      async deleteFile(vaultPath) {
        const response = await request('DELETE', vaultPath);
        if (response.status === 404) return false;
        if (!(response.status === 200 || response.status === 204)) {
          const text = await response.text().catch(() => '');
          throw new Error(`DELETE ${vaultPath} failed (${response.status}): ${text.slice(0, 200)}`);
        }
        return true;
      },
    };
  }

  function normalizeListingName(name) {
    return String(name || '').replace(/^\/+|\/+$/g, '');
  }

  function listingIncludes(files, name) {
    const want = normalizeListingName(name);
    if (!want) return false;
    return (Array.isArray(files) ? files : []).some((entry) => {
      const clean = normalizeListingName(entry);
      return clean === want || clean === `${want}/`;
    });
  }

  /**
   * Compare Local REST directory listings against OBSIDIAN_VAULT_EVOLUTION contract.
   * listings keys: '' | 'Learners' | 'Learners/<id>' | 'Library'
   */
  function evaluateVaultFolderContract(listings = {}, options = {}) {
    const learnerId = String(options.learnerId || 'me').trim() || 'me';
    const rows = [
      { dir: '', need: ['Learners', 'Library'] },
      { dir: 'Learners', need: [learnerId] },
      { dir: `Learners/${learnerId}`, need: ['Learning', 'Gaps'] },
      { dir: 'Library', need: ['Drafts', 'Canon'] },
    ];
    const checks = [];
    rows.forEach((row) => {
      const files = listings[row.dir] || [];
      row.need.forEach((name) => {
        const path = row.dir ? `${row.dir}/${name}` : name;
        checks.push({ path, ok: listingIncludes(files, name) });
      });
    });
    return {
      learnerId,
      ready: checks.every(item => item.ok),
      checks,
      missing: checks.filter(item => !item.ok).map(item => item.path),
    };
  }

  async function verifyVaultContract(client, options = {}) {
    if (!client || typeof client.listDirectory !== 'function') {
      throw new Error('Vault 검사는 local-rest / bridge 클라이언트가 필요합니다.');
    }
    const learnerId = String(options.learnerId || 'me').trim() || 'me';
    const doProbe = options.probe !== false;
    if (typeof client.ping === 'function') await client.ping();

    const dirs = ['', 'Learners', `Learners/${learnerId}`, 'Library'];
    const listings = {};
    const listErrors = [];
    for (const dir of dirs) {
      try {
        listings[dir] = await client.listDirectory(dir);
      } catch (error) {
        listings[dir] = [];
        listErrors.push({ dir: dir || '(vault root)', error: String(error.message || error) });
      }
    }
    const evaluation = evaluateVaultFolderContract(listings, { learnerId });
    let probe = null;
    if (doProbe) {
      const probePath = `Learners/${learnerId}/Learning/_etd_vault_probe.md`;
      const stamp = new Date().toISOString();
      const markdown = `---\ntype: etd-vault-probe\nupdatedAt: ${stamp}\nsourceApp: webapp\n---\n\n# ETD vault probe\n\nSafe to delete. Written by verifyVaultContract.\n`;
      try {
        await client.putFile(probePath, markdown);
        const readBack = await client.getFile(probePath);
        let deleted = false;
        if (typeof client.deleteFile === 'function') {
          try {
            deleted = await client.deleteFile(probePath);
          } catch (_) {
            deleted = false;
          }
        }
        probe = {
          path: probePath,
          ok: Boolean(readBack && String(readBack).includes('etd-vault-probe')),
          deleted,
        };
      } catch (error) {
        probe = { path: probePath, ok: false, deleted: false, error: String(error.message || error) };
      }
    }
    return {
      ...evaluation,
      listings,
      listErrors,
      probe,
      ready: evaluation.ready && (!probe || probe.ok),
    };
  }

  function createBridgeClient(settings, fetchImpl) {
    // Thin local bridge: same /vault path contract as Local REST, default :8787.
    const cfg = normalizeSettings({
      ...(settings || {}),
      adapter: 'bridge',
      baseUrl: (settings && settings.baseUrl) || 'http://127.0.0.1:8787',
    });
    const client = createLocalRestClient(cfg, fetchImpl);
    return {
      ...client,
      kind: 'bridge',
      settings: cfg,
    };
  }

  function createDriveWebhookClient(settings, fetchImpl) {
    const cfg = normalizeSettings({
      ...(settings || {}),
      adapter: 'drive-webhook',
    });
    const fetchFn = fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    if (!fetchFn) throw new Error('fetch is not available');
    const endpoint = cfg.webhookUrl || cfg.baseUrl;
    if (!endpoint) throw new Error('Drive webhook URL이 비어 있어요.');

    async function postJson(body) {
      const response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Drive webhook failed (${response.status}): ${text.slice(0, 200)}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return response.json();
      return { ok: true, status: response.status };
    }

    return {
      kind: 'drive-webhook',
      settings: cfg,
      async ping() {
        return postJson({ type: 'ping', at: new Date().toISOString() });
      },
      async postBackup(payload) {
        return postJson({
          type: 'english-brain-backup',
          version: 1,
          exportedAt: new Date().toISOString(),
          ...(payload || {}),
        });
      },
      async putFile(vaultPath, markdown) {
        await this.postBackup({
          files: { [vaultPath]: markdown },
          fileCount: 1,
          pathPrefix: cfg.pathPrefix || '',
        });
        return true;
      },
      async getFile() {
        throw new Error('drive-webhook는 읽기(import)를 지원하지 않습니다. Local REST/Bridge를 쓰세요.');
      },
      async listDirectory() {
        throw new Error('drive-webhook는 디렉터리 목록을 지원하지 않습니다.');
      },
    };
  }

  function createDriveOauthClient(settings, fetchImpl) {
    const cfg = normalizeSettings({
      ...(settings || {}),
      adapter: 'drive-oauth',
    });
    const fetchFn = fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    if (!fetchFn) throw new Error('fetch is not available');
    if (!cfg.googleAccessToken) {
      throw new Error('Google Access Token이 비어 있어요. (localStorage에만 저장 · 저장소에 커밋하지 마세요)');
    }
    const authHeaders = {
      Authorization: `Bearer ${cfg.googleAccessToken}`,
    };

    async function driveJson(url, options = {}) {
      const response = await fetchFn(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers || {}),
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Drive API failed (${response.status}): ${text.slice(0, 200)}`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return response.json();
      return { ok: true, status: response.status };
    }

    return {
      kind: 'drive-oauth',
      settings: cfg,
      async ping() {
        return driveJson('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota');
      },
      async putFile(vaultPath, markdown) {
        const name = String(vaultPath || 'note.md').split('/').filter(Boolean).join('__');
        const metadata = {
          name: name.endsWith('.md') ? name : `${name}.md`,
          mimeType: 'text/markdown',
        };
        if (cfg.driveFolderId) metadata.parents = [cfg.driveFolderId];
        const boundary = `etd_${Date.now()}`;
        const body = [
          `--${boundary}`,
          'Content-Type: application/json; charset=UTF-8',
          '',
          JSON.stringify(metadata),
          `--${boundary}`,
          'Content-Type: text/markdown; charset=UTF-8',
          '',
          String(markdown || ''),
          `--${boundary}--`,
          '',
        ].join('\r\n');
        await driveJson('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        });
        return true;
      },
      async postBackup(payload) {
        const files = payload?.files || {};
        const entries = Object.entries(files);
        for (const [vaultPath, markdown] of entries) {
          await this.putFile(vaultPath, markdown);
        }
        return { ok: true, fileCount: entries.length };
      },
      async getFile() {
        throw new Error('drive-oauth는 현재 업로드/백업용입니다. Vault import는 Local REST/Bridge를 쓰세요.');
      },
      async listDirectory() {
        throw new Error('drive-oauth는 디렉터리 목록을 지원하지 않습니다.');
      },
    };
  }

  function createSyncClient(settings, fetchImpl) {
    const cfg = normalizeSettings(settings);
    if (cfg.adapter === 'bridge') return createBridgeClient(cfg, fetchImpl);
    if (cfg.adapter === 'local-rest') return createLocalRestClient(cfg, fetchImpl);
    if (cfg.adapter === 'drive-webhook') return createDriveWebhookClient(cfg, fetchImpl);
    if (cfg.adapter === 'drive-oauth') return createDriveOauthClient(cfg, fetchImpl);
    throw new Error(`Adapter "${cfg.adapter}" has no live sync client (use download export instead).`);
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

  function parseInlineObjectList(raw, startKey, fieldNames) {
    const block = String(raw || '').split(new RegExp(`^${startKey}:\\s*`, 'm'))[1] || '';
    const lines = block.split(/\r?\n/);
    const items = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('-')) {
        if (trimmed && !trimmed.startsWith('{') && items.length) break;
        if (trimmed === '[]') break;
        continue;
      }
      const entry = {};
      let hasValue = false;
      fieldNames.forEach(name => {
        const match = trimmed.match(new RegExp(`${name}:\\s*([^,}]+)`));
        if (!match) return;
        entry[name] = match[1].trim().replace(/^"|"$/g, '');
        hasValue = true;
      });
      if (hasValue) items.push(entry);
    }
    return items;
  }

  function parseNextPracticeMarkdown(markdown) {
    const text = String(markdown || '');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const raw = match ? match[1] : '';
    const updatedAtMatch = raw.match(/^updatedAt:\s*(.+)$/m);
    const updatedAt = updatedAtMatch ? updatedAtMatch[1].trim().replace(/^"|"$/g, '') : null;
    const queue = parseInlineObjectList(raw, 'queue', ['expressionId', 'mode', 'reason'])
      .filter(item => item.expressionId)
      .map(item => ({
        expressionId: item.expressionId,
        mode: item.mode || 'review',
        reason: item.reason || '',
      }));
    return { updatedAt, queue };
  }

  function parseListAttribute(raw, key) {
    const match = String(raw || '').match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    if (!match) return [];
    const value = match[1].trim();
    if (value === '[]') return [];
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(part => part.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
    return [];
  }

  function parseBrainStateMarkdown(markdown) {
    const text = String(markdown || '');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const raw = match ? match[1] : '';
    const updatedAtMatch = raw.match(/^updatedAt:\s*(.+)$/m);
    const unlockReadyMatch = raw.match(/^unlockReady:\s*(.+)$/m);
    const weakSlots = parseInlineObjectList(raw, 'weakSlots', ['expressionId', 'patternId', 'id', 'reason'])
      .map(slot => ({
        expressionId: slot.expressionId || slot.patternId || slot.id || '',
        reason: slot.reason || '',
      }))
      .filter(slot => slot.expressionId);
    const openGapIds = [];
    const body = match ? (text.slice(match[0].length) || '') : '';
    const gapSection = sectionAfterHeading(body, '열린 간극');
    gapSection.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('-') || trimmed.includes('(없음)')) return;
      const idMatch = trimmed.match(/Gaps\/([^\]|#]+)/) || trimmed.match(/`([^`]+)`/) || trimmed.match(/gap_[a-z0-9_]+/i);
      if (idMatch) openGapIds.push(String(idMatch[1] || idMatch[0]).replace(/\.md$/, '').trim());
    });
    return {
      updatedAt: updatedAtMatch ? updatedAtMatch[1].trim().replace(/^"|"$/g, '') : null,
      activeVerbIds: parseListAttribute(raw, 'activeVerbIds'),
      activeNounIds: parseListAttribute(raw, 'activeNounIds'),
      weakSlots,
      openGapIds,
      unlockReady: unlockReadyMatch ? /true/i.test(unlockReadyMatch[1]) : false,
      source: 'vault',
    };
  }

  function parseProgressMarkdown(markdown) {
    const { attributes } = parseFrontmatter(markdown);
    const num = (key) => {
      const value = Number(attributes[key]);
      return Number.isFinite(value) ? value : null;
    };
    return {
      updatedAt: attributes.updatedAt || null,
      xp: num('xp'),
      streak: num('streak'),
      unlockedPackCount: num('unlockedPackCount'),
      mineCount: num('mineCount'),
      activeExpressionCount: num('activeExpressionCount'),
      openGapCount: num('openGapCount'),
      source: attributes.source || 'vault',
    };
  }

  function parseExplanationMarkdown(markdown, path = '') {
    const { attributes, body } = parseFrontmatter(markdown);
    const id = attributes.id
      || String(path || '').split('/').pop()?.replace(/\.md$/i, '')
      || '';
    return {
      id,
      expressionId: attributes.expressionId || '',
      english: attributes.english || '',
      naturalKorean: attributes.naturalKorean || '',
      explanation: String(body || '').trim() || attributes.explanation || '',
      speechTranscript: attributes.speechTranscript || '',
      verbWord: attributes.verbWord || '',
      verbId: attributes.verbId || '',
      status: attributes.status || 'open',
      allowedRatio: attributes.allowedRatio != null ? Number(attributes.allowedRatio) : null,
      createdAt: attributes.createdAt || attributes.updatedAt || null,
      updatedAt: attributes.updatedAt || attributes.createdAt || null,
      source: 'vault',
      vaultPath: path || attributes.vaultPath || '',
    };
  }

  function mergeProgressFromVault(localProgress = {}, vaultProgress = null, options = {}) {
    if (!vaultProgress || typeof vaultProgress !== 'object') {
      return { progress: localProgress, applied: false, reason: 'no-vault-progress' };
    }
    if (options.enabled === false) {
      return { progress: localProgress, applied: false, reason: 'disabled' };
    }
    const next = { ...localProgress };
    const applyMax = options.mode !== 'overwrite';
    const fields = ['xp', 'streak', 'unlockedPackCount'];
    const changed = [];
    fields.forEach((key) => {
      const vaultValue = vaultProgress[key];
      if (!Number.isFinite(vaultValue)) return;
      const localValue = Number(next[key] || 0);
      const value = applyMax ? Math.max(localValue, vaultValue) : vaultValue;
      if (value !== localValue) {
        next[key] = value;
        changed.push(key);
      }
    });
    if (Number.isFinite(vaultProgress.unlockedPackCount) && next.curriculum) {
      const localPacks = Number(next.curriculum.unlockedPackCount || 0);
      const vaultPacks = Number(vaultProgress.unlockedPackCount || 0);
      const packs = applyMax ? Math.max(localPacks, vaultPacks) : vaultPacks;
      if (packs !== localPacks) {
        next.curriculum = { ...next.curriculum, unlockedPackCount: packs };
        changed.push('curriculum.unlockedPackCount');
      }
    }
    return {
      progress: next,
      applied: changed.length > 0,
      changed,
      reason: changed.length ? 'merged' : 'noop',
    };
  }

  function mergeExplanationsFromVault(localList = [], vaultList = [], options = {}) {
    if (options.enabled === false) {
      return { explanations: localList, added: 0, updated: 0 };
    }
    const byId = new Map((localList || []).map(item => [item.id, { ...item }]));
    let added = 0;
    let updated = 0;
    (vaultList || []).forEach((vaultNote) => {
      if (!vaultNote?.id) return;
      const local = byId.get(vaultNote.id);
      if (!local) {
        byId.set(vaultNote.id, { ...vaultNote });
        added += 1;
        return;
      }
      const side = pickNarrativeSide(local.updatedAt, vaultNote.updatedAt);
      if (side.side === 'vault') {
        byId.set(vaultNote.id, {
          ...local,
          ...vaultNote,
          id: local.id,
          createdAt: local.createdAt || vaultNote.createdAt,
        });
        updated += 1;
      }
    });
    return {
      explanations: [...byId.values()],
      added,
      updated,
    };
  }

  /**
   * Soft merge for brain hints. Progress numbers can be merged separately (P2b).
   * weakSlots / openGapIds are hints for Next Practice + review boost.
   */
  function mergeBrainStateHints(localHints, vaultBrain) {
    if (!vaultBrain || (!vaultBrain.weakSlots?.length && !vaultBrain.openGapIds?.length)) {
      return localHints && typeof localHints === 'object'
        ? { ...localHints, source: localHints.source || 'app' }
        : null;
    }
    return {
      updatedAt: vaultBrain.updatedAt || new Date().toISOString(),
      weakSlots: Array.isArray(vaultBrain.weakSlots) ? vaultBrain.weakSlots : [],
      openGapIds: Array.isArray(vaultBrain.openGapIds) ? vaultBrain.openGapIds : [],
      unlockReady: Boolean(vaultBrain.unlockReady),
      activeVerbIds: Array.isArray(vaultBrain.activeVerbIds) ? vaultBrain.activeVerbIds : [],
      source: 'vault',
    };
  }

  function parseTimestamp(value) {
    const ms = Date.parse(String(value || ''));
    return Number.isFinite(ms) ? ms : 0;
  }

  function pickNarrativeSide(localGap, vaultGap) {
    const localT = parseTimestamp(localGap?.updatedAt);
    const vaultT = parseTimestamp(vaultGap?.updatedAt);
    if (vaultT > localT) return { side: 'vault', reason: 'vault-newer' };
    if (localT > vaultT) return { side: 'local', reason: 'local-newer' };
    // Equal or both missing: Vault priority for narrative fields (policy).
    return { side: 'vault', reason: 'vault-tie' };
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
        byId.set(vaultGap.id, { ...vaultGap, source: vaultGap.source || 'vault', missingInVault: false });
        return;
      }
      const pick = pickNarrativeSide(existing, vaultGap);
      const narrative = pick.side === 'vault' ? vaultGap : existing;
      const fallback = pick.side === 'vault' ? existing : vaultGap;
      byId.set(vaultGap.id, {
        ...existing,
        missedClue: narrative.missedClue || fallback.missedClue || '',
        modelUpdate: narrative.modelUpdate || fallback.modelUpdate || '',
        guess: narrative.guess || fallback.guess || '',
        actual: narrative.actual || fallback.actual || '',
        naturalKorean: narrative.naturalKorean || fallback.naturalKorean || '',
        english: narrative.english || fallback.english || existing.english || '',
        status: narrative.status || fallback.status || existing.status || 'open',
        updatedAt: narrative.updatedAt || fallback.updatedAt || existing.updatedAt,
        missingInVault: false,
        source: existing.source || 'webapp',
        conflictResolvedBy: pick.reason,
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
    const learningDir = personalRoot ? `${personalRoot}/Learning` : 'Learning';
    const nextPracticePath = `${learningDir}/Next Practice.md`;
    const brainStatePath = `${learningDir}/Brain State.md`;
    const progressPath = `${learningDir}/Progress.md`;
    const explanationsDir = `${learningDir}/Explanations`;
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

    let brainState = null;
    try {
      const brainMd = await client.getFile(brainStatePath);
      if (brainMd) brainState = parseBrainStateMarkdown(brainMd);
    } catch (_) {
      // optional soft hints only
    }

    let vaultProgress = null;
    try {
      const progressMd = await client.getFile(progressPath);
      if (progressMd) vaultProgress = parseProgressMarkdown(progressMd);
    } catch (_) {
      // optional P2b
    }

    const vaultExplanations = [];
    if (options.importExplanations !== false) {
      try {
        const explanationFiles = await client.listDirectory(explanationsDir);
        for (const name of explanationFiles) {
          if (!String(name).endsWith('.md') || String(name).endsWith('/')) continue;
          const path = `${explanationsDir}/${name}`;
          const markdown = await client.getFile(path);
          if (!markdown) continue;
          vaultExplanations.push(parseExplanationMarkdown(markdown, path));
        }
      } catch (_) {
        // optional P2b
      }
    }

    const progressMerge = mergeProgressFromVault(options.localProgress || {}, vaultProgress, {
      enabled: options.importProgress !== false,
      mode: options.progressMergeMode || 'max',
    });
    const explanationMerge = mergeExplanationsFromVault(
      options.localExplanations || [],
      vaultExplanations,
      { enabled: options.importExplanations !== false }
    );

    return {
      personalRoot: personalRoot || '',
      vaultGaps,
      mergedGaps: mergeGapNotes(options.localGaps || [], vaultGaps),
      nextPractice: mergeNextPractice(options.appQueue || [], nextPractice),
      brainState: mergeBrainStateHints(options.localBrainState || null, brainState),
      vaultProgress,
      progressMerge,
      vaultExplanations,
      explanationMerge,
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
    createBridgeClient,
    createDriveWebhookClient,
    createDriveOauthClient,
    createSyncClient,
    evaluateVaultFolderContract,
    verifyVaultContract,
    parseFrontmatter,
    parseGapNoteMarkdown,
    parseNextPracticeMarkdown,
    parseBrainStateMarkdown,
    parseProgressMarkdown,
    parseExplanationMarkdown,
    parseInlineObjectList,
    parseTimestamp,
    pickNarrativeSide,
    mergeGapNotes,
    mergeNextPractice,
    mergeBrainStateHints,
    mergeProgressFromVault,
    mergeExplanationsFromVault,
    upsertFiles,
    flushQueue,
    importGapsAndNextPractice,
  };
});
