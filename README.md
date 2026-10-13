# UrbanCool AI — Website Source

The repository contains the source export of the UrbanCool AI capstone website, including the web UI, backend endpoint source, shared heat analytics, reports, satellite processing, and site configuration.

**Project:** Optimizing Urban Heat Mitigation and Cooling Strategies via Artificial Intelligence and Machine Learning  
**Live website:** https://urbancool-ai.hatchable.site

## Website source map

- `public/index.html` — website entry point and page structure.
- `public/app.js` — interactive interface and client-side workflows.
- `public/theme.css` — visual design and responsive styling.
- `public/landing-pages/` — animated hero page and its Three.js scene.
- `public/manifest.webmanifest`, `public/sw.js`, `public/icon.svg` — web app metadata and icon assets.
- `public/threeui-sylva-hero.json` — hero component configuration.
- `api/dashboard.js` — dashboard data.
- `api/satellite.js` — Landsat scene search and zone-level LST, NDVI and NDBI processing.
- `api/simulate.js` — cooling scenario simulation.
- `api/optimize.js` — constrained intervention optimization.
- `api/chat.js` — project-aware chatbot endpoint.
- `api/report.js` — zone report generation.
- `lib/heatMath.js` — shared hotspot scoring, drivers, scenario calculations and optimization logic.
- `hatchable.toml` — hosting/runtime configuration.

## Data interpretation

- Landsat observations are scene-based, not a continuous real-time satellite feed. Clouds and missing pixels can produce NoData zones.
- LST is derived from satellite surface-temperature products; NDVI and NDBI are derived from surface reflectance.
- Hotspot scores are relative analytical indices, not probabilities.
- Cooling and optimization outputs are model-estimated scenarios, not measured field outcomes.
- The UI should distinguish observed, derived, predicted and simulated quantities.

## Deployment

The live version uses Hatchable's hosting/runtime conventions. The frontend source is included here, but deploying the backend to a different provider requires adapting the Hatchable endpoint/runtime integration and configuring the necessary external services. External map tiles, satellite data endpoints and the animated hero's remote resources require internet access.

No API keys or secrets should be committed. Configure provider credentials in the hosting environment.
