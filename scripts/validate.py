#!/usr/bin/env python3
"""Small static-app checks used locally and in GitHub Actions."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def fail(message: str) -> None:
    print(f"❌ {message}")
    raise SystemExit(1)


def main() -> None:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    if not SEMVER.fullmatch(version):
        fail("VERSION must use semantic versioning, such as 1.2.3")

    data = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    if data.get("version") != version:
        fail("version.json and VERSION do not match")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    if f'data-app-version="{version}">v{version}' not in html:
        fail("index.html app version badge does not match VERSION")
    if f"const APP_CACHE_VERSION = 'etd-quest-v{version}';" not in html:
        fail("index.html app cache version does not match VERSION")

    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    if f"etd-quest-v{version}" not in worker:
        fail("service-worker cache version does not match VERSION")

    for required in ["index.html", "fresh.html", "manifest.webmanifest", "service-worker.js", "README.md", "src/domain/markdown-projection.js", "src/domain/obsidian-sync.js", "src/domain/canon-intake.js", "src/domain/verb-matrix-gate.js", "src/domain/vault-overlay.js", "src/domain/feynman-challenge.js", "src/domain/graph-style.js", "src/domain/progress-store.js", "src/domain/active-speaking-set.js", "src/domain/phrasal-speaking-set.js", "src/domain/english-brain-export.js", "src/domain/next-practice.js", "src/data/thinking-map-sets.js"]:
        if not (ROOT / required).exists():
            fail(f"Required file is missing: {required}")

    fresh = (ROOT / "fresh.html").read_text(encoding="utf-8")
    if f"const VERSION = '{version}';" not in fresh:
        fail("fresh.html VERSION constant does not match VERSION")
    if "serviceWorker" not in fresh or "caches.delete" not in fresh:
        fail("fresh.html must unregister service workers and clear caches")

    if "isBypassPath" not in worker or "networkOnly" not in worker:
        fail("service-worker.js must bypass fresh.html and avoid caching HTML navigations")
    if "'./index.html'" in worker or '"./index.html"' in worker:
        fail("service-worker.js must not precache index.html")

    patterns = json.loads((ROOT / "data" / "patterns.json").read_text(encoding="utf-8"))
    expressions = json.loads((ROOT / "data" / "expressions.json").read_text(encoding="utf-8"))
    learning_paths = json.loads((ROOT / "data" / "learning-paths.json").read_text(encoding="utf-8"))
    phrasal_verbs_path = ROOT / "data" / "phrasal-verbs.json"
    if not phrasal_verbs_path.exists():
        fail("Required file is missing: data/phrasal-verbs.json")
    phrasal_verbs = json.loads(phrasal_verbs_path.read_text(encoding="utf-8"))
    verb_maps_path = ROOT / "data" / "verb-maps.json"
    if not verb_maps_path.exists():
        fail("Required file is missing: data/verb-maps.json")
    verb_maps = json.loads(verb_maps_path.read_text(encoding="utf-8"))

    pattern_ids = {item.get("id") for item in patterns}
    expression_ids = {item.get("id") for item in expressions}
    verb_ids = {item.get("id") for item in json.loads((ROOT / "data" / "verbs.json").read_text(encoding="utf-8"))}

    active_set = learning_paths.get("activeSpeakingSet") or {}
    if not active_set.get("expressionIds"):
        fail("learning-paths.json activeSpeakingSet.expressionIds is required")
    for verb_id in active_set.get("verbIds") or []:
        if verb_id not in verb_ids:
            fail(f"activeSpeakingSet references unknown verbId: {verb_id}")
    for expression_id in active_set.get("expressionIds") or []:
        if expression_id not in expression_ids:
            fail(f"activeSpeakingSet references unknown expressionId: {expression_id}")
    for pack in active_set.get("unlockPacks") or []:
        for expression_id in pack.get("expressionIds") or []:
            if expression_id not in expression_ids:
                fail(f"activeSpeakingSet unlock pack references unknown expressionId: {expression_id}")
    for pack in active_set.get("verbUnlockPacks") or []:
        for verb_id in pack.get("verbIds") or []:
            if verb_id not in verb_ids:
                fail(f"activeSpeakingSet verbUnlockPack references unknown verbId: {verb_id}")
        for expression_id in pack.get("expressionIds") or []:
            if expression_id not in expression_ids:
                fail(f"activeSpeakingSet verbUnlockPack references unknown expressionId: {expression_id}")

    for group in phrasal_verbs.get("groups") or []:
        for expression_id in group.get("expressionIds") or []:
            if expression_id not in expression_ids:
                fail(f"phrasal-verbs.json references unknown expressionId: {expression_id}")
        verb_id = group.get("coreVerbId")
        if verb_id and verb_id not in verb_ids:
            fail(f"phrasal-verbs.json references unknown coreVerbId: {verb_id}")
    group_id_set = {group.get("id") for group in (phrasal_verbs.get("groups") or []) if group.get("id")}
    for stage in phrasal_verbs.get("stages") or []:
        for group_id in stage.get("groupIds") or []:
            if group_id not in group_id_set:
                fail(f"phrasal-verbs.json stage references unknown groupId: {group_id}")

    weights = active_set.get("verbCurriculumWeights") or {}
    if weights:
        for verb_id in weights:
            if verb_id not in verb_ids:
                fail(f"verbCurriculumWeights references unknown verbId: {verb_id}")
        weight_sum = sum(float(v) for v in weights.values())
        if abs(weight_sum - 1.0) > 0.05:
            fail(f"verbCurriculumWeights should sum near 1.0 (got {weight_sum})")


    qa_matrices_path = ROOT / "data" / "qa-matrices.json"
    if not qa_matrices_path.exists():
        fail("Required file is missing: data/qa-matrices.json")
    qa_matrices_data = json.loads(qa_matrices_path.read_text(encoding="utf-8"))
    qa_matrices = qa_matrices_data.get("matrices") if isinstance(qa_matrices_data, dict) else qa_matrices_data
    if not isinstance(qa_matrices, list) or not qa_matrices:
        fail("qa-matrices.json must include a non-empty matrices list")
    seen_matrix_ids = set()
    for matrix in qa_matrices:
        matrix_id = matrix.get("id")
        if not matrix_id:
            fail("qa-matrices.json matrix missing id")
        if matrix_id in seen_matrix_ids:
            fail(f"qa-matrices.json contains duplicate matrix id: {matrix_id}")
        seen_matrix_ids.add(matrix_id)
        base_id = matrix.get("baseExpressionId")
        if base_id not in expression_ids:
            fail(f"qa-matrices.json references unknown baseExpressionId: {base_id}")
        verb_id = matrix.get("coreVerbId")
        if verb_id not in verb_ids:
            fail(f"qa-matrices.json references unknown coreVerbId: {verb_id}")
        forms = matrix.get("forms") or []
        if len(forms) < 4:
            fail(f"qa-matrices.json matrix {matrix_id} needs at least 4 forms")
        form_ids = {form.get("id") for form in forms}
        for required in ["statement", "question", "negative", "shortYes"]:
            if required not in form_ids:
                fail(f"qa-matrices.json matrix {matrix_id} missing required form: {required}")
        for form in forms:
            if not form.get("en") or not form.get("ko"):
                fail(f"qa-matrices.json matrix {matrix_id} form {form.get('id')} needs en and ko")

    phrasal_qa_path = ROOT / "data" / "phrasal-qa-matrices.json"
    if not phrasal_qa_path.exists():
        fail("Required file is missing: data/phrasal-qa-matrices.json")
    phrasal_qa_data = json.loads(phrasal_qa_path.read_text(encoding="utf-8"))
    phrasal_qa = phrasal_qa_data.get("matrices") if isinstance(phrasal_qa_data, dict) else phrasal_qa_data
    if not isinstance(phrasal_qa, list) or not phrasal_qa:
        fail("phrasal-qa-matrices.json must include a non-empty matrices list")
    phrasal_expression_ids = set()
    for group in phrasal_verbs.get("groups") or []:
        for expression_id in group.get("expressionIds") or []:
            phrasal_expression_ids.add(expression_id)
    seen_phrasal_matrix_ids = set()
    for matrix in phrasal_qa:
        matrix_id = matrix.get("id")
        if not matrix_id:
            fail("phrasal-qa-matrices.json matrix missing id")
        if matrix_id in seen_matrix_ids:
            fail(f"phrasal-qa-matrices.json id collides with ASS qa-matrices: {matrix_id}")
        if matrix_id in seen_phrasal_matrix_ids:
            fail(f"phrasal-qa-matrices.json duplicate id: {matrix_id}")
        seen_phrasal_matrix_ids.add(matrix_id)
        base_id = matrix.get("baseExpressionId")
        if base_id not in expression_ids:
            fail(f"phrasal-qa-matrices.json references unknown baseExpressionId: {base_id}")
        if base_id not in phrasal_expression_ids:
            fail(f"phrasal-qa-matrices.json baseExpressionId not in phrasal set: {base_id}")
        verb_id = matrix.get("coreVerbId")
        if verb_id not in verb_ids:
            fail(f"phrasal-qa-matrices.json references unknown coreVerbId: {verb_id}")
        forms = matrix.get("forms") or []
        if len(forms) < 4:
            fail(f"phrasal-qa-matrices.json matrix {matrix_id} needs at least 4 forms")
        form_ids = {form.get("id") for form in forms}
        for required in ["statement", "question", "negative", "shortYes"]:
            if required not in form_ids:
                fail(f"phrasal-qa-matrices.json matrix {matrix_id} missing required form: {required}")
        for form in forms:
            if not form.get("en") or not form.get("ko"):
                fail(f"phrasal-qa-matrices.json matrix {matrix_id} form {form.get('id')} needs en and ko")

    seen_verb_ids = set()

    for verb_map in verb_maps:
        verb_id = verb_map.get("verbId")
        if not verb_id or verb_id not in verb_ids:
            fail(f"verb-maps.json references unknown verbId: {verb_id}")
        if verb_id in seen_verb_ids:
            fail(f"verb-maps.json contains duplicate verbId: {verb_id}")
        seen_verb_ids.add(verb_id)

        for route in verb_map.get("routes", []):
            route_id = route.get("routeId")
            if not route_id:
                fail(f"verb-maps.json route missing routeId for verbId {verb_id}")
            for pattern in route.get("patterns", []):
                pattern_id = pattern.get("patternId")
                if pattern_id not in pattern_ids:
                    fail(f"verb-maps.json references unknown patternId: {pattern_id}")
                combination_ids = {combo.get("id") for combo in pattern.get("combinations", [])}
                for slot in pattern.get("slots", []):
                    combination_id = slot.get("combinationId")
                    if combination_id not in combination_ids:
                        fail(f"verb-maps.json slot references unknown combinationId: {combination_id}")
                for combination in pattern.get("combinations", []):
                    if not combination.get("expressionIds"):
                        fail(f"verb-maps.json combination {combination.get('id')} must reference at least one expressionId")
                    for expression_id in combination.get("expressionIds", []):
                        if expression_id not in expression_ids:
                            fail(f"verb-maps.json references unknown expressionId: {expression_id}")

        for special_case in verb_map.get("specialCases", []):
            for combination in special_case.get("combinations", []):
                if not combination.get("expressionIds"):
                    fail(f"verb-maps.json special case combination {combination.get('id')} must reference at least one expressionId")
                for expression_id in combination.get("expressionIds", []):
                    if expression_id not in expression_ids:
                        fail(f"verb-maps.json references unknown expressionId: {expression_id}")

    print(f"✅ Validation passed — v{version}")


if __name__ == "__main__":
    main()
