import fs from 'fs-extra';
import path from 'path';

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>{{name}} | AI Tools</title>
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header class="site-header">
    <a href="../index.html"><img src="../assets/logoAfC.png" class="logo"></a>
  </header>

  <div class="tool-detail">
    <img src="{{image || '../assets/placeholder.png'}}" 
         alt="{{name}}" 
         onerror="this.src='../assets/placeholder.png'">
    <div>
      <h1>{{name}}</h1>
      <a href="{{url}}" target="_blank" class="visit-btn">Visit Tool</a>
      <p>{{description}}</p>
      <a href="../index.html" class="back-btn">← All Tools</a>
    </div>
  </div>
</body>
</html>`;

async function generatePages() {
  const tools = await fs.readJson('./data/tools.json');
  await fs.ensureDir('./tools');

  for (const tool of tools) {
    let html = template;
    for (const [key, value] of Object.entries(tool)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    await fs.writeFile(`./tools/${tool.slug}.html`, html);
  }
}

generatePages().catch(console.error);
