import React, { useState, useEffect, useCallback, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { getNote, getBacklinks } from '../api/notes.js';
import { useAutoSave } from '../hooks/useAutoSave.js';

const STATUS = {
  saved:   { label: 'sauvegardé',     color: 'var(--ash)'  },
  saving:  { label: 'sauvegarde…',    color: 'var(--ash)'  },
  unsaved: { label: '● non sauvegardé', color: 'var(--body)' },
};

function wordCount(t) { return t.trim() ? t.trim().split(/\s+/).length : 0; }
function readTime(w)   { return Math.max(1, Math.ceil(w / 200)); }

export default function Editor({ note, onSave, onDelete, onToast, theme = 'light', isMobile, onSelectNote }) {
  const [title, setTitle]           = useState('');
  const [content, setContent]       = useState('');
  const [dirty, setDirty]           = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showLinks, setShowLinks]     = useState(false);
  const [backlinks, setBacklinks]     = useState(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!note) return;
    getNote(note.id).then(full => {
      setTitle(full.title);
      setContent(full.content ?? '');
      setDirty(false);
      setSaveStatus('saved');
    });
  }, [note?.id]);

  useEffect(() => {
    setShowLinks(false);
    setBacklinks(null);
  }, [note?.id]);

  useEffect(() => {
    if (note?.title === 'Nouvelle note') setTimeout(() => titleRef.current?.select(), 80);
  }, [note?.id]);

  const handleSave = useCallback(async ({ title: t, content: c }) => {
    setSaveStatus('saving');
    try {
      await onSave({ title: t, content: c });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
      onToast?.('erreur lors de la sauvegarde', 'error');
    }
  }, [onSave, onToast]);

  useAutoSave({ dirty, title, content, noteId: note?.id, onSave: handleSave });

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (dirty && note) handleSave({ title, content });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [dirty, note, title, content, handleSave]);

  const mark = () => { setDirty(true); setSaveStatus('unsaved'); };

  const toggleLinks = async () => {
    if (!showLinks && !backlinks && note) {
      try { setBacklinks(await getBacklinks(note.id)); } catch {}
    }
    setShowLinks(v => !v);
  };

  const exportMd = () => {
    const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'note'}.md`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToast?.('export téléchargé', 'info');
  };

  if (!note) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, background: 'var(--canvas)' }}>
        <div style={{ fontSize: 12, color: 'var(--ash)', fontFamily: 'var(--font)', textAlign: 'center', lineHeight: 2 }}>
          <div style={{ marginBottom: 4 }}>[ ] sélectionne ou crée une note</div>
          {!isMobile && <div style={{ fontSize: 10, color: 'var(--stone)' }}>⌘N pour commencer</div>}
        </div>
      </div>
    );
  }

  const words = wordCount(content);
  const st = STATUS[saveStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--canvas)' }} data-color-mode={theme}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: isMobile ? '0 12px' : '0 20px',
        height: isMobile ? 52 : 48,
        background: 'var(--canvas)',
        borderBottom: '1px solid var(--hairline)',
        flexShrink: 0,
      }}>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => { setTitle(e.target.value); mark(); }}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font)',
            color: 'var(--ink)',
          }}
          placeholder="titre de la note…"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 10, flexShrink: 0 }}>
          {!isMobile && (
            <span style={{ fontSize: 9, color: st.color, fontFamily: 'var(--font)', letterSpacing: '0.04em', transition: 'color 0.2s' }}>
              {st.label}
            </span>
          )}
          {!isMobile && <span style={{ color: 'var(--hairline-s)', fontSize: 10 }}>·</span>}
          {!isMobile && <ActionLink onClick={exportMd}>[↓ export]</ActionLink>}
          <ActionLink onClick={() => onDelete(note.id)} danger isMobile={isMobile}>
            {isMobile ? '[x]' : '[x suppr]'}
          </ActionLink>
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MDEditor
          value={content}
          onChange={v => { setContent(v ?? ''); mark(); }}
          height="100%"
          preview={isMobile ? 'edit' : 'live'}
          visibleDragbar={false}
        />
      </div>

      {/* Backlinks panel */}
      {showLinks && backlinks && (
        <div style={{
          borderTop: '1px solid var(--hairline)',
          maxHeight: 140, overflowY: 'auto',
          background: 'var(--surface-s)',
          padding: '8px 0',
          flexShrink: 0,
        }}>
          {backlinks.incoming.length === 0 && backlinks.outgoing.length === 0 && (
            <div style={{ padding: '4px 20px', fontSize: 10, color: 'var(--ash)' }}>[ ] aucun lien</div>
          )}
          {backlinks.incoming.length > 0 && (
            <>
              <div style={{ padding: '2px 20px 4px', fontSize: 9, color: 'var(--ash)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>← cité par</div>
              {backlinks.incoming.map(n => (
                <button key={n.id} onClick={() => onSelectNote?.(n.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '4px 20px', fontSize: 11, color: 'var(--mute)',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
                >{n.title}</button>
              ))}
            </>
          )}
          {backlinks.outgoing.length > 0 && (
            <>
              <div style={{ padding: '4px 20px 4px', fontSize: 9, color: 'var(--ash)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>→ liens vers</div>
              {backlinks.outgoing.map(n => (
                <button key={n.id} onClick={() => onSelectNote?.(n.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '4px 20px', fontSize: 11, color: 'var(--mute)',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
                >{n.title}</button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        height: 30,
        background: isMobile ? 'var(--canvas)' : 'var(--surface-s)',
        borderTop: '1px solid var(--hairline)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 9, color: 'var(--stone)', letterSpacing: '0.04em' }}>
            {words} mot{words !== 1 ? 's' : ''} · {readTime(words)} min
          </span>
          <button onClick={toggleLinks} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 9, fontFamily: 'var(--font)', letterSpacing: '0.04em',
            color: showLinks ? 'var(--ink)' : 'var(--ash)',
            padding: 0, transition: 'color 0.1s',
          }}>
            [⇥ liens]
          </button>
        </div>
        {isMobile ? (
          <span style={{ fontSize: 9, color: st.color, fontFamily: 'var(--font)', letterSpacing: '0.04em', transition: 'color 0.2s' }}>
            {st.label}
          </span>
        ) : (
          <span style={{ fontSize: 9, color: 'var(--ash)', letterSpacing: '0.03em' }}>
            {'[[titre]] lier · #tag taguer · '}
            <kbd style={{
              fontFamily: 'var(--font)', fontSize: 8,
              background: 'var(--surface-c)',
              border: '1px solid var(--hairline)',
              borderRadius: 3, padding: '0 4px',
            }}>⌘S</kbd>
            {' sauvegarder'}
          </span>
        )}
      </div>
    </div>
  );
}

function ActionLink({ onClick, children, danger, isMobile }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font)', fontSize: isMobile ? 13 : 10,
        color: hover ? (danger ? '#c04040' : 'var(--ink)') : 'var(--mute)',
        padding: isMobile ? '0 4px' : 0, transition: 'color 0.1s',
        letterSpacing: '0.02em',
        minHeight: isMobile ? 44 : 'auto',
        minWidth: isMobile ? 44 : 'auto',
        display: isMobile ? 'flex' : 'inline',
        alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  );
}
