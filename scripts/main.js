// Tool-Daten laden
async function loadTools() {
  const response = await fetch('data/tools.json');
  if (!response.ok) {
    console.error("Failed to load tools.json");
    return [];
  }
  return await response.json();
}

// Tools rendern
function renderTools(tools) {
  const container = document.getElementById('tools-grid');
  container.innerHTML = tools.map(tool => `
    <div class="tool-card">
      <img src="${tool.image || 'assets/placeholder.png'}" 
           alt="${tool.name}" 
           onerror="this.src='assets/placeholder.png'">
      <div class="tool-info">
        <h3>${tool.name}</h3>
        <p>${tool.description.substring(0, 100)}...</p>
        <a href="tools/${tool.slug}.html">Details →</a>
      </div>
    </div>
  `).join('');
}

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
  const tools = await loadTools();
  renderTools(tools);
  document.getElementById('update-date').textContent = new Date().toLocaleDateString();
});
