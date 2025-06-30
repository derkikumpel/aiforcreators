document.addEventListener("DOMContentLoaded", async () => {
  const toolsContainer = document.getElementById("tools-container");
  const filterContainer = document.getElementById("filter-container");

  let selectedTags = new Set();

  const res = await fetch("data/tools.json");
  const tools = await res.json();

  // Alle Tags sammeln
  const allTags = [...new Set(tools.flatMap(t => t.tags.map(tag => capitalize(tag))))].sort();

  // Filter-Buttons erstellen
  allTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }
      renderTools();
    });
    filterContainer.appendChild(btn);
  });

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function renderTools() {
    toolsContainer.innerHTML = "";

    const filtered = tools.filter(tool => {
      if (selectedTags.size === 0) return true;
      const tags = tool.tags.map(capitalize);
      return [...selectedTags].every(tag => tags.includes(tag));
    });

    filtered.forEach(tool => {
      const card = document.createElement("div");
      card.className = "tool-card";

      const img = document.createElement("img");
      img.src = tool.image || "logo/logoAfC.png";
      img.alt = `${tool.name} preview`;
      img.onerror = () => {
        img.src = "assets/placeholder.png";
      };

      const name = document.createElement("h2");
      name.textContent = tool.name;

      const desc = document.createElement("p");
      desc.textContent = tool.description;

      const link = document.createElement("a");
      link.href = `/tools/${tool.slug}.html`;
      link.textContent = "View Details";
      link.className = "tool-link";

      const tagList = document.createElement("div");
      tagList.className = "tag-list";
      tool.tags.forEach(tag => {
        const tagEl = document.createElement("span");
        tagEl.className = "tag";
        tagEl.textContent = capitalize(tag);
        tagList.appendChild(tagEl);
      });

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(desc);
      card.appendChild(link);
      card.appendChild(tagList);
      toolsContainer.appendChild(card);
    });
  }

  renderTools();
});
