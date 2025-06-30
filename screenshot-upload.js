const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs-extra');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function takeScreenshot(url, filename) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // wichtig für GitHub Actions
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.screenshot({ path: filename, fullPage: false });
  await browser.close();
}

async function uploadImage(filename, publicId) {
  const result = await cloudinary.uploader.upload(filename, {
    public_id: publicId,
    overwrite: true,
    resource_type: 'image'
  });
  return result.secure_url;
}

async function main() {
  const toolsPath = path.join(__dirname, 'data', 'tools.json');
  let tools = await fs.readJson(toolsPath);

  // Erstelle Ordner screenshots, falls nicht vorhanden
  const screenshotDir = path.join(__dirname, 'screenshots');
  await fs.ensureDir(screenshotDir);

  for (const tool of tools) {
    console.log(`Processing ${tool.name}...`);

    const screenshotFile = path.join(screenshotDir, `${tool.slug}.png`);

    try {
      await takeScreenshot(tool.url, screenshotFile);
      const imageUrl = await uploadImage(screenshotFile, `tools/${tool.slug}`);
      tool.image = imageUrl;
      await fs.remove(screenshotFile);
      console.log(`Uploaded screenshot for ${tool.name}`);
    } catch (error) {
      console.error(`Error processing ${tool.name}:`, error.message);
    }
  }

  await fs.writeJson(toolsPath, tools, { spaces: 2 });
  console.log('tools.json updated with image URLs');
}

main();
