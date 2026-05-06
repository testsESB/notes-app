import { Router } from 'express';
import { db } from '../db/schema.js';
import { extractKeywords } from '../services/parser.js';

const router = Router();

router.get('/', (req, res) => {
  const notes = db.all('SELECT id, title, content FROM notes');
  const nodeIds = new Set(notes.map(n => n.id));

  const wikiEdges = db.all(
    'SELECT DISTINCT source_note_id as source, target_note_id as target, type FROM links'
  );

  const tagEdges = db.all(`
    SELECT nt1.note_id as source, nt2.note_id as target, 'tag' as type
    FROM note_tags nt1
    JOIN note_tags nt2 ON nt1.tag_id = nt2.tag_id AND nt1.note_id < nt2.note_id
  `);

  const noteKeywords = notes.map(n => ({
    id: n.id,
    words: extractKeywords(`${n.title} ${n.content}`)
  }));

  const autoEdges = [];
  for (let i = 0; i < noteKeywords.length; i++) {
    for (let j = i + 1; j < noteKeywords.length; j++) {
      const shared = [...noteKeywords[i].words].filter(w => noteKeywords[j].words.has(w));
      if (shared.length >= 2) {
        autoEdges.push({ source: noteKeywords[i].id, target: noteKeywords[j].id, type: 'auto' });
      }
    }
  }

  // Dédoublonnage + filtrage des arêtes orphelines (référence un nœud supprimé)
  const seen = new Set();
  const edges = [...wikiEdges, ...tagEdges, ...autoEdges].filter(e => {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return false;
    if (e.source === e.target) return false;
    const key = `${Math.min(e.source, e.target)}-${Math.max(e.source, e.target)}-${e.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  res.json({
    nodes: notes.map(n => ({ id: n.id, label: n.title })),
    edges,
  });
});

export default router;
