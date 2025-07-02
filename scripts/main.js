// Hilfsfunktion: Erstes Zeichen groß (für Filter-Labels)
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

// Alle Kategorien aus Tools extrahieren, großgeschrieben und sortiert, unique
function extractCategories(tools) {
  const cats = new Set();
  tools.forEach(tool => {
    if (tool.category) {
      cats.add(capitalize(tool.category));
    }
  });
  return Array.from(cats).sort();
}

// Filter-Checkboxen dynamisch erzeugen
function renderFilters(categories) {
  const form = document.getElementById('filter-form');
  form.innerHTML = '';
  categories.forEach(cat => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" name="category" value="${cat}" />
      ${cat}
    `;
    form.appendChild(label);
  });
}

// Tools rendern
function renderTools(tools) {
  const container = document.getElementById('toolGrid');
  if (tools.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #bbb;">No tools match your filters.</p>';
    return;
  }
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

// Filter anwenden
function applyFilters(tools) {
  const checkedBoxes = [...document.querySelectorAll('#filter-form input[type="checkbox"]:checked')];
  const selectedCategories = checkedBoxes.map(cb => cb.value);

  if (selectedCategories.length === 0) {
    return tools;
  }

  return tools.filter(tool => {
    if (!tool.category) return false;
    return selectedCategories.includes(capitalize(tool.category));
  });
}

// Filter-Listener
function setupFiltering(tools) {
  const filterForm = document.getElementById('filter-form');
  if (!filterForm) return;

  filterForm.addEventListener('change', () => {
    const filtered = applyFilters(tools);
    renderTools(filtered);
  });
}

// Zeitstempel
async function loadLastUpdated() {
  try {
    const res = await fetch('data/last-updated.json');
    if (!res.ok) throw new Error('last-updated.json not found');
    const json = await res.json();
    return new Date(json.updated);
  } catch (err) {
    console.error('Fehler beim Laden des Aktualisierungsdatums:', err);
    return null;
  }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
  const tools = await loadTools();

  const categories = extractCategories(tools);
  renderFilters(categories);
  renderTools(tools);
  setupFiltering(tools);

  // Aktualisierungsdatum und -zeit setzen
    const updateEl = document.getElementById('update-date');
    const updatedDate = await loadLastUpdated();
    if (updateEl && updatedDate) {
      updateEl.textContent = updatedDate.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    }
  }
});
