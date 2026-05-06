const BASE = '/api';

export const getNotes = (q) =>
  fetch(`${BASE}/notes${q ? `?q=${encodeURIComponent(q)}` : ''}`).then(r => r.json());

export const getNote = (id) =>
  fetch(`${BASE}/notes/${id}`).then(r => r.json());

export const createNote = (data) =>
  fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

export const updateNote = (id, data) =>
  fetch(`${BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json());

export const deleteNote = (id) =>
  fetch(`${BASE}/notes/${id}`, { method: 'DELETE' });

export const getGraph = () =>
  fetch(`${BASE}/graph`).then(r => r.json());

export const getDailyNote = () =>
  fetch(`${BASE}/notes/daily`).then(r => r.json());

export const getBacklinks = (id) =>
  fetch(`${BASE}/notes/${id}/links`).then(r => r.json());

export const getTrash = () =>
  fetch(`${BASE}/notes/trash`).then(r => r.json());

export const restoreNote = (id) =>
  fetch(`${BASE}/notes/${id}/restore`, { method: 'POST' }).then(r => r.json());

export const permanentDeleteNote = (id) =>
  fetch(`${BASE}/notes/${id}/permanent`, { method: 'DELETE' });

export const getAgenda = (year, month) =>
  fetch(`${BASE}/agenda?year=${year}&month=${month}`).then(r => r.json());
