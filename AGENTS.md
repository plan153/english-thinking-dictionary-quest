# AGENTS.md

## Cursor Cloud specific instructions

This is a static, dependency-light PWA web app. The entire client lives in `index.html` with content sourced from `data/*.json`. There is no build step and no backend.

### Services
- **Web app (only service):** static files served over HTTP. Run it with `npm run serve` (Python `http.server` on port `8766`) and open `http://localhost:8766/index.html`. Serving over HTTP (not `file://`) is required for the PWA/service-worker and `fetch` of `data/*.json` to work.

### Test / lint / build
- **Test + "lint":** `npm test` (which runs `python3 scripts/validate.py`). This is the only automated check; there is no separate linter. It validates `VERSION`/`version.json`/`index.html`/`service-worker.js` version consistency and cross-references between `data/*.json` files. The same script runs in the `validate.yml` / `deploy-pages.yml` GitHub Actions.
- **Build:** none. Deployment publishes the repo root as-is to GitHub Pages.

### Non-obvious notes
- Version strings are duplicated across `VERSION`, `version.json`, `index.html` (the `data-app-version` badge and `APP_CACHE_VERSION`), and `service-worker.js`. `scripts/validate.py` fails if they drift; use `scripts/bump_version.py` (via `scripts/release.sh`) to change versions consistently.
- Learning progress is stored in browser `localStorage` (key `etdQuestProgress`); there is no server-side state.
- The `playwright` devDependency is only used for optional local QA screenshots, not for the app or the required validation.
