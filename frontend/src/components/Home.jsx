import React, { useState, useEffect } from 'react';
import { getGraph } from '../api/notes.js';
import { relativeDate } from '../utils/date.js';

const btnReset = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font)', padding: 0,
  WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.1s',
};

export default function Home({ notes, onCreate, onDaily, onSwitchToGraph, onSelectNote, isMobile }) {
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    getGraph().then(({ edges }) => setConnections(edges.length)).catch(() => {});
  }, [notes.length]);

  const recent = notes.slice(0, isMobile ? 4 : 5);
  const hasNotes = notes.length > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', background: 'var(--canvas)',
      padding: isMobile ? '32px 28px' : '0 40px',
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>

      {/* Wordmark */}
      <div style={{ textAlign: 'center', marginBottom: hasNotes ? 28 : 36 }}>
        <div style={{
          fontSize: isMobile ? 44 : 64,
          fontWeight: 700, fontFamily: 'var(--font)',
          color: 'var(--ink)', letterSpacing: '-0.03em',
          lineHeight: 1, marginBottom: 16,
        }}>
          notAPP.
        </div>
        <div style={{
          fontSize: 11, color: 'var(--stone)',
          letterSpacing: '0.02em', fontFamily: 'var(--font)',
          lineHeight: 1.6, fontStyle: 'italic',
        }}>
          not a note app, note that it's more than not.
        </div>
      </div>

      {/* Stats */}
      {hasNotes && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          marginBottom: 32,
          fontSize: 10, color: 'var(--ash)',
          letterSpacing: '0.06em',
        }}>
          <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--hairline-s)' }}>·</span>
          <span>{connections} connexion{connections !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: hasNotes ? 52 : 0 }}>
        <ActionBtn onClick={onCreate} primary>[+ nouvelle note]</ActionBtn>
        <ActionBtn onClick={onDaily}>[~ journal]</ActionBtn>
        {hasNotes && (
          <ActionBtn onClick={onSwitchToGraph}>[→ graphe]</ActionBtn>
        )}
      </div>

      {/* Empty hint */}
      {!hasNotes && (
        <div style={{ marginTop: 32, textAlign: 'center', lineHeight: 2.2 }}>
          <div style={{ fontSize: 10, color: 'var(--ash)' }}>
            [ ] aucune note pour l'instant
          </div>
          <div style={{ fontSize: 9, color: 'var(--stone)', marginTop: 2 }}>
            commence par en créer une
          </div>
        </div>
      )}

      {/* Recent notes */}
      {recent.length > 0 && (
        <div style={{ width: '100%', maxWidth: 460 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 14,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'var(--ash)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              récentes
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
          </div>

          {recent.map((n, i) => (
            <RecentRow
              key={n.id}
              note={n}
              onClick={() => onSelectNote(n.id)}
              isLast={i === recent.length - 1}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ onClick, children, primary }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...btnReset,
        fontSize: 11, letterSpacing: '0.03em',
        padding: '8px 18px', borderRadius: 4,
        border: `1px solid ${hover ? 'var(--ink)' : 'var(--hairline)'}`,
        color: hover ? 'var(--ink)' : (primary ? 'var(--body)' : 'var(--mute)'),
        background: hover ? 'var(--surface-c)' : 'transparent',
        minHeight: 36,
      }}
    >
      {children}
    </button>
  );
}

function RecentRow({ note, onClick, isLast, isMobile }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...btnReset,
        display: 'flex', alignItems: 'baseline', gap: 8,
        width: '100%', textAlign: 'left',
        padding: isMobile ? '12px 0' : '10px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--hairline)',
      }}
    >
      <span style={{
        fontSize: 10, flexShrink: 0,
        color: hover ? 'var(--ink)' : 'var(--ash)',
        transition: 'color 0.1s',
      }}>
        {'[>]'}
      </span>
      <span style={{
        flex: 1, fontSize: 12, fontWeight: 500,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        color: hover ? 'var(--ink)' : 'var(--body)',
        transition: 'color 0.1s',
      }}>
        {note.title}
      </span>
      <span style={{ fontSize: 9, color: 'var(--ash)', flexShrink: 0 }}>
        {relativeDate(note.updated_at)}
      </span>
    </button>
  );
}
