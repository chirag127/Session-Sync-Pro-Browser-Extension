const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Function to convert SVG to PNG
async function convertSvgToPng(svgPath, size, outputPath) {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Read SVG file
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Create a data URL from the SVG content
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // Load the SVG as an image
    const img = await loadImage(svgDataUrl);
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, size, size);
    
    // Save the canvas as a PNG file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Generated ${outputPath}`);
  } catch (error) {
    console.error(`Error generating ${outputPath}:`, error);
  }
}

// Generate icons of different sizes
async function generateIcons() {
  const svgPath = path.join(__dirname, 'icons', 'icon.svg');
  const sizes = [16, 48, 128];
  
  for (const size of sizes) {
    const outputPath = path.join(__dirname, 'icons', `icon${size}.png`);
    await convertSvgToPng(svgPath, size, outputPath);
  }
}

// Run the icon generation
generateIcons();
