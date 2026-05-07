# notAPP.

> *not a note app, note that it's more than not.*

A minimal, interconnected note-taking app with a markdown editor, graph view, and daily journal.

## Stack

- **Backend** — Node.js / Express / sql.js (SQLite)
- **Frontend** — React / Vite / @uiw/react-md-editor

## Features

- Markdown editor with live preview and auto-save
- Wiki-style linking between notes `[[note title]]`
- Tag system `#tag`
- Interactive graph of note connections
- Full-text search
- Daily journal
- Monthly agenda — notes indexed by `@YYYY-MM-DD` or journal titles
- Trash — soft delete with restore and permanent delete
- Light / dark theme
- Mobile-friendly PWA

## Getting started

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘N` | New note |
| `⌘S` | Save |

## Linking notes

- `[[Note title]]` — creates a wiki link between notes
- `#tag` — adds a tag to the note
- `@YYYY-MM-DD` — pins the note to a date in the agenda
