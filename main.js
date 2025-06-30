const toolsContainer = document.getElementById("tools-container");
const filterContainer = document.getElementById("filter-container");
const placeholderImage = "assets/placeholder.jpg";

fetch("data/tools.json")
  .then((response) => response.json())
  .then((tools) => {
    generateFilters(tools);
    displayTools(tools);
  });

function generateFilters(tools) {
  const tags = new Set();
  tools.forEach((tool) => tool.tags.forEach((tag) => tags.add(capitalize(tag))));
  
  [...tags].sort().forEach((tag) => {
    const label = document.createElement("label");
    label.className = "filter-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tag.toLowerCase();
    checkbox.addEventListener("change", applyFilters);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + tag));
    filterContainer.appendChild(label);
  });
}

function applyFilters() {
  const selected = Array.from(document.querySelectorAll("input:checked")).map(cb => cb.value);

  fetch("data/tools.json")
    .then((response) => response.json())
    .then((tools) => {
      if (selected.length === 0) {
        displayTools(tools);
      } else {
        const filtered = tools.filter((tool) =>
          selected.every((tag) => tool.tags.map(t => t.toLowerCase()).includes(tag))
        );
        displayTools(filtered);
      }
    });
}

function displayTools(tools) {
  toolsContainer.innerHTML = "";

  tools.forEach((tool) => {
    const card = document.createElement("div");
    card.className = "tool-card";

    const img = document.createElement("img");
    img.src = tool.image || placeholderImage;
    img.alt = tool.name;
    img.onerror = () => (img.src = placeholderImage);

    const title = document.createElement("h2");
    title.textContent = tool.name;

    const desc = document.createElement("p");
    desc.textContent = tool.description.substring(0, 150) + "...";

    const tagDiv = document.createElement("div");
    tagDiv.className = "tool-tags";
    tool.tags.forEach((tag) => {
      const tagSpan = document.createElement("span");
      tagSpan.className = "tag";
      tagSpan.textContent = capitalize(tag);
      tagDiv.appendChild(tagSpan);
    });

    const detailsLink = document.createElement("a");
    detailsLink.href = `tools/${tool.slug}.html`;
    detailsLink.className = "details-link";
    detailsLink.textContent = "View Details";

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(tagDiv);
    card.appendChild(detailsLink);

    toolsContainer.appendChild(card);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
