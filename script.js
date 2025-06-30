let selectedTags = new Set();

function renderFilterTags(tools) {
  const allTags = [...new Set(tools.flatMap(tool => tool.tags))].sort();
  const container = document.getElementById("filter-container");
  container.innerHTML = "";
  allTags.forEach(tag => {
    const button = document.createElement("button");
    button.textContent = tag;
    button.classList.add("tag");
    button.onclick = () => {
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        button.classList.remove("active");
      } else {
        selectedTags.add(tag);
        button.classList.add("active");
      }
      filterTools(tools);
    };
    container.appendChild(button);
  });
}

function filterTools(tools) {
  const filtered = Array.from(selectedTags).length
    ? tools.filter(tool =>
        Array.from(selectedTags).every(tag => tool.tags.includes(tag))
      )
    : tools;
  renderTools(filtered);
}

function renderTools(tools) {
  const container = document.getElementById("tools-container");
  container.innerHTML = "";
  tools.forEach(tool => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = tool.image || "https://via.placeholder.com/150";
    img.alt = tool.name;

    const content = document.createElement("div");
    content.className = "card-content";
    content.innerHTML = `<h2>${tool.name}</h2><p>${tool.description}</p><a href="${tool.url}" target="_blank">Visit</a>`;

    card.appendChild(img);
    card.appendChild(content);
    container.appendChild(card);
  });
}

fetch("data/tools.json")
  .then(response => response.json())
  .then(data => {
    renderFilterTags(data);
    renderTools(data);
  });