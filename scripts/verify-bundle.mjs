import fs from "node:fs";
import path from "node:path";

const required = [
  ["public/index.html", 500],
  ["public/app.js", 10000],
  ["public/theme.css", 10000],
  ["public/manifest.webmanifest", 100],
  ["public/icon.svg", 100],
  ["public/landing-pages/inner-green-3d.html", 10000],
  ["public/landing-pages/inner-green-assets/three.min.js", 100000],
  ["public/landing-pages/inner-green-assets/card-ecostove.jpg", 10000],
  ["public/landing-pages/inner-green-assets/card-ethos.jpg", 10000],
  ["public/landing-pages/inner-green-assets/lexend-latin.woff2", 10000],
  ["public/vendor/leaflet/leaflet.js", 100000],
  ["public/vendor/leaflet/leaflet.css", 10000],
  ["www/index.html", 500],
  ["www/app.js", 10000],
  ["www/theme.css", 10000],
  ["www/manifest.webmanifest", 100],
  ["www/icon.svg", 100],
  ["www/landing-pages/inner-green-3d.html", 10000],
  ["www/landing-pages/inner-green-assets/three.min.js", 100000],
  ["www/landing-pages/inner-green-assets/card-ecostove.jpg", 10000],
  ["www/landing-pages/inner-green-assets/card-ethos.jpg", 10000],
  ["www/landing-pages/inner-green-assets/lexend-latin.woff2", 10000],
  ["www/vendor/leaflet/leaflet.js", 100000],
  ["www/vendor/leaflet/leaflet.css", 10000],
  ["api/chat.js", 1000],
  ["api/dashboard.js", 1000],
  ["api/optimize.js", 100],
  ["api/report.js", 1000],
  ["api/satellite.js", 1000],
  ["api/simulate.js", 100],
  ["lib/heatMath.js", 1000],
  ["capacitor.config.js", 100],
  ["package.json", 100],
  [".github/workflows/build-apk.yml", 1000]
];

const failures = [];
for (const [file, minBytes] of required) {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required project file: ${file}`);
    continue;
  }
  const size = fs.statSync(full).size;
  if (size < minBytes) failures.push(`Suspiciously small project file: ${file} (${size} bytes; expected at least ${minBytes})`);
  else console.log(`OK ${file} — ${size.toLocaleString()} bytes`);
}

for (const root of ["public", "www"]) {
  const htmlPath = path.join(root, "index.html");
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  const localLeafletJs = root === "public" ? 'src="/vendor/leaflet/leaflet.js"' : 'src="vendor/leaflet/leaflet.js"';
  const localLeafletCss = root === "public" ? 'href="/vendor/leaflet/leaflet.css"' : 'href="vendor/leaflet/leaflet.css"';
  if (!html.includes(localLeafletJs)) failures.push(`${root}/index.html must load the locally bundled Leaflet script.`);
  if (!html.includes(localLeafletCss)) failures.push(`${root}/index.html must load the locally bundled Leaflet stylesheet.`);
  if (/unpkg\.com\/leaflet/i.test(html)) failures.push(`${root}/index.html still depends on the Leaflet CDN.`);
  if (!html.includes("landing-pages/inner-green-3d.html")) failures.push(`${root}/index.html is missing the local 3D hero entrypoint.`);
}

const hero = fs.readFileSync("www/landing-pages/inner-green-3d.html", "utf8");
if (/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js/i.test(hero)) failures.push("Android hero still depends on the Three.js CDN.");
for (const asset of ["inner-green-assets/three.min.js", "inner-green-assets/lexend-latin.woff2", "inner-green-assets/card-ethos.jpg", "inner-green-assets/card-ecostove.jpg"]) {
  if (!hero.includes(asset)) failures.push(`Android hero is missing local asset reference: ${asset}`);
}

if (failures.length) {
  console.error("\nProject verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`\nProject verification passed: ${required.length} required source, config and asset files checked.`);
