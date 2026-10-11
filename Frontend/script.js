```javascript
const API_URL = "/api";

// Links for the projects displayed on the portfolio
const PROJECT_LINKS = {
  "Telegram Bot": {
    url: "https://t.me/Emmanuel_Slide_Library_bot",
    label: "Open Telegram Bot",
    available: true
  },

  "WhatsApp Business Agent": {
    url: null,
    label: "Coming Soon",
    available: false
  }
};

// Load projects from the backend
async function loadProjects() {
  const projectsList = document.querySelector("#project-list");

  if (!projectsList) {
    console.error("Project list element was not found.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/projects`);

    if (!response.ok) {
      throw new Error("Failed to load projects.");
    }

    const projects = await response.json();

    projectsList.replaceChildren();

    if (!Array.isArray(projects) || projects.length === 0) {
      projectsList.textContent = "Projects will be available soon.";
      return;
    }

    projects.forEach((project) => {
      const article = document.createElement("article");
      article.classList.add("project-card");

      const heading = document.createElement("h3");
      heading.textContent = project.name;

      const description = document.createElement("p");
      description.textContent = project.description;

      const link = document.createElement("a");
      const projectLink = PROJECT_LINKS[project.name];

      link.textContent = projectLink
        ? projectLink.label
        : "Link Coming Soon";

      if (projectLink?.available && projectLink.url) {
        link.href = projectLink.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.classList.add("project-link-disabled");
      }

      article.append(heading, description, link);
      projectsList.appendChild(article);
    });
  } catch (error) {
    console.error("Failed to load projects:", error);

    projectsList.textContent =
      "Projects could not be loaded right now. Please try again later.";
  }
}

// Start loading the projects when the page opens
document.addEventListener("DOMContentLoaded", loadProjects);
```
