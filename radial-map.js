function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
// 방사형 SVG 사고망 렌더링 모듈
function renderRadialMapSVG(currentMapId, m, activeFrameIndex, activeFrame, selectedExample) {
  var cx = 300, cy = 300, verbR = 36, frameBaseDist = 120, exampleBaseDist = 60;
  var frames = m.frames || [];
  var frameCount = frames.length;
  var norm = function(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]/gi, ''); };
  function nodeMetrics(expressionId) {
    var p = (typeof appState !== 'undefined' && appState.progress) ? appState.progress : { successes: {}, attempts: {}, historyByExpressionId: {} };
    var success = (p.successes && p.successes[expressionId]) || 0;
    var attempts = (p.attempts && p.attempts[expressionId]) || 0;
    var history = (p.historyByExpressionId && p.historyByExpressionId[expressionId]) || {};
    var reviewPriority = history.reviewPriority != null ? history.reviewPriority : 5;
    return { radius: 12 + Math.min(success, 5) * 3, lineThickness: Math.max(1, 4 - (reviewPriority / 10) * 3), opacity: Math.min(1, 0.35 + Math.min(attempts, 10) * 0.065), isMastered: success >= 3, reviewPriority: reviewPriority };
  }
  function mapFrameKey(verbId, frameIndex, exampleIndex) { return verbId + '_' + frameIndex + '_' + exampleIndex; }
  var parts = [];
  parts.push('<svg class="radial-map" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">');
  for (var i = 1; i <= 3; i++) { parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (frameBaseDist + i * 50) + '" fill="none" stroke="var(--line)" stroke-opacity="0.12" stroke-dasharray="3,6" />'); }
  parts.push('<g class="verb-node" data-map-verb="' + escapeHtml(currentMapId) + '">');
  parts.push('<circle class="verb-bg" cx="' + cx + '" cy="' + cy + '" r="' + verbR + '" />');
  parts.push('<text class="verb-label" x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central">' + escapeHtml(currentMapId) + '</text>');
  parts.push('</g>');
  frames.forEach(function(frame, fi) {
    var angle = (fi / frameCount) * Math.PI * 2 - Math.PI / 2;
    var fx = cx + Math.cos(angle) * frameBaseDist;
    var fy = cy + Math.sin(angle) * frameBaseDist;
    var frameR = 28;
    var isActive = fi === activeFrameIndex;
    parts.push('<line class="connection-line' + (isActive ? ' active' : '') + '" x1="' + cx + '" y1="' + cy + '" x2="' + fx + '" y2="' + fy + '" stroke-width="' + (isActive ? 2.5 : 1.2) + '" stroke-opacity="' + (isActive ? 0.8 : 0.4) + '" />');
    parts.push('<g class="frame-node" data-map-frame-index="' + fi + '">');
    parts.push('<circle class="frame-bg' + (isActive ? ' active' : '') + '" cx="' + fx + '" cy="' + fy + '" r="' + frameR + '" />');
    var frameLabel = (frame.label || '').length > 14 ? (frame.label || '').slice(0, 13) + '…' : (frame.label || '');
    parts.push('<text class="frame-label" x="' + fx + '" y="' + fy + '" text-anchor="middle" dominant-baseline="central">' + escapeHtml(frameLabel) + '</text>');
    parts.push('</g>');
    var frameExamples = (frame.examples || []).slice(0, 5);
    var exCount = frameExamples.length;
    var spread = Math.PI / 2.5;
    frameExamples.forEach(function(ex, ei) {
      var exAngle = angle + (ei - (exCount - 1) / 2) * (spread / Math.max(exCount, 1));
      var exId = mapFrameKey(currentMapId, fi, ei);
      var mt = nodeMetrics(exId);
      var exDist = frameBaseDist + exampleBaseDist + mt.reviewPriority * 4;
      var exx = cx + Math.cos(exAngle) * exDist;
      var exy = cy + Math.sin(exAngle) * exDist;
      var isSel = norm(selectedExample) === norm(ex.en);
      parts.push('<line class="connection-line' + (isActive && isSel ? ' active' : '') + '" x1="' + fx + '" y1="' + fy + '" x2="' + exx + '" y2="' + exy + '" stroke-width="' + mt.lineThickness + '" stroke-opacity="' + mt.opacity + '" />');
      parts.push('<g class="example-node" data-map-example-en="' + escapeHtml(ex.en) + '">');
      var exFill = mt.isMastered ? '#d4edda' : 'rgba(255,253,249,.95)';
      var exStroke = isSel ? 'var(--accent)' : (mt.isMastered ? '#5cb85c' : 'var(--line)');
      parts.push('<circle class="example-bg' + (isSel ? ' selected' : '') + '" cx="' + exx + '" cy="' + exy + '" r="' + mt.radius + '" fill="' + exFill + '" stroke="' + exStroke + '" stroke-width="' + (isSel || mt.isMastered ? 2 : 1) + '" />');
      var labelOffset = mt.radius + 5;
      var labelX = exx + (Math.cos(exAngle) >= 0 ? labelOffset : -labelOffset);
      var anchor = Math.cos(exAngle) >= 0 ? 'start' : 'end';
      var labelText = ex.en.length > 30 ? ex.en.slice(0, 29) + '…' : ex.en;
      parts.push('<text class="example-label" x="' + labelX + '" y="' + exy + '" text-anchor="' + anchor + '" dominant-baseline="central">' + escapeHtml(labelText) + '</text>');
      parts.push('</g>');
    });
    if (frame.combos && frame.combos.length) { parts.push('<text class="frame-combos" x="' + fx + '" y="' + (fy + frameR + 16) + '" text-anchor="middle">' + escapeHtml(frame.combos.join(' · ')) + '</text>'); }
  });
  parts.push('<text x="' + cx + '" y="' + (cy + verbR + 22) + '" text-anchor="middle" class="meaning-text">' + escapeHtml(m.engineSummary || '') + '</text>');
  parts.push('</svg>');
  var activeExs = (activeFrame && activeFrame.examples && activeFrame.examples.length ? activeFrame.examples : (m.examples || [])).slice(0, 5);
  parts.push('<div class="map-col" style="margin-top:16px">');
  parts.push('<h3>선택된 생각틀의 실생활 표현</h3>');
  parts.push('<p class="small-note" style="margin:0 0 10px"><b>선택됨:</b> ' + escapeHtml(activeFrame ? (activeFrame.label || '없음') : '없음') + (activeFrame && activeFrame.meaning ? ' · ' + escapeHtml(activeFrame.meaning) : '') + '</p>');
  activeExs.forEach(function(ex) {
    parts.push('<button class="map-detail-card map-example-card' + (norm(selectedExample) === norm(ex.en) ? ' selected' : '') + '" type="button" data-map-example-en="' + escapeHtml(ex.en) + '">');
    parts.push('<p><b>' + escapeHtml(ex.en) + '</b></p><p>' + escapeHtml(ex.ko) + '</p>');
    parts.push('</button>');
  });
  parts.push('</div>');
  return parts.join('');
}
