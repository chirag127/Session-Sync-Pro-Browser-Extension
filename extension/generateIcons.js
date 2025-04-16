const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * Script to generate PNG icons from SVG using Sharp
 */

// Function to convert SVG to PNG
async function convertSvgToPng(svgPath, size, outputPath) {
    try {
        // Read SVG file
        const svgBuffer = fs.readFileSync(svgPath);

        // Resize and convert to PNG
        await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

        console.log(`Generated ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`Error generating ${outputPath}:`, error);
        return false;
    }
}

// Generate icons of different sizes
async function generateIcons() {
    console.log("Generating icons...");

    // Make sure the icons directory exists
    const iconsDir = path.join(__dirname, "icons");
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    const svgPath = path.join(__dirname, "icons", "icon.svg");
    const globeSvgPath = path.join(__dirname, "icons", "globe.svg");

    // Check if SVG files exist
    if (!fs.existsSync(svgPath)) {
        console.error(`SVG icon not found: ${svgPath}`);
        return false;
    }

    // Generate icons of different sizes
    const sizes = [16, 48, 128];
    const results = [];

    for (const size of sizes) {
        const outputPath = path.join(iconsDir, `icon${size}.png`);
        results.push(await convertSvgToPng(svgPath, size, outputPath));
    }

    // Generate globe icon if SVG exists
    if (fs.existsSync(globeSvgPath)) {
        const globeOutputPath = path.join(iconsDir, "globe.png");
        results.push(await convertSvgToPng(globeSvgPath, 16, globeOutputPath));
    } else {
        console.warn(`Globe SVG icon not found: ${globeSvgPath}`);
    }

    if (results.every((result) => result)) {
        console.log("All icons generated successfully!");
        return true;
    } else {
        console.warn("Some icons failed to generate. Check the errors above.");
        return false;
    }
}

// Run the icon generation
generateIcons().catch((error) => {
    console.error("Error generating icons:", error);
    process.exit(1);
});
