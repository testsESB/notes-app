import { createRequire } from 'module';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js');

const DB_PATH = resolve('./notes.db');

let _db = null;

function persist() {
  writeFileSync(DB_PATH, Buffer.from(_db.export()));
}

export async function initDb() {
  const SQL = await initSqlJs();
  _db = existsSync(DB_PATH)
    ? new SQL.Database(readFileSync(DB_PATH))
    : new SQL.Database();

  _db.run('PRAGMA foreign_keys = ON;');
  _db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
      tag_id  INTEGER REFERENCES tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (note_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS links (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      source_note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
      target_note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
      type           TEXT CHECK(type IN ('wiki','auto')) NOT NULL
    );
  `);
  // Migration: add deleted_at if not present
  try { _db.run('ALTER TABLE notes ADD COLUMN deleted_at DATETIME DEFAULT NULL'); } catch {}
  persist();
}

// Thin synchronous wrappers around sql.js
export const db = {
  run(sql, ...params) {
    _db.run(sql, params.flat());
    persist();
  },
  get(sql, ...params) {
    const stmt = _db.prepare(sql);
    stmt.bind(params.flat());
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  },
  all(sql, ...params) {
    const stmt = _db.prepare(sql);
    stmt.bind(params.flat());
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  },
  // Returns lastInsertRowid after an INSERT
  insert(sql, ...params) {
    _db.run(sql, params.flat());
    const result = _db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0][0] ?? null;
    persist();
    return id;
  }
};
