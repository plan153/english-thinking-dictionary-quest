/**
 * English-brain export bundle helpers (JSON download shape).
 * Markdown files come from EnglishBrainMarkdown.buildExportFiles.
 * Browser: window.EnglishBrainExport
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.EnglishBrainExport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function buildMarkdownFiles(markdownApi, input) {
    if (!markdownApi?.buildExportFiles) throw new Error('markdown projection module missing');
    return markdownApi.buildExportFiles(input || {});
  }

  function buildBundleJson(payload, options = {}) {
    const exportedAt = options.exportedAt || new Date().toISOString();
    return {
      version: 1,
      exportedAt,
      learnerId: payload.learnerId || '',
      learnerName: payload.learnerName || '',
      files: payload.files || {},
      gapNotes: payload.gapNotes || [],
      expressionDrafts: payload.expressionDrafts || [],
      explanations: payload.explanations || [],
      brainState: payload.brainState || null,
      nextPractice: payload.nextPractice || null,
      progress: payload.progress || null,
    };
  }

  function buildDriveWebhookPayload(payload, options = {}) {
    return {
      type: 'english-brain-backup',
      version: 1,
      exportedAt: options.exportedAt || new Date().toISOString(),
      learnerId: payload.learnerId || '',
      learnerName: payload.learnerName || '',
      pathPrefix: options.pathPrefix || '',
      fileCount: Object.keys(payload.files || {}).length,
      files: payload.files || {},
    };
  }

  function filenameFromVaultPath(path) {
    return String(path || 'note.md').replace(/\//g, '__');
  }

  return {
    buildMarkdownFiles,
    buildBundleJson,
    buildDriveWebhookPayload,
    filenameFromVaultPath,
  };
});
