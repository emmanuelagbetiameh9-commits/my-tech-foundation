const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const pool = require("./config/database");
const authenticateToken = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

/* ==============================
   MIDDLEWARE
============================== */

app.use(cors());
app.use(express.json());

/* ==============================
   FRONTEND
============================== */

app.use(
  express.static(path.join(__dirname, "../Frontend"))
);

/* Serve image folder */
app.use(
  "/images",
  express.static(path.join(__dirname, "../Frontend/image"))
);

/* Homepage */
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../Frontend/Index.html")
  );
});

/* ==============================
   HEALTH
============================== */

app.get("/api/health", (req, res) => {
  res.json({
    message: "MY- TECH FOUNDATION backend is running.",
    status: "OK"
  });
});

/* ==============================
   ABOUT
============================== */

app.get("/api/about", (req, res) => {
  res.json({
    name: "Emmanuel Agbetiameh",
    role: "Computer Science and Engineering Student",
    university: "University of Mines and Technology (UMaT)",
    location: "Accra, Ghana"
  });
});

/* ==============================
   PROJECTS
============================== */

app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error loading projects:", error);

    res.status(500).json({
      error: "Failed to load projects."
    });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        error: "Name and description are required."
      });
    }

    const result = await pool.query(
      `INSERT INTO projects (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating project:", error);

    res.status(500).json({
      error: "Failed to create project."
    });
  }
});

app.put("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        error: "Name and description are required."
      });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Project not found."
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating project:", error);

    res.status(500).json({
      error: "Failed to update project."
    });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Project not found."
      });
    }

    res.json({
      message: "Project deleted successfully.",
      project: result.rows[0]
    });
  } catch (error) {
    console.error("Error deleting project:", error);

    res.status(500).json({
      error: "Failed to delete project."
    });
  }
});

/* ==============================
   CONTACT
============================== */

app.get("/api/contact", (req, res) => {
  res.json({
    email: "emmanuelagbetiameh9@gmail.com",
    location: "Accra, Ghana"
  });
});

/* ==============================
   DATABASE TEST
============================== */

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    res.json({
      message: "Database connection successful.",
      time: result.rows[0].current_time
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      error: "Database connection failed."
    });
  }
});

/* ==============================
   AUTHENTICATION
============================== */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required."
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "A user with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully.",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      error: "Registration failed."
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    res.json({
      message: "Login successful.",
      token
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Login failed."
    });
  }
});

app.get(
  "/api/auth/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, email, created_at
         FROM users
         WHERE id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "User not found."
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Profile error:", error);

      res.status(500).json({
        error: "Failed to load profile."
      });
    }
  }
);

app.get(
  "/api/auth/test",
  authenticateToken,
  (req, res) => {
    res.json({
      message: "Authentication middleware is working.",
      user: req.user
    });
  }
);

/* ==============================
   404 HANDLER
============================== */

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

/* ==============================
   START SERVER
============================== */

app.listen(PORT, () => {
  console.log(
    `MY- TECH FOUNDATION server running on http://localhost:${PORT}`
  );
});