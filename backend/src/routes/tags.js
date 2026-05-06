import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

router.get('/', (req, res) => {
  const tags = db.all(`
    SELECT t.id, t.name, COUNT(nt.note_id) as note_count
    FROM tags t
    LEFT JOIN note_tags nt ON nt.tag_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `);
  res.json(tags);
});

export default router;
