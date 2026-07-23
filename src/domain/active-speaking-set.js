/**
 * Active Speaking Set config normalize + unlock ID helpers (pure).
 * Quiz bank gate stays ASS-only — Vault/export never expand this.
 * Browser: window.ActiveSpeakingSet
 * Node: module.exports
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ActiveSpeakingSet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_ACTIVE_SPEAKING_SET = {
    "id": "ass_starter_v0",
    "title": "Active Speaking Set Starter",
    "verbIds": [
      "v_have"
    ],
    "expressionIds": [
      "e001",
      "e018",
      "e021",
      "e022",
      "e023",
      "e024",
      "e025",
      "e062",
      "e065",
      "e091",
      "e092",
      "e093",
      "e094",
      "e095",
      "e096",
      "e097",
      "e003",
      "e004",
      "e019",
      "e026",
      "e027",
      "e028",
      "e029",
      "e030",
      "e098",
      "e099",
      "e006",
      "e036",
      "e037",
      "e038",
      "e039",
      "e080",
      "e002",
      "e015",
      "e014",
      "e069",
      "e044",
      "e045",
      "e009",
      "e020"
    ],
    "unlockPacks": [
      {
        "id": "pack_1",
        "title": "Unlock pack 1",
        "expressionIds": [
          "e005",
          "e031",
          "e033",
          "e035",
          "e068",
          "e070",
          "e074",
          "e083",
          "e090",
          "e082"
        ]
      },
      {
        "id": "pack_2",
        "title": "Unlock pack 2",
        "expressionIds": [
          "e032",
          "e046",
          "e071",
          "e072",
          "e073",
          "e075",
          "e084",
          "e088",
          "e089"
        ]
      },
      {
        "id": "pack_3",
        "title": "Unlock pack 3",
        "expressionIds": [
          "e011",
          "e054",
          "e055",
          "e056",
          "e077",
          "e013",
          "e064",
          "e066",
          "e067"
        ]
      }
    ],
    "verbUnlockPacks": [
      {
        "id": "verb_pack_get",
        "title": "동사 해금 · get",
        "verbIds": [
          "v_get"
        ],
        "expressionIds": []
      },
      {
        "id": "verb_pack_take",
        "title": "동사 해금 · take",
        "verbIds": [
          "v_take"
        ],
        "expressionIds": []
      },
      {
        "id": "verb_pack_core_rest",
        "title": "동사 해금 · want·need·go·come·make",
        "verbIds": [
          "v_want",
          "v_need",
          "v_go",
          "v_come",
          "v_make"
        ],
        "expressionIds": []
      },
      {
        "id": "verb_pack_give",
        "title": "동사 해금 · give",
        "verbIds": [
          "v_give"
        ],
        "expressionIds": [
          "e007",
          "e040",
          "e042",
          "e043",
          "e041"
        ]
      },
      {
        "id": "verb_pack_be",
        "title": "동사 해금 · be",
        "verbIds": [
          "v_be"
        ],
        "expressionIds": [
          "e008",
          "e016",
          "e059",
          "e060"
        ]
      },
      {
        "id": "verb_pack_do",
        "title": "동사 해금 · do",
        "verbIds": [
          "v_do"
        ],
        "expressionIds": [
          "e017",
          "e049",
          "e050"
        ]
      },
      {
        "id": "verb_pack_put",
        "title": "동사 해금 · put",
        "verbIds": [
          "v_put"
        ],
        "expressionIds": [
          "e010",
          "e051",
          "e052",
          "e076"
        ]
      },
      {
        "id": "verb_pack_keep",
        "title": "동사 해금 · keep",
        "verbIds": [
          "v_keep"
        ],
        "expressionIds": [
          "e011",
          "e054",
          "e055",
          "e056",
          "e077"
        ]
      },
      {
        "id": "verb_pack_find",
        "title": "동사 해금 · find",
        "verbIds": [
          "v_find"
        ],
        "expressionIds": [
          "e012",
          "e057",
          "e058",
          "e063"
        ]
      }
    ],
    "verbCurriculumWeights": {
      "v_have": 0.4,
      "v_get": 0.25,
      "v_take": 0.15,
      "v_need": 0.05,
      "v_want": 0.05,
      "v_go": 0.04,
      "v_come": 0.03,
      "v_make": 0.03
    },
    "unlockThreshold": 0.7,
    "masteryThreshold": 3
  };

  function normalizeAssConfig(raw) {
    const base = raw && typeof raw === 'object' ? raw : {};
    return {
      ...DEFAULT_ACTIVE_SPEAKING_SET,
      ...base,
      verbIds: Array.isArray(base.verbIds) && base.verbIds.length
        ? base.verbIds.slice()
        : DEFAULT_ACTIVE_SPEAKING_SET.verbIds.slice(),
      expressionIds: Array.isArray(base.expressionIds) && base.expressionIds.length
        ? base.expressionIds.slice()
        : DEFAULT_ACTIVE_SPEAKING_SET.expressionIds.slice(),
      unlockPacks: Array.isArray(base.unlockPacks)
        ? base.unlockPacks.map((pack, index) => ({
          id: pack?.id || `pack_${index + 1}`,
          title: pack?.title || `Unlock pack ${index + 1}`,
          expressionIds: Array.isArray(pack?.expressionIds) ? pack.expressionIds.slice() : [],
        }))
        : DEFAULT_ACTIVE_SPEAKING_SET.unlockPacks.map(pack => ({ ...pack, expressionIds: pack.expressionIds.slice() })),
      verbUnlockPacks: Array.isArray(base.verbUnlockPacks)
        ? base.verbUnlockPacks.map((pack, index) => ({
          id: pack?.id || `verb_pack_${index + 1}`,
          title: pack?.title || `Verb unlock ${index + 1}`,
          verbIds: Array.isArray(pack?.verbIds) ? pack.verbIds.slice() : [],
          expressionIds: Array.isArray(pack?.expressionIds) ? pack.expressionIds.slice() : [],
        }))
        : (DEFAULT_ACTIVE_SPEAKING_SET.verbUnlockPacks || []).map(pack => ({
          ...pack,
          verbIds: (pack.verbIds || []).slice(),
          expressionIds: (pack.expressionIds || []).slice(),
        })),
      unlockThreshold: Number.isFinite(base.unlockThreshold) ? base.unlockThreshold : DEFAULT_ACTIVE_SPEAKING_SET.unlockThreshold,
      masteryThreshold: Number.isFinite(base.masteryThreshold) ? base.masteryThreshold : DEFAULT_ACTIVE_SPEAKING_SET.masteryThreshold,
      verbCurriculumWeights: base.verbCurriculumWeights && typeof base.verbCurriculumWeights === 'object'
        ? { ...base.verbCurriculumWeights }
        : { ...(DEFAULT_ACTIVE_SPEAKING_SET.verbCurriculumWeights || {}) },
    };
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getUnlockedPackCount(curriculum, config) {
    const maxPacks = (config?.unlockPacks || []).length;
    const stored = Number(curriculum?.unlockedPackCount || 0);
    return clampValue(Number.isFinite(stored) ? stored : 0, 0, maxPacks);
  }

  function listUnlockedExpressionIds(config, curriculum, options = {}) {
    const cfg = normalizeAssConfig(config);
    const packCount = options.packCount != null
      ? options.packCount
      : getUnlockedPackCount(curriculum, cfg);
    const ids = cfg.expressionIds.slice();
    cfg.unlockPacks.slice(0, packCount).forEach(pack => {
      (pack.expressionIds || []).forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    if (options.includeVerbPacks !== false && options.verbGate) {
      options.verbGate.getUnlockedVerbExpressionIds(cfg, curriculum || {}).forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    }
    return ids;
  }

  function isExpressionInUnlockedSet(expressionId, config, curriculum, options = {}) {
    if (!expressionId) return false;
    return listUnlockedExpressionIds(config, curriculum, options).includes(expressionId);
  }

  return {
    DEFAULT_ACTIVE_SPEAKING_SET,
    normalizeAssConfig,
    getUnlockedPackCount,
    listUnlockedExpressionIds,
    isExpressionInUnlockedSet,
    clampValue,
  };
});
