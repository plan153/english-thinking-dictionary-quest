# Tech Stack
- Vanilla HTML/CSS/JavaScript only; no React/Flutter/external npm packages for app work.
- Static files served directly by browser or `python3 -m http.server`; JSON `fetch()` features need HTTP server rather than `file://`.
- Validation script is Python: `scripts/validate.py`.
- GitHub Actions deploy static root to Pages and run `python3 scripts/validate.py`.