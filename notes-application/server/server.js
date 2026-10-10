const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// GET: Retrieve all notes and search notes
app.get("/api/notes", (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    const notes = db.prepare(`
      SELECT * FROM notes
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY id DESC
    `).all(`%${search}%`, `%${search}%`);

    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve notes." });
  }
});

// GET: Retrieve a single note
app.get("/api/notes/:id", (req, res) => {
  try {
    const note = db.prepare(
      "SELECT * FROM notes WHERE id = ?"
    ).get(req.params.id);

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve note." });
  }
});

// POST: Create a note
app.post("/api/notes", (req, res) => {
  try {
    const { title, content } = req.body;

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        error: "Title and content are required."
      });
    }

    const result = db.prepare(`
      INSERT INTO notes (title, content)
      VALUES (?, ?)
    `).run(title.trim(), content.trim());

    const note = db.prepare(
      "SELECT * FROM notes WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create note." });
  }
});

// PUT: Update a note
app.put("/api/notes/:id", (req, res) => {
  try {
    const { title, content } = req.body;

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        error: "Title and content are required."
      });
    }

    const result = db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title.trim(), content.trim(), req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Note not found." });
    }

    const note = db.prepare(
      "SELECT * FROM notes WHERE id = ?"
    ).get(req.params.id);

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update note." });
  }
});

// DELETE: Delete a note
app.delete("/api/notes/:id", (req, res) => {
  try {
    const result = db.prepare(
      "DELETE FROM notes WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Note not found." });
    }

    res.json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete note." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});