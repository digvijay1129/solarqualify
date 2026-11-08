# Phase 3.9 — Checks

## Included utility test coverage

- Annual generation assumption and invalid capacities
- Currency formatting and pending approved-rate handling
- Email validation
- Lead wizard steps 1–4 required fields and invalid values
- Bill file type, size and empty file validation
- Profile required fields and contact validation
- Support topic and message length validation
- Document search/category/status filtering
- Milestone progress calculation and clamping
- File-size formatting

Run in the existing repo after extracting and registering the route:

```powershell
npm test --workspace=@solarqualify/client
npm run build --workspace=@solarqualify/client
git diff --check
```

Artifact-assembly checks: all 5 `.js` source files passed Node syntax checks; all 16 `.jsx` files parsed with TypeScript's JavaScript/JSX parser without errors; 28 Vitest test cases are included; 31 independent runtime assertions passed against the utility functions; and all internal relative imports resolved. Two existing Phase 3.2/3.8 image assets are intentionally reused: `solarqualify-hero-rooftop.jpg` and `solarqualify-brand-logo.png`. Local Vite build and full Vitest execution must still be run in the user's actual repository because this package depends on the existing SolarQualify app shell, Tailwind tokens, and installed dependencies.
