const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

/**
 * Generates a simulated classroom image with watermark and timestamp
 * @param {string} className Name of the class (e.g. "Class V")
 * @param {string} filename Output filename
 * @returns {Promise<string>} The relative path to the saved image
 */
async function generateClassroomSnapshot(className, filename) {
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'snapshots');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const outputPath = path.join(uploadDir, filename);

  try {
    // Create an image (800x600) with a warm classroom background color (beige/light grey)
    const image = await new Promise((resolve, reject) => {
      new Jimp(800, 500, 0xEDE8F5FF, (err, img) => {
        if (err) reject(err);
        else resolve(img);
      });
    });

    // Draw a "Chalkboard" (Green rectangle)
    // Jimp coordinates: Scan or fill
    image.scan(100, 50, 600, 200, function(x, y, idx) {
      this.bitmap.data[idx] = 16;     // R
      this.bitmap.data[idx + 1] = 90; // G
      this.bitmap.data[idx + 2] = 40; // B
      this.bitmap.data[idx + 3] = 255;// A
    });

    // Draw board border (brown)
    image.scan(90, 40, 620, 10, function(x, y, idx) {
      this.bitmap.data[idx] = 139; this.bitmap.data[idx+1] = 69; this.bitmap.data[idx+2] = 19; this.bitmap.data[idx+3] = 255;
    });
    image.scan(90, 250, 620, 10, function(x, y, idx) {
      this.bitmap.data[idx] = 139; this.bitmap.data[idx+1] = 69; this.bitmap.data[idx+2] = 19; this.bitmap.data[idx+3] = 255;
    });
    image.scan(90, 50, 10, 200, function(x, y, idx) {
      this.bitmap.data[idx] = 139; this.bitmap.data[idx+1] = 69; this.bitmap.data[idx+2] = 19; this.bitmap.data[idx+3] = 255;
    });
    image.scan(700, 50, 10, 200, function(x, y, idx) {
      this.bitmap.data[idx] = 139; this.bitmap.data[idx+1] = 69; this.bitmap.data[idx+2] = 19; this.bitmap.data[idx+3] = 255;
    });

    // Draw some stylized Desks at the bottom (brown rectangles)
    image.scan(150, 380, 120, 60, function(x, y, idx) {
      this.bitmap.data[idx] = 205; this.bitmap.data[idx+1] = 133; this.bitmap.data[idx+2] = 63; this.bitmap.data[idx+3] = 255;
    });
    image.scan(340, 380, 120, 60, function(x, y, idx) {
      this.bitmap.data[idx] = 205; this.bitmap.data[idx+1] = 133; this.bitmap.data[idx+2] = 63; this.bitmap.data[idx+3] = 255;
    });
    image.scan(530, 380, 120, 60, function(x, y, idx) {
      this.bitmap.data[idx] = 205; this.bitmap.data[idx+1] = 133; this.bitmap.data[idx+2] = 63; this.bitmap.data[idx+3] = 255;
    });

    // Load fonts
    const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    const font8 = await Jimp.loadFont(Jimp.FONT_SANS_8_WHITE);

    // Chalkboard Text
    image.print(font16, 120, 80, "VIDYA BHARATHI VIDYAPEETH");
    image.print(font16, 120, 120, `Class: ${className}`);
    image.print(font16, 120, 160, "Topic: Daily Academic Schedule");

    // Add Timestamp at the bottom right corner
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = new Date().toLocaleDateString('en-US');
    const stampText = `${dateStr}  ${timeStr}`;
    image.print(font16, 500, 460, stampText);

    // Add Watermark across the center
    // We print watermarks multiple times diagonally or overlay
    const watermarkText = "VIDYA BHARATHI VIDYAPEETH - SECURITY WATERMARK";
    
    // Custom transparent print
    // To make it feel premium, let's write it in a faint gray
    const fontWatermark = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    
    // Center of the image watermark
    image.print(fontWatermark, 100, 280, watermarkText);

    // Save image to output path
    await image.writeAsync(outputPath);
    return `/uploads/snapshots/${filename}`;
  } catch (error) {
    console.error('Failed to generate snapshot image:', error);
    throw error;
  }
}

module.exports = {
  generateClassroomSnapshot
};
