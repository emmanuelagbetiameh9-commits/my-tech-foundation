const API_URL = "http://localhost:3000/api";


// ==============================
// LOAD ABOUT
// ==============================

async function loadAbout() {
  try {
    const response = await fetch(`${API_URL}/about`);
    const data = await response.json();

    console.log("About:", data);

  } catch (error) {
    console.error("Failed to load about:", error);
  }
}


// ==============================
// LOAD PROJECTS
// ==============================

async function loadProjects() {
  try {
    const response = await fetch(`${API_URL}/projects`);
    const projects = await response.json();

    const projectsSection = document.querySelector("#projects");

    projectsSection.innerHTML = `
      <h2>Projects</h2>
    `;

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

      projectsSection.appendChild(article);
    });

  } catch (error) {
    console.error("Failed to load projects:", error);
  }
}


// ==============================
// LOAD CONTACT
// ==============================

async function loadContact() {
  try {
    const response = await fetch(`${API_URL}/contact`);
    const data = await response.json();

    console.log("Contact:", data);

  } catch (error) {
    console.error("Failed to load contact:", error);
  }
}


// ==============================
// START
// ==============================

loadAbout();
loadProjects();
loadContact();