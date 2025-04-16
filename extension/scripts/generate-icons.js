const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '../src/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Base SVG icon
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a6cf7" />
      <stop offset="100%" stop-color="#2541b2" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#gradient)" />
  <g fill="#ffffff">
    <!-- Stylized "S" for Session -->
    <path d="M256 120c-55.2 0-100 44.8-100 100s44.8 100 100 100 100-44.8 100-100-44.8-100-100-100zm0 180c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" />
    <!-- Sync arrows -->
    <path d="M370 292l-30-30c-5.9-5.9-15.4-5.9-21.2 0l-30 30c-5.9 5.9-5.9 15.4 0 21.2 5.9 5.9 15.4 5.9 21.2 0l4-4v33c0 8.3 6.7 15 15 15s15-6.7 15-15v-33l4 4c5.9 5.9 15.4 5.9 21.2 0 5.9-5.8 5.9-15.3 0-21.2z" />
    <path d="M142 220l30 30c5.9 5.9 15.4 5.9 21.2 0l30-30c5.9-5.9 5.9-15.4 0-21.2-5.9-5.9-15.4-5.9-21.2 0l-4 4v-33c0-8.3-6.7-15-15-15s-15 6.7-15 15v33l-4-4c-5.9-5.9-15.4-5.9-21.2 0-5.9 5.8-5.9 15.3 0 21.2z" />
  </g>
</svg>
`;

// Save the SVG file
fs.writeFileSync(path.join(assetsDir, 'logo.svg'), svgIcon);

// Icon sizes for the extension
const sizes = [16, 32, 48, 64, 128];

// Generate PNG icons in different sizes
async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(path.join(assetsDir, `icon${size}.png`));
      
      console.log(`Generated icon${size}.png`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
