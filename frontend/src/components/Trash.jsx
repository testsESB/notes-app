import React, { useState, useEffect, useCallback } from 'react';
import { getTrash, restoreNote, permanentDeleteNote } from '../api/notes.js';
import { relativeDate } from '../utils/date.js';

export default function Trash({ onRestored, isMobile }) {
  const [notes, setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getTrash()
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (id) => {
    await restoreNote(id);
    setNotes(ns => ns.filter(n => n.id !== id));
    onRestored?.();
  };

  const handlePermanent = async (id) => {
    await permanentDeleteNote(id);
    setNotes(ns => ns.filter(n => n.id !== id));
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--canvas)', fontFamily: 'var(--font)',
    }}>
      <div style={{
        padding: isMobile ? '16px 16px 12px' : '20px 24px 14px',
        borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em', marginBottom: 4 }}>
          corbeille
        </div>
        <div style={{ fontSize: 10, color: 'var(--ash)', letterSpacing: '0.02em' }}>
          les notes supprimées peuvent être restaurées
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading && (
          <div style={{ padding: '20px 24px', fontSize: 10, color: 'var(--ash)' }}>chargement…</div>
        )}
        {!loading && notes.length === 0 && (
          <div style={{ padding: '32px 24px', fontSize: 11, color: 'var(--ash)', letterSpacing: '0.04em' }}>
            [ ] corbeille vide
          </div>
        )}
        {notes.map(note => (
          <div key={note.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '12px 16px' : '10px 24px',
            borderBottom: '1px solid var(--hairline)',
            gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, color: 'var(--mute)', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {note.title}
              </div>
              <div style={{ fontSize: 9, color: 'var(--ash)', marginTop: 2, letterSpacing: '0.03em' }}>
                supprimé {relativeDate(note.deleted_at)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <TrashBtn onClick={() => handleRestore(note.id)} label="[↩ restaurer]" />
              <TrashBtn onClick={() => handlePermanent(note.id)} label="[x suppr]" danger />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrashBtn({ onClick, label, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font)', fontSize: 10, padding: '2px 4px',
        color: hover
          ? (danger ? '#c04040' : 'var(--ink)')
          : 'var(--ash)',
        transition: 'color 0.1s', letterSpacing: '0.02em',
        WebkitTapHighlightColor: 'transparent',
        minHeight: 32, minWidth: 32, display: 'flex', alignItems: 'center',
      }}
    >
      {label}
    </button>
  );
}
