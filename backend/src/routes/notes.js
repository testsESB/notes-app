import { Router } from 'express';
import { db } from '../db/schema.js';
import { extractWikiLinks, extractTags } from '../services/parser.js';

const router = Router();

router.get('/trash', (req, res) => {
  const notes = db.all(
    `SELECT id, title, SUBSTR(content,1,140) as preview, created_at, updated_at, deleted_at
     FROM notes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
  );
  res.json(notes);
});

router.get('/', (req, res) => {
  const { q, tag } = req.query;
  let notes;
  if (tag) {
    notes = db.all(
      `SELECT n.id, n.title, SUBSTR(n.content,1,140) as preview, n.created_at, n.updated_at
       FROM notes n
       JOIN note_tags nt ON nt.note_id = n.id
       JOIN tags t ON t.id = nt.tag_id
       WHERE t.name = ? AND n.deleted_at IS NULL
       ORDER BY n.updated_at DESC`,
      [tag]
    );
  } else if (q) {
    notes = db.all(
      `SELECT id, title, SUBSTR(content,1,140) as preview, created_at, updated_at
       FROM notes WHERE deleted_at IS NULL AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC`,
      [`%${q}%`, `%${q}%`]
    );
  } else {
    notes = db.all(
      `SELECT id, title, SUBSTR(content,1,140) as preview, created_at, updated_at
       FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC`
    );
  }
  res.json(notes);
});

// /daily must come before /:id
router.get('/daily', (req, res) => {
  const now = new Date();
  const title = `Journal — ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  let note = db.get('SELECT * FROM notes WHERE title = ? AND deleted_at IS NULL', [title]);
  if (!note) {
    const id = db.insert('INSERT INTO notes (title, content) VALUES (?, ?)', [title, '']);
    note = db.get('SELECT * FROM notes WHERE id = ?', [id]);
  }
  res.json(note);
});

router.get('/:id/links', (req, res) => {
  const id = parseInt(req.params.id);
  const outgoing = db.all(
    `SELECT n.id, n.title FROM notes n
     JOIN links l ON l.target_note_id = n.id
     WHERE l.source_note_id = ? AND l.type = 'wiki' AND n.deleted_at IS NULL`, [id]
  );
  const incoming = db.all(
    `SELECT n.id, n.title FROM notes n
     JOIN links l ON l.source_note_id = n.id
     WHERE l.target_note_id = ? AND l.type = 'wiki' AND n.deleted_at IS NULL`, [id]
  );
  res.json({ outgoing, incoming });
});

router.get('/:id', (req, res) => {
  const note = db.get('SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const tags = db.all(
    'SELECT t.name FROM tags t JOIN note_tags nt ON nt.tag_id = t.id WHERE nt.note_id = ?',
    [req.params.id]
  ).map(t => t.name);

  res.json({ ...note, tags });
});

router.post('/', (req, res) => {
  const { title, content = '' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const id = db.insert('INSERT INTO notes (title, content) VALUES (?, ?)', [title, content]);
  const note = db.get('SELECT * FROM notes WHERE id = ?', [id]);
  syncNoteRelations(note);
  res.status(201).json(note);
});

router.post('/:id/restore', (req, res) => {
  const note = db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  db.run('UPDATE notes SET deleted_at = NULL WHERE id = ?', [req.params.id]);
  const restored = db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
  res.json(restored);
});

router.put('/:id', (req, res) => {
  const existing = db.get('SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  const { title = existing.title, content = existing.content } = req.body;
  db.run(
    'UPDATE notes SET title = ?, content = ?, updated_at = datetime("now") WHERE id = ?',
    [title, content, req.params.id]
  );

  const updated = db.get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
  syncNoteRelations(updated);
  res.json(updated);
});

router.delete('/:id/permanent', (req, res) => {
  db.run('DELETE FROM notes WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

router.delete('/:id', (req, res) => {
  db.run('UPDATE notes SET deleted_at = datetime("now") WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

function syncNoteRelations(note) {
  db.run('DELETE FROM note_tags WHERE note_id = ?', [note.id]);
  for (const name of extractTags(note.content)) {
    db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name]);
    const tag = db.get('SELECT id FROM tags WHERE name = ?', [name]);
    db.run('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', [note.id, tag.id]);
  }

  db.run("DELETE FROM links WHERE source_note_id = ? AND type = 'wiki'", [note.id]);
  for (const targetTitle of extractWikiLinks(note.content)) {
    const target = db.get('SELECT id FROM notes WHERE title = ? AND deleted_at IS NULL', [targetTitle]);
    if (target) {
      db.run(
        'INSERT INTO links (source_note_id, target_note_id, type) VALUES (?, ?, ?)',
        [note.id, target.id, 'wiki']
      );
    }
  }
}

export default router;
