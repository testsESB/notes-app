import express from 'express';
import cors from 'cors';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { initDb } from './db/schema.js';
import notesRouter from './routes/notes.js';
import tagsRouter from './routes/tags.js';
import graphRouter from './routes/graph.js';
import agendaRouter from './routes/agenda.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.use('/api/notes', notesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/agenda', agendaRouter);

// Serve built frontend in production
if (isProd) {
  const dist = resolve('../frontend/dist');
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(resolve(dist, 'index.html')));
  }
}

initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`Backend running on http://localhost:${PORT} [${isProd ? 'production' : 'dev'}]`)
  );
});
