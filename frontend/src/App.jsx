import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Editor from './components/Editor.jsx';
import Graph from './components/Graph.jsx';
import Home from './components/Home.jsx';
import Search from './components/Search.jsx';
import Tags from './components/Tags.jsx';
import Trash from './components/Trash.jsx';
import Agenda from './components/Agenda.jsx';
import ToastContainer from './components/Toast.jsx';
import { useNotes } from './hooks/useNotes.js';
import { useToast } from './hooks/useToast.js';
import { useIsMobile } from './hooks/useIsMobile.js';
import { getDailyNote } from './api/notes.js';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch { return 'light'; }
}

export default function App() {
  const { notes, loading, refreshKey, createNote, updateNote, deleteNote, refetch } = useNotes();
  const { toasts, toast } = useToast();
  const isMobile = useIsMobile();

  const [selectedId, setSelectedId]   = useState(null);
  const [view, setView]               = useState('editor');
  const [graphKey, setGraphKey]       = useState(0);
  const [theme, setTheme]             = useState(getInitialTheme);
  const [mobilePanel, setMobilePanel] = useState('home'); // 'home' | 'list' | 'editor' | 'graph'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const selectedNote = notes.find(n => n.id === selectedId) ?? null;

  // Ref pour accéder aux notes dans le handler popstate sans dépendance réactive
  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  const handleCreate = useCallback(async () => {
    const note = await createNote('Nouvelle note');
    setSelectedId(note.id);
    setView('editor');
    setMobilePanel('editor');
    window.history.pushState({ scene: 'editor', noteId: note.id }, '');
    toast('note créée', 'success');
  }, [createNote, toast]);

  const handleDelete = useCallback(async (id) => {
    await deleteNote(id);
    setSelectedId(null);
    setMobilePanel('home');
    window.history.pushState({ scene: 'home' }, '');
    toast('note supprimée', 'info');
  }, [deleteNote, toast]);

  const handleHome = useCallback(() => {
    setSelectedId(null);
    setView('editor');
    setMobilePanel('home');
    window.history.pushState({ scene: 'home' }, '');
  }, []);

  const handleSave = useCallback(async (data) => {
    if (!selectedId) return;
    await updateNote(selectedId, data);
  }, [selectedId, updateNote]);

  const handleSelectNote = useCallback((id) => {
    setSelectedId(id);
    setView('editor');
    setMobilePanel('editor');
    window.history.pushState({ scene: 'editor', noteId: id }, '');
  }, []);

  const switchToGraph = useCallback(() => {
    setGraphKey(k => k + 1);
    setView('graph');
    setMobilePanel('graph');
    window.history.pushState({ scene: 'graph' }, '');
  }, []);

  const handleOpenSearch = useCallback(() => {
    setView('search');
    setMobilePanel('search');
    window.history.pushState({ scene: 'search' }, '');
  }, []);

  const handleOpenTags = useCallback(() => {
    setView('tags');
    setMobilePanel('tags');
    window.history.pushState({ scene: 'tags' }, '');
  }, []);

  const handleOpenTrash = useCallback(() => {
    setView('trash');
    setMobilePanel('trash');
    window.history.pushState({ scene: 'trash' }, '');
  }, []);

  const handleOpenAgenda = useCallback(() => {
    setView('agenda');
    setMobilePanel('agenda');
    window.history.pushState({ scene: 'agenda' }, '');
  }, []);

  const handleDaily = useCallback(async () => {
    try {
      const note = await getDailyNote();
      setSelectedId(note.id);
      setView('editor');
      setMobilePanel('editor');
      window.history.pushState({ scene: 'editor', noteId: note.id }, '');
      toast('journal ouvert', 'success');
    } catch {
      toast('erreur journal', 'error');
    }
  }, [toast]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); handleCreate(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleCreate]);

  // Gestion du bouton "retour" : navigue dans l'app au lieu de quitter.
  // replaceState sur mount convertit l'entrée full-load en entrée same-document
  // → naviguer vers elle déclenche popstate au lieu d'un rechargement complet.
  useEffect(() => {
    window.history.replaceState({ scene: 'home' }, '');
  }, []);

  useEffect(() => {
    const onPopState = (e) => {
      const s = e.state;
      if (!s || s.scene === 'home') {
        setSelectedId(null);
        setView('editor');
        setMobilePanel('home');
      } else if (s.scene === 'editor') {
        const exists = notesRef.current.find(n => n.id === s.noteId);
        if (exists) {
          setSelectedId(s.noteId);
          setView('editor');
          setMobilePanel('editor');
        } else {
          setSelectedId(null);
          setView('editor');
          setMobilePanel('home');
          window.history.replaceState({ scene: 'home' }, '');
        }
      } else if (s.scene === 'graph') {
        setGraphKey(k => k + 1);
        setView('graph');
        setMobilePanel('graph');
      } else if (s.scene === 'search') {
        setView('search'); setMobilePanel('search');
      } else if (s.scene === 'tags') {
        setView('tags'); setMobilePanel('tags');
      } else if (s.scene === 'trash') {
        setView('trash'); setMobilePanel('trash');
      } else if (s.scene === 'agenda') {
        setView('agenda'); setMobilePanel('agenda');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);


  // ── Mobile layout ─────────────────────────────────
  if (isMobile) {
    const BOTTOM_H = 52;
    const TOP_H    = 48;

    const topbarTitle = () => {
      if (mobilePanel === 'editor' && selectedNote) return selectedNote.title;
      if (mobilePanel === 'list') return 'notes';
      if (mobilePanel === 'graph') return 'graphe';
      if (mobilePanel === 'search') return 'recherche';
      if (mobilePanel === 'tags') return 'tags';
      if (mobilePanel === 'trash') return 'corbeille';
      if (mobilePanel === 'agenda') return 'agenda';
      return 'notAPP.';
    };

    const handleBack = () => {
      if (mobilePanel === 'editor') setMobilePanel('list');
      else setMobilePanel('home');
    };

    const showBack = mobilePanel !== 'home';
    const showAdd  = mobilePanel === 'list' || mobilePanel === 'home';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--canvas)', overflow: 'hidden' }}>
        {/* Mobile topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: TOP_H, flexShrink: 0,
          background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)',
        }}>
          {showBack ? (
            <button
              onClick={handleBack}
              style={{ ...btnReset, fontSize: 12, color: 'var(--mute)', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              [←]
            </button>
          ) : (
            <div style={{ width: 44 }} />
          )}

          <button
            onClick={handleHome}
            style={{ ...btnReset, fontSize: 11, fontWeight: 500, color: 'var(--ink)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}
          >
            {topbarTitle()}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 44, justifyContent: 'flex-end' }}>
            {showAdd && (
              <button onClick={handleCreate} style={{ ...btnReset, fontSize: 12, fontWeight: 700, color: 'var(--mute)', minHeight: 44, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
              >
                [+]
              </button>
            )}
            <button onClick={toggleTheme} style={{ ...btnReset, fontSize: 12, color: 'var(--mute)', minHeight: 44, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
            >
              {theme === 'light' ? '[○]' : '[●]'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {mobilePanel === 'home' && (
            <Home
              notes={notes}
              onCreate={handleCreate}
              onDaily={handleDaily}
              onSwitchToGraph={switchToGraph}
              onSelectNote={handleSelectNote}
              theme={theme}
              isMobile
            />
          )}
          {mobilePanel === 'list' && (
            <Sidebar
              notes={notes}
              selectedId={selectedId}
              refreshKey={refreshKey}
              onSelect={handleSelectNote}
              onCreate={handleCreate}
              isMobile
            />
          )}
          {mobilePanel === 'editor' && (
            <Editor
              note={selectedNote}
              onSave={handleSave}
              onDelete={handleDelete}
              onToast={toast}
              theme={theme}
              isMobile
              onSelectNote={handleSelectNote}
            />
          )}
          {mobilePanel === 'search' && (
            <Search onSelectNote={handleSelectNote} isMobile />
          )}
          {mobilePanel === 'tags' && (
            <Tags refreshKey={refreshKey} onSelectNote={handleSelectNote} isMobile />
          )}
          {mobilePanel === 'graph' && (
            <Graph
              key={graphKey}
              theme={theme}
              onSelectNode={(id) => { setSelectedId(id); setMobilePanel('editor'); }}
              isMobile
            />
          )}
          {mobilePanel === 'trash' && (
            <Trash onRestored={refetch} isMobile />
          )}
          {mobilePanel === 'agenda' && (
            <Agenda onSelectNote={(id) => { handleSelectNote(id); }} isMobile />
          )}
        </div>

        {/* Bottom tab bar */}
        <div style={{
          display: 'flex', flexShrink: 0,
          height: BOTTOM_H,
          background: 'var(--canvas)',
          borderTop: '1px solid var(--hairline)',
        }}>
          {[
            { id: 'list',   label: 'notes'                          },
            { id: 'search', label: 'recherche', action: handleOpenSearch },
            { id: 'agenda', label: 'agenda',    action: handleOpenAgenda },
            { id: 'graph',  label: 'graphe',    action: switchToGraph    },
            { id: 'trash',  label: 'corbeille', action: handleOpenTrash  },
          ].map(tab => {
            const active = mobilePanel === tab.id
              || (tab.id === 'list' && (mobilePanel === 'editor' || mobilePanel === 'home'));
            return (
              <button
                key={tab.id}
                onClick={() => tab.action ? tab.action() : setMobilePanel(tab.id)}
                style={{
                  ...btnReset,
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: 'var(--font)', fontWeight: active ? 500 : 400,
                  color: active ? 'var(--ink)' : 'var(--mute)',
                  borderBottom: active ? '2px solid var(--ink)' : '2px solid transparent',
                  transition: 'all 0.1s',
                }}
              >
                {active ? `[${tab.label}]` : tab.label}
              </button>
            );
          })}
        </div>

        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--canvas)' }}>
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        refreshKey={refreshKey}
        onSelect={handleSelectNote}
        onCreate={handleCreate}
        onHome={handleHome}
        onDaily={handleDaily}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 44,
          background: 'var(--canvas)', borderBottom: '1px solid var(--hairline)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <TabBtn active={view === 'editor'} onClick={() => { setView('editor'); }}>éditeur</TabBtn>
            <TabBtn active={view === 'search'} onClick={handleOpenSearch}>recherche</TabBtn>
            <TabBtn active={view === 'tags'} onClick={handleOpenTags}>tags</TabBtn>
            <TabBtn active={view === 'graph'} onClick={switchToGraph}>graphe</TabBtn>
            <TabBtn active={view === 'agenda'} onClick={handleOpenAgenda}>agenda</TabBtn>
            <TabBtn active={view === 'trash'} onClick={handleOpenTrash}>corbeille</TabBtn>
          </div>
          {view === 'editor' && selectedNote && (
            <span style={{ fontSize: 11, color: 'var(--stone)', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40%' }}>
              {selectedNote.title}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggleTheme} style={{ ...btnReset, fontSize: 10, color: 'var(--mute)', padding: '2px 4px' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
            >
              {theme === 'light' ? '[○]' : '[●]'}
            </button>
            <kbd style={{ fontSize: 10, fontFamily: 'var(--font)', color: 'var(--mute)', background: 'var(--surface-c)', border: '1px solid var(--hairline)', borderRadius: 4, padding: '1px 6px' }}>⌘N</kbd>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'editor' ? (
            selectedNote
              ? <Editor note={selectedNote} onSave={handleSave} onDelete={handleDelete} onToast={toast} theme={theme} onSelectNote={handleSelectNote} />
              : <Home notes={notes} onCreate={handleCreate} onDaily={handleDaily} onSwitchToGraph={switchToGraph} onSelectNote={handleSelectNote} theme={theme} />
          ) : view === 'graph' ? (
            <Graph key={graphKey} theme={theme} onSelectNode={(id) => { setSelectedId(id); setView('editor'); }} />
          ) : view === 'search' ? (
            <Search onSelectNote={handleSelectNote} />
          ) : view === 'tags' ? (
            <Tags refreshKey={refreshKey} onSelectNote={handleSelectNote} />
          ) : view === 'trash' ? (
            <Trash onRestored={refetch} />
          ) : view === 'agenda' ? (
            <Agenda onSelectNote={(id) => { setSelectedId(id); setView('editor'); }} />
          ) : null}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

const btnReset = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font)', padding: 0, WebkitTapHighlightColor: 'transparent',
  transition: 'color 0.1s',
};

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      ...btnReset,
      padding: '3px 12px', borderRadius: 4, fontSize: 11,
      fontWeight: active ? 500 : 400, letterSpacing: '0.03em',
      border: '1px solid transparent',
      background: active ? 'var(--surface-c)' : 'transparent',
      color: active ? 'var(--ink)' : 'var(--mute)',
    }}>
      {children}
    </button>
  );
}
