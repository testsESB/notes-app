import React, { useState, useEffect, useRef } from 'react';
import { relativeDate } from '../utils/date.js';

function highlight(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'var(--ink)', color: 'var(--canvas)', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
      : part
  );
}

export default function Search({ onSelectNote, isMobile }) {
  const [query, setQuery]       = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [results, setResults]   = useState([]);
  const [tags, setTags]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetch('/api/tags').then(r => r.json()).then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query && !activeTag) { setResults([]); return; }
    setLoading(true);
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (activeTag) p.set('tag', activeTag);
    fetch(`/api/notes?${p}`)
      .then(r => r.json())
      .then(d => { setResults(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [query, activeTag]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--canvas)' }}>
      <div style={{ padding: isMobile ? '12px' : '16px 20px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="search"
          placeholder="rechercher dans les notes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', fontSize: 16, fontFamily: 'var(--font)',
            background: 'var(--canvas)', border: '1px solid var(--hairline)',
            borderRadius: 4, padding: isMobile ? '10px 12px' : '7px 10px',
            color: 'var(--ink)', outline: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--ink)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--hairline)'}
        />
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {tags.slice(0, 14).map(t => {
              const on = activeTag === t.name;
              return (
                <button key={t.id} onClick={() => setActiveTag(on ? null : t.name)} style={{
                  fontSize: 11, fontFamily: 'var(--font)',
                  padding: isMobile ? '4px 9px' : '2px 7px', borderRadius: 4,
                  background: on ? 'var(--ink)' : 'var(--canvas)',
                  border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                  color: on ? 'var(--canvas)' : 'var(--mute)',
                  cursor: 'pointer', transition: 'all 0.1s',
                  WebkitTapHighlightColor: 'transparent',
                }}>#{t.name}</button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {!query && !activeTag && (
          <div style={{ padding: '20px 14px', fontSize: 10, color: 'var(--ash)', letterSpacing: '0.04em' }}>
            [ ] tape pour chercher
          </div>
        )}
        {loading && (
          <div style={{ padding: '20px 14px', fontSize: 10, color: 'var(--ash)' }}>recherche…</div>
        )}
        {!loading && (query || activeTag) && results.length === 0 && (
          <div style={{ padding: '20px 14px', fontSize: 10, color: 'var(--ash)', letterSpacing: '0.04em' }}>
            [ ] aucun résultat
          </div>
        )}
        {results.map(n => (
          <button key={n.id} onClick={() => onSelectNote(n.id)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: isMobile ? '14px 16px' : '12px 20px',
            background: 'none', border: 'none',
            borderBottom: '1px solid var(--hairline)',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-c)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ fontSize: isMobile ? 13 : 12, fontWeight: 500, color: 'var(--ink)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {highlight(n.title, query)}
            </div>
            {n.preview && (
              <div style={{ fontSize: 11, color: 'var(--stone)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 4 }}>
                {highlight(n.preview, query)}
              </div>
            )}
            <div style={{ fontSize: 9, color: 'var(--ash)' }}>{relativeDate(n.updated_at)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
