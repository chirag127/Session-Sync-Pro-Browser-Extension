/**
 * Script to generate icons for the extension
 */

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG icon template
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a6cf7" />
      <stop offset="100%" stop-color="#3a5ce5" />
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="108" height="108" rx="20" fill="url(#gradient)" />
  <path d="M40 64 L60 84 L88 44" stroke="white" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M64 94 C81.673 94 96 79.673 96 62 C96 44.327 81.673 30 64 30 C46.327 30 32 44.327 32 62" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" />
</svg>
`;

// Save SVG icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);

// Function to convert SVG to PNG
function convertSvgToPng(size) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      
      // Convert canvas to PNG
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      
      // Save PNG file
      fs.writeFileSync(
        path.join(iconsDir, `icon${size}.png`),
        Buffer.from(base64Data, 'base64')
      );
      
      resolve();
    };
    
    img.onerror = reject;
    img.src = `data:image/svg+xml;base64,${Buffer.from(svgIcon).toString('base64')}`;
  });
}

// Generate PNG icons
async function generateIcons() {
  try {
    await Promise.all([
      convertSvgToPng(16),
      convertSvgToPng(48),
      convertSvgToPng(128)
    ]);
    console.log('Icons generated successfully');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the icon generation
generateIcons();
