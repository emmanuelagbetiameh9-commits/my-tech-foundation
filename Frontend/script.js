const API_URL = "/api";


// ==============================
// LOAD PROJECTS
// ==============================

async function loadProjects() {
  const projectsList = document.querySelector("#project-list");

  try {
    const response = await fetch(`${API_URL}/projects`);

    if (!response.ok) {
      throw new Error("Failed to load projects.");
    }

    const projects = await response.json();

    projectsList.innerHTML = "";

    projects.forEach((project) => {

      const article = document.createElement("article");

      article.innerHTML = `
        <h3>${project.name}</h3>

        <p>
          ${project.description}
        </p>

        <a href="#" target="_blank">
          View Project
        </a>
      `;

      projectsList.appendChild(article);
    });

  } catch (error) {

    console.error("Failed to load projects:", error);

    projectsList.innerHTML = `
      <p>
        Projects could not be loaded right now.
      </p>
    `;
  }
}


// ==============================
// START WEBSITE
// ==============================

loadProjects();