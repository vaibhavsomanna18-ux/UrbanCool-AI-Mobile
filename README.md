# UrbanCool AI — Source and Android Build

**Project:** Optimizing Urban Heat Mitigation and Cooling Strategies via Artificial Intelligence and Machine Learning  
**Live website:** https://urbancool-ai.hatchable.site  
**Android source repository:** https://github.com/vaibhavsomanna18-ux/UrbanCool-AI-Mobile

This repository contains the web frontend, bundled Android frontend, backend endpoint source, shared heat analytics, satellite processing, report generation, and Android build workflow.

## Get the Android APK

1. Open [GitHub Actions](https://github.com/vaibhavsomanna18-ux/UrbanCool-AI-Mobile/actions/workflows/build-apk.yml).
2. Select the latest successful **Build UrbanCool AI APK** run.
3. Under **Artifacts**, download **UrbanCool-AI-debug**.
4. Extract the ZIP and install `app-debug.apk` on an Android device. Android may ask you to allow installation from your browser or file manager.

The APK is a debug build, not a Play Store-signed release. The workflow rebuilds it from the checked-in `www/` frontend and attaches the APK as a build artifact.

## Project structure

- `public/` — web-hosted frontend.
- `www/` — local frontend bundle packaged by Capacitor for Android.
- `public/app.js`, `www/app.js` — navigation, maps, heat intelligence, prediction, simulation, optimization, recommendations, reports, FAQ and chatbot UI.
- `public/theme.css`, `www/theme.css` — responsive UI styling.
- `public/landing-pages/inner-green-3d.html` — animated Three.js hero.
- `public/landing-pages/inner-green-assets/`, `www/landing-pages/inner-green-assets/` — locally bundled hero images, font and Three.js r160 (the version referenced by the scene).
- `public/vendor/leaflet/`, `www/vendor/leaflet/` — locally bundled Leaflet JS, CSS and map-control images.
- `api/satellite.js` — Landsat Collection 2 Level-2 scene search and zone-level LST, NDVI and NDBI processing.
- `api/dashboard.js` — overview/dashboard inputs and model summary.
- `api/simulate.js` — cooling scenario simulation endpoint.
- `api/optimize.js` — constrained intervention optimization endpoint.
- `api/chat.js` — project-aware AI chatbot endpoint.
- `api/report.js` — zone research report generation endpoint.
- `lib/heatMath.js` — shared hotspot scoring, driver contributions, scenario simulation and intervention ranking.
- `.github/workflows/build-apk.yml` — Android APK build and artifact upload.
- `.github/workflows/sync-landing-assets.yml` — repeatable download and bundling of third-party static assets.
- `capacitor.config.js` — Capacitor app configuration and local web directory.

## Data interpretation and limitations

- Landsat measurements are scene-based snapshots, not a continuous real-time satellite feed. Cloud cover and missing pixels can result in NoData zones.
- LST is derived from satellite surface-temperature data; NDVI and NDBI are derived from surface-reflectance bands.
- The hotspot score is a relative city-zone index, not a probability of a heat event.
- Predicted and simulated cooling values are model estimates, not measured field outcomes.
- The dashboard can include clearly labeled model-derived/demo spatial context; do not present that fallback as a satellite observation.
- OpenStreetMap map tiles, Open-Meteo weather, Microsoft Planetary Computer Landsat catalog/raster processing, and hosted Hatchable API endpoints require internet access.

## Deployment notes

The hosted backend uses Hatchable runtime conventions. Moving it to another provider requires adapting those endpoint imports and configuring the relevant runtime. The Android app bundles the frontend locally but currently calls the hosted UrbanCool API for backend features, so it is not a fully offline app.

Do not commit API keys or credentials. Configure provider secrets in the hosting environment.
