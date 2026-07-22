/**
 * Phase 4 — read-only Vault word overlay.
 * Maps Library/Verbs|Nouns (+ legacy roots) Markdown to catalog IDs.
 * Never expands the quiz bank — watchlist / confirmed links only.
 * Browser: window.VaultOverlay
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.VaultOverlay = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_DIRS = [
    'Library/Verbs',
    'Library/Nouns',
    'Library/Patterns',
    'Verbs',
    'Nouns',
    'Patterns',
  ];

  function parseFrontmatter(markdown) {
    const text = String(markdown || '');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { attributes: {}, body: text };
    const attributes = {};
    match[1].split(/\r?\n/).forEach(line => {
      const idx = line.indexOf(':');
      if (idx < 0) return;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (!key) return;
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          attributes[key] = JSON.parse(value.replace(/'/g, '"'));
          return;
        } catch (_) {
          attributes[key] = value.slice(1, -1).split(',').map(part => part.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          return;
        }
      }
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      attributes[key] = value;
    });
    return { attributes, body: match[2] || '' };
  }

  function stemFromPath(path) {
    const base = String(path || '').split('/').pop() || '';
    return base.replace(/\.md$/i, '').trim();
  }

  function normalizeWord(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function inferType(path, attributes = {}) {
    const explicit = String(attributes.type || attributes.kind || '').toLowerCase();
    if (['verb', 'noun', 'pattern', 'preposition', 'word'].includes(explicit)) return explicit;
    const lower = String(path || '').toLowerCase();
    if (lower.includes('/verbs/') || lower.endsWith('/verbs')) return 'verb';
    if (lower.includes('/nouns/')) return 'noun';
    if (lower.includes('/patterns/')) return 'pattern';
    if (lower.includes('/prepositions/')) return 'preposition';
    return 'word';
  }

  function parseVaultNote(markdown, path) {
    const { attributes, body } = parseFrontmatter(markdown);
    const stem = stemFromPath(path);
    const aliases = Array.isArray(attributes.aliases)
      ? attributes.aliases.map(String)
      : String(attributes.aliases || '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    const wikiLinks = [...String(body || '').matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)]
      .map(match => match[1].trim())
      .filter(Boolean);
    return {
      path: String(path || ''),
      id: attributes.id ? String(attributes.id) : '',
      word: String(attributes.word || stem || ''),
      type: inferType(path, attributes),
      aliases,
      title: String(attributes.title || ''),
      body: body || '',
      wikiLinks,
      updatedAt: attributes.updatedAt || null,
      source: 'vault',
    };
  }

  function findById(list, id) {
    return (list || []).find(item => item.id === id) || null;
  }

  function findByWord(list, word, field = 'word') {
    const needle = normalizeWord(word);
    if (!needle) return null;
    return (list || []).find(item => normalizeWord(item[field] || item.word || item.label) === needle) || null;
  }

  function matchNoteToCatalog(note, catalog = {}) {
    const verbs = catalog.verbs || [];
    const nouns = catalog.nouns || [];
    const patterns = catalog.patterns || [];
    const expressions = catalog.expressions || [];
    const type = note.type || 'word';
    let entityType = type === 'preposition' ? 'pattern' : type;
    let entity = null;
    let confidence = 'low';
    let reason = 'unmatched';

    if (note.id) {
      if (type === 'verb' || note.id.startsWith('v_')) {
        entity = findById(verbs, note.id);
        entityType = 'verb';
      } else if (type === 'noun' || note.id.startsWith('n_')) {
        entity = findById(nouns, note.id);
        entityType = 'noun';
      } else if (type === 'pattern' || note.id.startsWith('p_')) {
        entity = findById(patterns, note.id);
        entityType = 'pattern';
      } else if (note.id.startsWith('e_') || /^e\d+/i.test(note.id)) {
        entity = findById(expressions, note.id);
        entityType = 'expression';
      }
      if (entity) {
        confidence = 'high';
        reason = 'frontmatter-id';
      }
    }

    if (!entity) {
      if (type === 'verb' || entityType === 'verb') {
        entity = findByWord(verbs, note.word);
        entityType = 'verb';
      } else if (type === 'noun' || entityType === 'noun') {
        entity = findByWord(nouns, note.word);
        entityType = 'noun';
      } else if (type === 'pattern' || entityType === 'pattern') {
        entity = findByWord(patterns, note.word, 'label') || findByWord(patterns, note.word, 'id');
        entityType = 'pattern';
      }
      if (entity) {
        confidence = note.id ? 'medium' : 'high';
        reason = 'word-match';
      }
    }

    if (!entity && (note.aliases || []).length) {
      for (const alias of note.aliases) {
        entity = findByWord(verbs, alias) || findByWord(nouns, alias) || findByWord(patterns, alias, 'label');
        if (entity) {
          entityType = entity.word !== undefined && entity.coreImage !== undefined
            ? 'verb'
            : (entity.category !== undefined ? 'noun' : 'pattern');
          confidence = 'medium';
          reason = 'alias-match';
          break;
        }
      }
    }

    if (!entity) {
      confidence = 'low';
      reason = 'candidate-only';
    }

    const relatedExpressionIds = [];
    if (entity && entityType === 'verb') {
      expressions.forEach(expression => {
        if (expression.coreVerbId === entity.id) relatedExpressionIds.push(expression.id);
      });
    } else if (entity && entityType === 'noun') {
      expressions.forEach(expression => {
        if ((expression.nounIds || []).includes(entity.id)) relatedExpressionIds.push(expression.id);
      });
    } else if (entity && entityType === 'pattern') {
      expressions.forEach(expression => {
        if (expression.patternId === entity.id) relatedExpressionIds.push(expression.id);
      });
    }

    return {
      note,
      entityType: entity ? entityType : (type || 'word'),
      entityId: entity?.id || '',
      entityLabel: entity?.word || entity?.label || entity?.english || note.word || note.path,
      confidence,
      reason,
      relatedExpressionIds,
    };
  }

  function classifyGate(match, options = {}) {
    const unlockedVerbIds = new Set(options.unlockedVerbIds || []);
    const unlockedExpressionIds = new Set(options.unlockedExpressionIds || []);
    if (!match.entityId || match.confidence === 'low') return 'candidate';
    if (match.entityType === 'verb' && unlockedVerbIds.has(match.entityId)) return 'active';
    if (match.entityType === 'expression' && unlockedExpressionIds.has(match.entityId)) return 'active';
    if (match.entityType === 'noun' || match.entityType === 'pattern') {
      const relatedActive = (match.relatedExpressionIds || []).some(id => unlockedExpressionIds.has(id));
      return relatedActive ? 'active' : 'unlock-later';
    }
    if (match.entityType === 'verb' && !unlockedVerbIds.has(match.entityId)) return 'unlock-later';
    return 'background';
  }

  function buildOverlayIndex(notes, catalog, options = {}) {
    const matches = (notes || []).map(note => {
      const match = matchNoteToCatalog(note, catalog);
      return {
        ...match,
        gate: classifyGate(match, options),
      };
    });
    return {
      updatedAt: new Date().toISOString(),
      noteCount: matches.length,
      matches,
      byGate: {
        active: matches.filter(item => item.gate === 'active'),
        unlockLater: matches.filter(item => item.gate === 'unlock-later'),
        candidate: matches.filter(item => item.gate === 'candidate'),
        background: matches.filter(item => item.gate === 'background'),
      },
    };
  }

  async function fetchVaultOverlayNotes(client, options = {}) {
    const dirs = options.dirs || DEFAULT_DIRS;
    const notes = [];
    const errors = [];
    for (const dir of dirs) {
      let files = [];
      try {
        files = await client.listDirectory(dir);
      } catch (error) {
        errors.push({ dir, error: String(error.message || error) });
        continue;
      }
      for (const name of files || []) {
        if (!String(name).endsWith('.md') || String(name).endsWith('/')) continue;
        const path = `${dir.replace(/\/$/, '')}/${name}`;
        try {
          const markdown = await client.getFile(path);
          if (!markdown) continue;
          notes.push(parseVaultNote(markdown, path));
        } catch (error) {
          errors.push({ path, error: String(error.message || error) });
        }
      }
    }
    return { notes, errors, dirs };
  }

  function linksForEntity(links, entityType, entityId) {
    return (links || []).filter(link => link.entityType === entityType && link.entityId === entityId && link.status !== 'dismissed');
  }

  return {
    DEFAULT_DIRS,
    parseFrontmatter,
    parseVaultNote,
    normalizeWord,
    matchNoteToCatalog,
    classifyGate,
    buildOverlayIndex,
    fetchVaultOverlayNotes,
    linksForEntity,
  };
});
