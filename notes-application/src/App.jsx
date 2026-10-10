import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/notes";

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotes(query = "") {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}?search=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Unable to load notes.");
      }

      const data = await response.json();
      setNotes(data);
    } catch {
      setError("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Please enter both title and content.");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        editingId !== null ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId !== null ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save note.");
      }

      setTitle("");
      setContent("");
      setEditingId(null);

      await loadNotes(search);
    } catch (error) {
      setError(error.message || "Unable to save note.");
    }
  }

  function handleEdit(note) {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete note.");
      }

      if (editingId === id) {
        setEditingId(null);
        setTitle("");
        setContent("");
      }

      await loadNotes(search);
    } catch (error) {
      setError(error.message || "Unable to delete note.");
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📝 My Notes</h1>
        <p>Capture your thoughts. Organize your life.</p>
      </header>

      <main className="container">
        <section className="note-form">
          <h2>{editingId !== null ? "Edit Note" : "Create a Note"}</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter note title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              required
            />

            <textarea
              placeholder="Write your note here..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows="5"
              required
            />

            <button type="submit">
              {editingId !== null ? "Update Note" : "Save Note"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setContent("");
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </section>

        <section className="notes-section">
          <div className="notes-heading">
            <h2>My Notes</h2>
            <span>{notes.length} notes</span>
          </div>

          <input
            className="search-input"
            type="search"
            placeholder="🔍 Search by title or content..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {error && <p role="alert">{error}</p>}

          {loading ? (
            <p>Loading notes...</p>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <article className="note-card" key={note.id}>
                  <h3>{note.title}</h3>
                  <p>{note.content}</p>

                  <div className="note-actions">
                    <button onClick={() => handleEdit(note)}>
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => handleDelete(note.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && notes.length === 0 && (
            <p className="empty-message">
              {search
                ? "No matching notes found."
                : "No notes yet. Create your first note!"}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;