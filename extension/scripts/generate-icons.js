const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure the icons directory exists
const iconsDir = path.join(__dirname, '../src/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG icon content
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a6cf7" />
      <stop offset="100%" stop-color="#2541b2" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="20" fill="url(#gradient)" />
  <path d="M94 42H34c-2.2 0-4 1.8-4 4v36c0 2.2 1.8 4 4 4h60c2.2 0 4-1.8 4-4V46c0-2.2-1.8-4-4-4z" fill="white" />
  <path d="M64 34v60M34 64h60" stroke="white" stroke-width="6" stroke-linecap="round" />
  <circle cx="64" cy="64" r="8" fill="url(#gradient)" />
  <circle cx="64" cy="34" r="6" fill="white" />
  <circle cx="64" cy="94" r="6" fill="white" />
  <circle cx="34" cy="64" r="6" fill="white" />
  <circle cx="94" cy="64" r="6" fill="white" />
</svg>
`;

// Save the SVG file
const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log(`Created SVG icon: ${svgPath}`);

// Generate PNG icons in different sizes
const sizes = [16, 32, 48, 64, 96, 128];

async function generateIcons() {
  for (const size of sizes) {
    const pngPath = path.join(iconsDir, `icon-${size}.png`);
    
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(pngPath);
    
    console.log(`Created ${size}x${size} PNG icon: ${pngPath}`);
  }
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
