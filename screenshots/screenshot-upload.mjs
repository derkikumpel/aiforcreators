// screenshot-upload.mjs

import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Ermittle Verzeichnis relativ zur Datei
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 Cloudinary Konfiguration (über GitHub Secrets setzen)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function takeScreenshot(url, filepath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.screenshot({ path: filepath, fullPage: false });

  await browser.close();
}

async function uploadToCloudinary(filepath, publicId) {
  const result = await cloudinary.uploader.upload(filepath, {
    public_id: publicId,
    folder: 'chemtools',
    overwrite: true
  });
  return result.secure_url;
}

async function main() {
  const toolsPath = path.join(__dirname, '../data/tools.json');
  const screenshotDir = path.join(__dirname, '../screenshots');

  await fs.ensureDir(screenshotDir);
  let tools = await fs.readJson(toolsPath);

  let counter = 0;
  for (const tool of tools) {
    if (tool.image) continue;

    const filename = `${tool.slug}.png`;
    const filepath = path.join(screenshotDir, filename);

    try {
      console.log(`📸 Screenshot für ${tool.name}...`);
      await takeScreenshot(tool.url, filepath);

      console.log(`☁️ Hochladen zu Cloudinary...`);
      const imageUrl = await uploadToCloudinary(filepath, tool.slug);
      tool.image = imageUrl;

      await fs.remove(filepath);
      counter++;
      console.log(`✅ Fertig: ${tool.name}`);
    } catch (err) {
      console.error(`❌ Fehler bei ${tool.name}:`, err.message);
    }
  }

  await fs.writeJson(toolsPath, tools, { spaces: 2 });
  console.log(`🎉 tools.json aktualisiert (${counter} neue Bilder).`);
}

main();

