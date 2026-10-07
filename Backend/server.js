const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config();

const pool = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;


// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());
app.use(express.json());


// ==============================
// FRONTEND
// ==============================

app.use(express.static(
  path.join(__dirname, "../frontend")
));


// ==============================
// HEALTH CHECK
// ==============================

app.get("/api/health", (req, res) => {
  res.json({
    status: "Backend is running successfully."
  });
});


// ==============================
// ABOUT
// ==============================

app.get("/api/about", (req, res) => {
  res.json({
    name: "Emmanuel Agbetiameh",
    role: "Computer Science and Engineering Student",
    university: "University of Mines and Technology (UMaT)",
    message:
      "Building software, learning, and creating real-world solutions."
  });
});


// ==============================
// PROJECTS - GET
// ==============================

app.get("/api/projects", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY id ASC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch projects."
    });
  }
});


// ==============================
// PROJECTS - CREATE
// ==============================

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
    console.error(error);

    res.status(500).json({
      error: "Failed to create project."
    });
  }
});


// ==============================
// PROJECTS - UPDATE
// ==============================

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
    console.error(error);

    res.status(500).json({
      error: "Failed to update project."
    });
  }
});


// ==============================
// PROJECTS - DELETE
// ==============================

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM projects
       WHERE id = $1
       RETURNING *`,
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
    console.error(error);

    res.status(500).json({
      error: "Failed to delete project."
    });
  }
});


// ==============================
// CONTACT
// ==============================

app.get("/api/contact", (req, res) => {
  res.json({
    email: "emmanuelagbetiameh9@gmail.com",
    github: "https://github.com/",
    linkedin: "linkedin.com/in/Agbetiameh-Emmanuel",
    phone: [
      "+233202126773",
      "+23359366640"
    ],
    address: "Sowutuom-Accra, Ghana"
  });
});


// ==============================
// DATABASE TEST
// ==============================

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW()"
    );

    res.json({
      message: "Database connection successful.",
      time: result.rows[0].now
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Database connection failed."
    });
  }
});


// ==============================
// AUTH - REGISTER
// ==============================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required."
      });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "User already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

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
    console.error(error);

    res.status(500).json({
      error: "Registration failed."
    });
  }
});


// ==============================
// AUTH - LOGIN
// ==============================

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
    console.error(error);

    res.status(500).json({
      error: "Login failed."
    });
  }
});


// ==============================
// AUTH - PROFILE
// ==============================

app.get("/api/auth/profile", (req, res) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Access token required."
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access token required."
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (error, user) => {

      if (error) {
        return res.status(403).json({
          error: "Invalid or expired token."
        });
      }

      res.json({
        message: "Protected profile accessed successfully.",
        user
      });
    }
  );
});


// ==============================
// AUTH TEST
// ==============================

app.get("/api/auth/test", (req, res) => {
  res.json({
    message: "Authentication route is working."
  });
});


// ==============================
// ROOT ROUTE
// ==============================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});


// ==============================
// 404
// ==============================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});


// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );
});