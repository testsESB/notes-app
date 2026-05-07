import React, { useState, useEffect } from 'react';
import { relativeDate } from '../utils/date.js';

function stripMd(text = '') {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#{1,6} /g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[\[(.+?)\]\]/g, '$1')
    .replace(/#\w+/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
}

const ROW = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--hairline)',
  background: 'transparent',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  border: 'none',
  transition: 'background 0.08s',
};

export default function Sidebar({ notes, selectedId, refreshKey, onSelect, onCreate, onHome, onDaily, isMobile }) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagNotes, setTagNotes] = useState(null); // null = no tag filter active

  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(setTags).catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    if (!activeTag) { setTagNotes(null); return; }
    fetch(`/api/notes?tag=${encodeURIComponent(activeTag)}`)
      .then(r => r.json())
      .then(setTagNotes)
      .catch(() => setTagNotes([]));
  }, [activeTag, refreshKey]);

  const baseNotes = tagNotes ?? notes;
  const filtered = baseNotes.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: isMobile ? '100%' : 228,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: isMobile ? 'var(--canvas)' : 'var(--surface-s)',
      borderRight: isMobile ? 'none' : '1px solid var(--hairline)',
    }}>

      {/* Header — desktop only */}
      {!isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--hairline)',
        }}>
          <button
            onClick={onHome}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.6'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* n : jambe gauche → haut → arche → jambe droite */}
              <line x1="2"  y1="20" x2="2"  y2="3"  stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="2"  y1="3"  x2="10" y2="3"  stroke="#5bbfb5"      strokeWidth="1.2" strokeLinecap="round" />
              <line x1="10" y1="3"  x2="14" y2="11" stroke="#c89a3e"      strokeWidth="1.2" strokeLinecap="round" />
              <line x1="14" y1="11" x2="14" y2="20" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
              {/* nodes */}
              <circle cx="2"  cy="20" r="2"   fill="currentColor" />
              <circle cx="2"  cy="3"  r="2"   fill="currentColor" />
              <circle cx="10" cy="3"  r="2"   fill="currentColor" />
              <circle cx="14" cy="11" r="1.5" fill="currentColor" />
              <circle cx="14" cy="20" r="1.5" fill="currentColor" />
            </svg>
            <span style={{
              fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700,
              color: 'var(--ink)', letterSpacing: '0.04em',
            }}>
              notAPP.
            </span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--stone)', fontFamily: 'var(--font)' }}>
              {activeTag ? filtered.length : notes.length}
            </span>
            <button
              onClick={onDaily}
              title="Journal du jour"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontFamily: 'var(--font)', fontWeight: 400,
                color: 'var(--mute)', padding: '0 2px',
                lineHeight: 1, transition: 'color 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
            >
              [~]
            </button>
            <button
              onClick={onCreate}
              title="Nouvelle note (⌘N)"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, fontFamily: 'var(--font)', fontWeight: 700,
                color: 'var(--mute)', padding: '0 2px',
                lineHeight: 1, transition: 'color 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
            >
              [+]
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: isMobile ? '10px 12px' : '8px 10px', borderBottom: '1px solid var(--hairline)' }}>
        <input
          type="text"
          placeholder="rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            fontSize: 16,
            fontFamily: 'var(--font)',
            borderRadius: 4,
            padding: isMobile ? '8px 10px' : '5px 8px',
            background: 'var(--canvas)',
            border: '1px solid var(--hairline)',
            color: 'var(--ink)', outline: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--ink)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--hairline)'}
        />
      </div>

      {/* Note list */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '20px 14px', fontSize: 10, color: 'var(--ash)', letterSpacing: '0.04em' }}>
            {activeTag ? `[ ] aucune note avec #${activeTag}` : search ? '[ ] aucun résultat' : '[ ] aucune note'}
          </div>
        )}
        {filtered.map(n => {
          const active = selectedId === n.id;
          const preview = stripMd(n.preview ?? '');
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              style={{
                ...ROW,
                padding: isMobile ? '12px 14px' : '10px 14px',
                minHeight: isMobile ? 60 : 'auto',
                background: active ? 'var(--surface-c)' : 'transparent',
                borderLeft: `2px solid ${active ? 'var(--ink)' : 'transparent'}`,
                paddingLeft: 12,
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-c)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: active ? 'var(--ink)' : 'var(--ash)', fontWeight: 700, flexShrink: 0 }}>
                  {active ? '[>]' : '[ ]'}
                </span>
                <span style={{
                  fontSize: isMobile ? 13 : 11, fontWeight: active ? 500 : 400,
                  color: active ? 'var(--ink)' : 'var(--body)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {n.title}
                </span>
              </div>
              {preview && (
                <div style={{
                  fontSize: 11, color: 'var(--stone)', lineHeight: 1.45,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  paddingLeft: 22, marginBottom: 4,
                }}>
                  {preview}
                </div>
              )}
              <div style={{ fontSize: 9, color: 'var(--ash)', paddingLeft: 22 }}>
                {relativeDate(n.updated_at)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ borderTop: '1px solid var(--hairline)', padding: '10px 14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: 'var(--ash)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              tags
            </div>
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font)', fontSize: 9, color: 'var(--mute)',
                  letterSpacing: '0.04em', transition: 'color 0.1s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
              >
                [x tout afficher]
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {tags.slice(0, 14).map(t => {
              const on = activeTag === t.name;
              return (
                <button key={t.id} onClick={() => setActiveTag(on ? null : t.name)} style={{
                  fontSize: 11, fontFamily: 'var(--font)',
                  padding: isMobile ? '5px 10px' : '2px 7px', borderRadius: 4,
                  background: on ? 'var(--ink)' : 'var(--canvas)',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                  color: on ? 'var(--canvas)' : (activeTag && !on ? 'var(--ash)' : 'var(--mute)'),
                  cursor: 'pointer', transition: 'all 0.1s',
                  opacity: activeTag && !on ? 0.5 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}>
                  #{t.name}
                  <span style={{ marginLeft: 4, opacity: 0.5, fontSize: 9 }}>{t.note_count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
