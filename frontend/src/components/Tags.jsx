import React, { useState, useEffect } from 'react';
import { relativeDate } from '../utils/date.js';

export default function Tags({ refreshKey, onSelectNote, isMobile }) {
  const [tags, setTags]         = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [notes, setNotes]       = useState([]);

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(setTags).catch(() => {});
  }, [refreshKey]);

  const selectTag = (name) => {
    if (activeTag === name) { setActiveTag(null); setNotes([]); return; }
    setActiveTag(name);
    fetch(`/api/notes?tag=${encodeURIComponent(name)}`)
      .then(r => r.json()).then(setNotes).catch(() => {});
  };

  const maxCount = Math.max(...tags.map(t => t.note_count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--canvas)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ padding: isMobile ? '16px' : '20px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ash)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          tags — {tags.length} au total
        </div>
        {tags.length === 0 ? (
          <div style={{ fontSize: 10, color: 'var(--ash)' }}>[ ] aucun tag</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map(t => {
              const on = activeTag === t.name;
              const size = 10 + Math.round((t.note_count / maxCount) * 7);
              return (
                <button key={t.id} onClick={() => selectTag(t.name)} style={{
                  fontSize: size, fontFamily: 'var(--font)',
                  padding: isMobile ? '6px 12px' : '4px 10px', borderRadius: 4,
                  background: on ? 'var(--ink)' : 'var(--surface-c)',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                  color: on ? 'var(--canvas)' : 'var(--mute)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  #{t.name}
                  <span style={{ marginLeft: 5, fontSize: size - 2, opacity: 0.55 }}>{t.note_count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeTag ? (
        <div style={{ flex: 1 }}>
          <div style={{ padding: isMobile ? '10px 16px 8px' : '12px 20px 8px', fontSize: 9, fontWeight: 700, color: 'var(--ash)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            #{activeTag} — {notes.length} note{notes.length !== 1 ? 's' : ''}
          </div>
          {notes.map(n => (
            <button key={n.id} onClick={() => onSelectNote(n.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: isMobile ? '12px 16px' : '10px 20px',
              background: 'none', border: 'none',
              borderBottom: '1px solid var(--hairline)',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-c)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {n.title}
              </div>
              <div style={{ fontSize: 9, color: 'var(--ash)' }}>{relativeDate(n.updated_at)}</div>
            </button>
          ))}
        </div>
      ) : (
        tags.length > 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--ash)', letterSpacing: '0.04em' }}>
              clique sur un tag pour voir ses notes
            </div>
          </div>
        )
      )}
    </div>
  );
}
