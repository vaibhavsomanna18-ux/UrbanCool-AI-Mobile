# UrbanCool AI

**Urban heat intelligence, mitigation simulation, and intervention optimization.**

Project title: *Optimizing Urban Heat Mitigation and Cooling Strategies via Artificial Intelligence and Machine Learning.*

## Repository layout

- `public/` — main web frontend (HTML, CSS, JavaScript, map UI, PWA assets and hero page).
- `api/` — backend endpoints for dashboard, satellite analysis, simulation, optimization, chat and zone reports.
- `lib/heatMath.js` — shared heat analytics, percentile scoring, intervention simulation and optimization logic.
- `hatchable.toml` — Hatchable project configuration.
- `www/` — frontend snapshot used by the Capacitor Android wrapper.
- `capacitor.config.js`, `package.json` — Android wrapper configuration.
- `.github/workflows/build-apk.yml` — automated Android APK build workflow.

## Data and model notes

- Satellite analysis discovers Landsat Collection 2 Level-2 scenes through STAC and derives LST, NDVI and NDBI for city zones.
- Satellite observations are periodic, not a continuous real-time stream; cloud and NoData conditions may affect individual zones.
- Hotspot scores are relative analytical indices, not probabilities of a heatwave or health outcome.
- Cooling outputs are model-estimated scenarios, not experimentally measured intervention effects.
- Keep observed, derived, predicted and simulated values clearly distinguished.

## Running / deployment

The `public/`, `api/`, `lib/` and `hatchable.toml` files are the source export of the Hatchable-hosted application. The live deployment currently remains at https://urbancool-ai.hatchable.site. The API source uses Hatchable runtime conventions, so deploying the backend elsewhere requires replacing platform-specific runtime integrations and configuring external data services.

The Android wrapper uses Capacitor and GitHub Actions. Live satellite, weather, map-tile and API functionality requires network access.

## Important

Do not commit secrets, API keys, credentials, or private user data. Configure provider credentials in the deployment environment.
