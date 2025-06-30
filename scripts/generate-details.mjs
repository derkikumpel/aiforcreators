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
import fs from 'fs-extra';
import path from 'path';

async function generateDetailPages() {
  const toolsPath = path.join(process.cwd(), 'data', 'tools.json');
  const tools = await fs.readJson(toolsPath);

  const detailsDir = path.join(process.cwd(), 'tools');
  await fs.ensureDir(detailsDir);

  for (const tool of tools) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${tool.name} - AI Tools for Chemists</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <button onclick="history.back()" class="back-button">← Back</button>

  <main>
    <h1>${tool.name}</h1>
    <img src="${tool.image || '/images/placeholder.png'}" alt="${tool.name} screenshot" class="detail-image"/>
    <p>${tool.description}</p>
    <p><a href="${tool.url}" target="_blank" rel="noopener noreferrer">Visit Official Site</a></p>
  </main>

  <style>
    .back-button {
      background-color: #39ff14;
      border: none;
      color: #000;
      padding: 8px 16px;
      font-size: 16px;
      cursor: pointer;
      border-radius: 5px;
      margin: 20px;
      display: inline-block;
      transition: background-color 0.3s ease;
    }
    .back-button:hover {
      background-color: #2bb213;
    }
    .detail-image {
      max-width: 100%;
      height: auto;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(57,255,20,0.5);
    }
  </style>
</body>
</html>`;

    const filename = path.join(detailsDir, `${tool.slug}.html`);
    await fs.writeFile(filename, htmlContent, 'utf-8');
    console.log(`Generated detail page: ${filename}`);
  }
}

generateDetailPages().catch(console.error);

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

