// tools.json laden
async function loadTools() {
  try {
    const response = await fetch('data/tools.json');
    if (!response.ok) throw new Error("Failed to load tools.json");
    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Filter-Checkboxen dynamisch generieren
function renderFilterOptions(tools) {
  const form = document.getElementById('filter-form');
  if (!form) return;

  // Alle Kategorien sammeln und Duplikate entfernen
  const categories = [...new Set(tools.map(tool => tool.category).filter(Boolean))];
  
  // Checkboxen als HTML einfügen
  form.innerHTML = categories.map(cat => `
    <label>
      <input type="checkbox" name="category" value="${cat}" />
      ${cat}
    </label>
  `).join('');
}

// Tools rendern
function renderTools(tools) {
  const container = document.getElementById('toolGrid');
  container.innerHTML = tools.map(tool => `
    <div class="tool-card">
      <img 
        src="${tool.image || 'assets/placeholder.png'}" 
        alt="${tool.name}" 
        onerror="this.src='assets/placeholder.png'" 
      />
      <div class="tool-info">
        <h3>${tool.name}</h3>
        <p>${tool.description ? tool.description.substring(0, 100) + '…' : ''}</p>
        <a href="tools/${tool.slug}.html">Details →</a>
      </div>
    </div>
  `).join('');
}

// Tools nach ausgewählten Filtern filtern
function applyFilters(tools) {
  const checkedBoxes = [...document.querySelectorAll('#filter-form input[type="checkbox"]:checked')];
  const selectedCategories = checkedBoxes.map(cb => cb.value);

  if (selectedCategories.length === 0) {
    return tools;
  }

  return tools.filter(tool => 
    tool.category && selectedCategories.includes(tool.category)
  );
}

// Event-Listener für Filter setzen
function setupFiltering(tools) {
  const filterForm = document.getElementById('filter-form');
  if (!filterForm) return;

  filterForm.addEventListener('change', () => {
    const filtered = applyFilters(tools);
    renderTools(filtered);
  });
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', async () => {
  const tools = await loadTools();

  renderFilterOptions(tools);   // Filter vor Tool-Rendern generieren
  renderTools(tools);
  setupFiltering(tools);

  // Aktualisierungsdatum und -zeit setzen
  const updateEl = document.getElementById('update-date');
  if (updateEl) {
    const now = new Date();
    updateEl.textContent = now.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
});
