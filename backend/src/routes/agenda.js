import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

// Returns notes for a given month, keyed by YYYY-MM-DD.
// A note appears on a date if:
//   - its content contains @YYYY-MM-DD matching that date, OR
//   - its title matches "Journal — D month YYYY" (daily note)
router.get('/', (req, res) => {
  const now = new Date();
  const year  = parseInt(req.query.year  ?? now.getFullYear());
  const month = parseInt(req.query.month ?? now.getMonth() + 1); // 1-12

  const pad = n => String(n).padStart(2, '0');
  const prefix = `${year}-${pad(month)}`;

  const notes = db.all(
    `SELECT id, title, content FROM notes WHERE deleted_at IS NULL`
  );

  const result = {}; // { 'YYYY-MM-DD': [{ id, title }] }

  const addEntry = (dateStr, note) => {
    if (!result[dateStr]) result[dateStr] = [];
    if (!result[dateStr].find(n => n.id === note.id)) {
      result[dateStr].push({ id: note.id, title: note.title });
    }
  };

  // Regex for @YYYY-MM-DD in content
  const dateRe = /@(\d{4}-\d{2}-\d{2})/g;

  // Regex for journal titles: "Journal — D month YYYY" (French locale)
  // Build a map of French month names → 0-based index
  const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const journalRe = /^Journal\s*[—–-]\s*(\d{1,2})\s+(\S+)\s+(\d{4})$/i;

  for (const note of notes) {
    // Scan content for @dates in this month
    let m;
    const content = note.content ?? '';
    dateRe.lastIndex = 0;
    while ((m = dateRe.exec(content)) !== null) {
      if (m[1].startsWith(prefix)) addEntry(m[1], note);
    }

    // Check journal title
    const jm = journalRe.exec(note.title ?? '');
    if (jm) {
      const day   = parseInt(jm[1]);
      const mon   = FR_MONTHS.indexOf(jm[2].toLowerCase());
      const yr    = parseInt(jm[3]);
      if (mon !== -1 && yr === year && mon + 1 === month) {
        const dateStr = `${yr}-${pad(mon + 1)}-${pad(day)}`;
        addEntry(dateStr, note);
      }
    }
  }

  res.json(result);
});

export default router;
