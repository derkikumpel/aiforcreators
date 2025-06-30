import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';

const toolsPath = './data/tools.json';
const outputDir = './tools';
const placeholderImage = './logo/logoAfc.png';

// Optional: Cloudinary (set as env or directly here)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'yourcloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'apikey',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'apisecret'
});

async function generateScreenshot(url, slug) {
  const filePath = `screenshots/${slug}.png`;

  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.setViewport({ width: 1200, height: 800 });
    await fs.ensureDir('screenshots');
    await page.screenshot({ path: filePath });
    await browser.close();

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'aiforchemists',
      public_id: slug,
      overwrite: true
    });

    return result.secure_url;
  } catch (err) {
    console.error(`❌ Screenshot failed for ${url}:`, err.message);
    return placeholderImage;
  }
}

async function generateDetailPage(tool) {
  const filePath = path.join(outputDir, `${tool.slug}.html`);
  if (await fs.pathExists(filePath)) return;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${tool.name} – AI Tool</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <div class="detail-container">
    <h1>${tool.name}</h1>
    <img src="${tool.image}" alt="${tool.name}" class="detail-image"/>
    <p>${tool.description}</p>
    <a href="${tool.url}" target="_blank" class="external-link">Visit ${tool.name}</a>
  </div>
</body>
</html>`;

  await fs.outputFile(filePath, html);
  console.log(`✅ Generated: ${tool.slug}.html`);
}

async function main() {
  const tools = await fs.readJSON(toolsPath);
  const updated = [];

  for (const tool of tools) {
    const updatedTool = { ...tool };

    if (!tool.image || tool.image.includes('placeholder')) {
      const img = await generateScreenshot(tool.url, tool.slug);
      updatedTool.image = img;
      console.log(`📷 Screenshot for ${tool.slug}`);
    }

    await generateDetailPage(updatedTool);
    updated.push(updatedTool);
  }

  await fs.writeJSON(toolsPath, updated, { spaces: 2 });
  console.log('✅ All tools updated with details and screenshots.');
}

main();

