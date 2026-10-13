import fs from "node:fs";
import path from "node:path";

const required = [
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
  ["www/vendor/leaflet/images/marker-icon.png", 500],
  ["www/vendor/leaflet/images/marker-icon-2x.png", 1000],
  ["www/vendor/leaflet/images/marker-shadow.png", 300],
  ["www/vendor/leaflet/images/layers.png", 300],
  ["www/vendor/leaflet/images/layers-2x.png", 500]
];
const failures = [];
for (const [file, minBytes] of required) {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required bundle file: ${file}`);
    continue;
  }
  const size = fs.statSync(full).size;
  if (size < minBytes) failures.push(`Suspiciously small bundle file: ${file} (${size} bytes; expected at least ${minBytes})`);
  else console.log(`OK ${file} — ${size.toLocaleString()} bytes`);
}
const html = fs.readFileSync("www/index.html", "utf8");
if (!html.includes('src="vendor/leaflet/leaflet.js"')) failures.push("Android entrypoint must load the locally bundled Leaflet script.");
if (!html.includes('href="vendor/leaflet/leaflet.css"')) failures.push("Android entrypoint must load the locally bundled Leaflet stylesheet.");
if (html.includes("unpkg.com/leaflet")) failures.push("Android entrypoint still depends on the Leaflet CDN.");
if (failures.length) {
  console.error("\nBundle verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`\nBundle verification passed: ${required.length} required files checked.`);
