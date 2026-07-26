/**
 * Analyze English-brain Obsidian Markdown against folder contract + MD principles.
 * Pure: no network. Browser: window.VaultMdAnalyze · Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.VaultMdAnalyze = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PLACEHOLDER_RE = /\(아직 적지 않음\)|\(없음\)|WRONG ANSWER|TODO|TBD/i;
  const AUTO_TYPES = new Set([
    'brain-state',
    'next-practice',
    'progress',
    'english-brain-index',
    'library-index',
  ]);
  const HUMAN_TYPES = new Set(['gap-note', 'expression-draft', 'explanation']);
  const LIBRARY_WORD_TYPES = new Set(['verb', 'noun', 'pattern', 'scene', 'preposition', 'word']);

  function parseFrontmatter(markdown) {
    const text = String(markdown || '');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { attributes: {}, body: text, hasFrontmatter: false };
    const attributes = {};
    match[1].split(/\r?\n/).forEach((line) => {
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
          attributes[key] = value
            .slice(1, -1)
            .split(',')
            .map((part) => part.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);
          return;
        }
      }
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      attributes[key] = value;
    });
    return { attributes, body: match[2] || '', hasFrontmatter: true };
  }

  function sectionAfterHeading(body, heading) {
    const text = String(body || '');
    const re = new RegExp(`^##\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
    const match = text.match(re);
    if (!match) return '';
    const start = match.index + match[0].length;
    const rest = text.slice(start);
    const next = rest.search(/^##\s+/m);
    return (next < 0 ? rest : rest.slice(0, next)).trim();
  }

  function sectionLooksEmpty(section) {
    const text = String(section || '').trim();
    if (!text) return true;
    if (PLACEHOLDER_RE.test(text) && text.replace(PLACEHOLDER_RE, '').trim().length < 3) return true;
    if (/^\(아직 적지 않음\)$/i.test(text) || /^\(없음\)$/i.test(text)) return true;
    return false;
  }

  function inferType(path, attributes = {}) {
    const explicit = String(attributes.type || attributes.kind || '').toLowerCase().trim();
    if (explicit) return explicit;
    const lower = String(path || '').replace(/\\/g, '/').toLowerCase();
    if (lower.includes('/gaps/')) return 'gap-note';
    if (lower.includes('/library/drafts/') || lower.includes('/library/canon/')) return 'expression-draft';
    if (lower.includes('/library/verbs/')) return 'verb';
    if (lower.includes('/library/nouns/')) return 'noun';
    if (lower.includes('/library/patterns/')) return 'pattern';
    if (lower.includes('/library/scenes/')) return 'scene';
    if (lower.endsWith('/brain state.md')) return 'brain-state';
    if (lower.endsWith('/next practice.md')) return 'next-practice';
    if (lower.endsWith('/progress.md')) return 'progress';
    if (lower.endsWith('/english brain index.md')) return 'english-brain-index';
    if (lower.endsWith('/library/index.md')) return 'library-index';
    return 'unknown';
  }

  function classifyRole(type) {
    if (AUTO_TYPES.has(type)) return 'auto';
    if (HUMAN_TYPES.has(type)) return 'human';
    if (LIBRARY_WORD_TYPES.has(type)) return 'garden';
    return 'other';
  }

  function wikiLinks(body) {
    return [...String(body || '').matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)]
      .map((match) => match[1].trim())
      .filter(Boolean);
  }

  function analyzeNote(path, markdown) {
    const { attributes, body, hasFrontmatter } = parseFrontmatter(markdown);
    const type = inferType(path, attributes);
    const role = classifyRole(type);
    const issues = [];
    const tips = [];
    const links = wikiLinks(body);
    const bodyLen = String(body || '').trim().length;

    if (!hasFrontmatter) {
      issues.push({ code: 'no-frontmatter', severity: 'high', message: 'YAML frontmatter 없음' });
    }
    if (!attributes.type && type === 'unknown') {
      issues.push({ code: 'no-type', severity: 'high', message: 'type 속성이 없고 경로로도 추정 불가' });
    } else if (!attributes.type && type !== 'unknown') {
      tips.push({ code: 'add-type', message: `type: ${type} 를 frontmatter에 명시하면 Dataview/앱 파싱이 안정적` });
    }

    if (type === 'gap-note') {
      if (!attributes.id && !String(path).match(/gap_[^/]+\.md$/i)) {
        issues.push({ code: 'gap-no-id', severity: 'high', message: 'gap id 없음' });
      }
      if (!attributes.expressionId) {
        issues.push({ code: 'gap-no-expression', severity: 'medium', message: 'expressionId 없음' });
      }
      const status = String(attributes.status || 'open').toLowerCase();
      const missed = sectionAfterHeading(body, '놓친 단서');
      const model = sectionAfterHeading(body, '모델 업데이트');
      if (status === 'open' && sectionLooksEmpty(missed)) {
        issues.push({ code: 'gap-empty-clue', severity: 'high', message: '열린 Gap인데 「놓친 단서」가 비어 있음' });
      }
      if (status === 'open' && sectionLooksEmpty(model)) {
        issues.push({ code: 'gap-empty-model', severity: 'high', message: '열린 Gap인데 「모델 업데이트」가 비어 있음' });
      }
      if (!links.some((link) => /Verbs\//i.test(link) || /Library\/Verbs\//i.test(link))) {
        tips.push({ code: 'gap-verb-link', message: '[[Verbs/…]] 링크를 추가하면 정원과 연결됨' });
      }
      if (bodyLen > 1200) {
        tips.push({ code: 'gap-too-long', message: 'Gap 본문이 김 — 3섹션만 남기고 긴 설명은 Verb/Draft로 이동' });
      }
    }

    if (type === 'expression-draft') {
      const status = String(attributes.status || 'draft').toLowerCase();
      ['english', 'naturalKorean', 'coreVerb', 'pattern'].forEach((key) => {
        if (!String(attributes[key] || '').trim()) {
          issues.push({
            code: `draft-missing-${key}`,
            severity: status === 'approved' ? 'high' : 'medium',
            message: `Draft 필드 누락: ${key}`,
          });
        }
      });
      if (status === 'approved' && !String(path).includes('/Canon/')) {
        issues.push({ code: 'draft-approved-wrong-folder', severity: 'high', message: 'approved인데 Canon 폴더가 아님' });
      }
      if (status === 'draft' && String(path).includes('/Canon/')) {
        issues.push({ code: 'draft-in-canon', severity: 'medium', message: 'draft 상태가 Canon 폴더에 있음' });
      }
    }

    if (LIBRARY_WORD_TYPES.has(type)) {
      const word = String(attributes.word || '').trim();
      const stem = String(path || '').split('/').pop()?.replace(/\.md$/i, '') || '';
      if (!word && !stem) {
        issues.push({ code: 'word-no-stem', severity: 'high', message: 'word/파일명 없음' });
      }
      if (!attributes.id) {
        tips.push({ code: 'word-add-id', message: 'catalog id(예: v_need)를 넣으면 앱 overlay 매칭이 확실해짐' });
      }
      if (bodyLen > 900) {
        tips.push({ code: 'word-too-long', message: '단어 노트는 짧게 — 예문·틀 몇 개 + 링크만' });
      }
      if (!links.length && bodyLen > 40) {
        tips.push({ code: 'word-no-links', message: '관련 Pattern/Gap/Draft wikilink 추가 권장' });
      }
    }

    if (AUTO_TYPES.has(type)) {
      if (bodyLen > 2500) {
        tips.push({ code: 'auto-bloated', message: '앱 자동 노트에 긴 서사를 쓰지 말 것 — Gap/Library로 이동' });
      }
      if (attributes.source && String(attributes.source) !== 'webapp') {
        tips.push({ code: 'auto-source', message: '자동 노트의 source는 webapp 유지 권장' });
      }
    }

    const score = issues.some((item) => item.severity === 'high')
      ? 'needs-work'
      : issues.length
        ? 'ok-improve'
        : 'good';

    return {
      path: String(path || ''),
      type,
      role,
      status: attributes.status || null,
      id: attributes.id || null,
      expressionId: attributes.expressionId || null,
      source: attributes.source || null,
      bodyChars: bodyLen,
      linkCount: links.length,
      links,
      issues,
      tips,
      score,
      attributes,
    };
  }

  function summarize(notes) {
    const byType = {};
    const byRole = { auto: 0, human: 0, garden: 0, other: 0 };
    const byScore = { good: 0, 'ok-improve': 0, 'needs-work': 0 };
    const openGaps = [];
    const actions = [];

    notes.forEach((note) => {
      byType[note.type] = (byType[note.type] || 0) + 1;
      byRole[note.role] = (byRole[note.role] || 0) + 1;
      byScore[note.score] = (byScore[note.score] || 0) + 1;
      if (note.type === 'gap-note' && String(note.status || 'open').toLowerCase() === 'open') {
        openGaps.push(note);
      }
      note.issues.forEach((issue) => {
        actions.push({
          path: note.path,
          severity: issue.severity,
          code: issue.code,
          message: issue.message,
        });
      });
    });

    actions.sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
    });

    const gardenCount = notes.filter((note) => note.role === 'garden').length;
    const draftCount = notes.filter((note) => note.type === 'expression-draft').length;
    const hasLibraryIndex = notes.some((note) => note.type === 'library-index');

    const structural = [];
    if (!notes.some((note) => note.type === 'brain-state')) {
      structural.push('Brain State.md 없음 — 앱에서 한 번 sync 하세요');
    }
    if (!notes.some((note) => note.type === 'next-practice')) {
      structural.push('Next Practice.md 없음 — 앱에서 한 번 sync 하세요');
    }
    if (openGaps.length > 12) {
      structural.push(`열린 Gap ${openGaps.length}개 — 주 1회 reviewed로 정리하세요`);
    }
    if (gardenCount === 0 && hasLibraryIndex) {
      structural.push('Library/Verbs·Nouns·Patterns 노트가 비어 있음 — Gap 연결용 원자 노트부터 추가');
    }
    if (draftCount === 0 && openGaps.some((gap) => gap.issues.some((issue) => issue.code.startsWith('gap-empty')))) {
      structural.push('열린 Gap은 있는데 Draft가 없음 — 보강한 Gap에서 Draft 1개만 만들어 보세요');
    }

    return {
      noteCount: notes.length,
      byType,
      byRole,
      byScore,
      openGapCount: openGaps.length,
      structural,
      topActions: actions.slice(0, 40),
      actionCount: actions.length,
    };
  }

  function analyzeVaultFiles(fileMap = {}) {
    const notes = Object.keys(fileMap)
      .filter((path) => /\.md$/i.test(path))
      .sort()
      .map((path) => analyzeNote(path, fileMap[path]));
    return {
      notes,
      summary: summarize(notes),
      analyzedAt: new Date().toISOString(),
    };
  }

  function formatReport(result, options = {}) {
    const summary = result.summary || summarize(result.notes || []);
    const lines = [];
    lines.push('# Vault MD 최적화 리포트');
    lines.push('');
    lines.push(`분석 시각: ${result.analyzedAt || new Date().toISOString()}`);
    if (options.pathPrefix != null) {
      lines.push(`pathPrefix: ${options.pathPrefix || '(empty)'}`);
    }
    if (options.learnerId) lines.push(`learnerId: ${options.learnerId}`);
    lines.push('');
    lines.push('## 요약');
    lines.push(`- 노트 ${summary.noteCount}개`);
    lines.push(`- 점수: good ${summary.byScore.good || 0} · improve ${summary.byScore['ok-improve'] || 0} · needs-work ${summary.byScore['needs-work'] || 0}`);
    lines.push(`- 역할: auto ${summary.byRole.auto || 0} · human ${summary.byRole.human || 0} · garden ${summary.byRole.garden || 0}`);
    lines.push(`- 열린 Gap: ${summary.openGapCount}`);
    lines.push('');
    lines.push('## 타입별');
    Object.keys(summary.byType)
      .sort()
      .forEach((type) => lines.push(`- ${type}: ${summary.byType[type]}`));
    if (summary.structural.length) {
      lines.push('');
      lines.push('## 구조 최적화');
      summary.structural.forEach((item) => lines.push(`- ${item}`));
    }
    if (summary.topActions.length) {
      lines.push('');
      lines.push('## 우선 조치 (최대 40)');
      summary.topActions.forEach((action, index) => {
        lines.push(`${index + 1}. [${action.severity}] ${action.path}`);
        lines.push(`   ${action.message}`);
      });
    } else {
      lines.push('');
      lines.push('## 우선 조치');
      lines.push('- (이슈 없음 — 공통 원칙 유지하며 새 Gap만 짧게 보강)');
    }

    const examples = (result.notes || []).filter((note) => note.role === 'human' || note.role === 'garden').slice(0, 3);
    if (examples.length) {
      lines.push('');
      lines.push('## 샘플 노트 스냅샷');
      examples.forEach((note) => {
        lines.push(`- ${note.path} · type=${note.type} · score=${note.score} · links=${note.linkCount}`);
      });
    }
    lines.push('');
    return lines.join('\n');
  }

  return {
    parseFrontmatter,
    sectionAfterHeading,
    inferType,
    analyzeNote,
    analyzeVaultFiles,
    summarize,
    formatReport,
  };
});
