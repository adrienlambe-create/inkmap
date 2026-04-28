const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const fontPath = path.resolve(__dirname, '..', 'syne-800.ttf');
const outPath = path.resolve(__dirname, '..', 'logo-email.png');

const fontB64 = fs.readFileSync(fontPath).toString('base64');

const width = 600;
const height = 160;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'Syne';
        font-weight: 800;
        src: url(data:font/ttf;base64,${fontB64}) format('truetype');
      }
      .l { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 96px; letter-spacing: 4px; }
      .ink { fill: #0d0d0d; }
      .map { fill: #c0392b; }
    </style>
  </defs>
  <text x="${width / 2}" y="105" text-anchor="middle" class="l">
    <tspan class="ink">INK</tspan><tspan class="map">MAP</tspan>
  </text>
  <rect x="${width / 2 - 25}" y="128" width="50" height="3" fill="#c0392b"/>
</svg>`;

sharp(Buffer.from(svg), { density: 288 })
  .resize(width * 2, height * 2)
  .png()
  .toFile(outPath)
  .then(info => console.log('Generated', outPath, info))
  .catch(err => { console.error(err); process.exit(1); });
