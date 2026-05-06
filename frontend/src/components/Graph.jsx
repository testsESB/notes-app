import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getGraph } from '../api/notes.js';

const THEMES = {
  light: {
    bg:       '#f7f7f5',
    surface:  '#eeebe8',
    node:     '#1a1818',
    nodeHi:   '#1a1818',
    edgeWiki: 'rgba(59,130,246,0.70)',   // bleu  — wiki-link
    edgeTag:  'rgba(234,179,8,0.75)',    // ambre — tag commun
    edgeAuto: 'rgba(20,184,166,0.55)',   // teal  — mots-clés
    label:    'rgba(26,24,24,0.6)',
    labelHi:  '#1a1818',
    text:     '#706c6c',
    textHi:   '#1a1818',
    border:   'rgba(26,24,24,0.09)',
  },
  dark: {
    bg:       '#060606',
    surface:  '#141414',
    node:     '#eeebe8',
    nodeHi:   '#ffffff',
    edgeWiki: 'rgba(96,165,250,0.70)',   // bleu clair  — wiki-link
    edgeTag:  'rgba(250,204,21,0.65)',   // ambre clair — tag commun
    edgeAuto: 'rgba(45,212,191,0.50)',   // teal clair  — mots-clés
    label:    'rgba(238,235,232,0.5)',
    labelHi:  '#eeebe8',
    text:     '#7a7676',
    textHi:   '#eeebe8',
    border:   'rgba(238,235,232,0.08)',
  },
};

const TYPES = [
  { key: 'wiki', colorKey: 'edgeWiki', label: 'wiki-link',  marker: '[[]]' },
  { key: 'tag',  colorKey: 'edgeTag',  label: 'tag commun', marker: '#'    },
  { key: 'auto', colorKey: 'edgeAuto', label: 'mots-clés',  marker: '~'    },
];

export default function Graph({ onSelectNode, theme = 'light', isMobile }) {
  const [rawNodes, setRawNodes] = useState([]);
  const [rawLinks, setRawLinks] = useState([]);
  const [hovered, setHovered]   = useState(null);
  const [visible, setVisible]   = useState({ wiki: true, tag: true, auto: true });
  const fgRef = useRef(null);
  const T = THEMES[theme] ?? THEMES.light;

  useEffect(() => {
    getGraph().then(({ nodes, edges }) => {
      const degree = {};
      edges.forEach(e => {
        degree[e.source] = (degree[e.source] || 0) + 1;
        degree[e.target] = (degree[e.target] || 0) + 1;
      });
      setRawNodes(nodes.map(n => ({ ...n, name: n.label, degree: degree[n.id] || 0 })));
      setRawLinks(edges);
    });
  }, []);

  const toggle = (key) => setVisible(v => ({ ...v, [key]: !v[key] }));

  // Pass fresh link copies to ForceGraph so rawLinks stay unmodified by D3 mutation.
  // linkVisibility handles show/hide without re-triggering the simulation.
  const graphData = useMemo(() => ({
    nodes: rawNodes,
    links: rawLinks.map(l => ({ ...l })),
  }), [rawNodes, rawLinks]);

  const visibleCount = rawLinks.filter(l => visible[l.type]).length;

  const paintNode = useCallback((node, ctx, gs) => {
    const r   = 3.5 + Math.min((node.degree || 0) * 1.4, 7);
    const isH = hovered === node.id;

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isH ? T.nodeHi : T.node;
    ctx.fill();

    const fs = Math.max(9 / gs, 2.2);
    ctx.font = `${isH ? 500 : 400} ${fs}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isH ? T.labelHi : T.label;
    ctx.textAlign = 'center';
    ctx.fillText(node.name, node.x, node.y + r + fs + 1.5);
  }, [hovered, T]);

  const edgeColor  = useCallback(l => T[{ wiki: 'edgeWiki', tag: 'edgeTag', auto: 'edgeAuto' }[l.type]] ?? T.edgeAuto, [T]);
  const edgeVisible = useCallback(l => visible[l.type] ?? true, [visible]);

  const panel = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    fontFamily: 'var(--font)',
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: T.bg }}>

      {/* Header bar — desktop */}
      {!isMobile && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px',
          borderBottom: `1px solid ${T.border}`,
          zIndex: 10, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 10, color: T.text, letterSpacing: '0.06em' }}>
            notes · graphe
          </span>
          <span style={{ fontSize: 10, color: T.text }}>
            {rawNodes.length} nœuds · {visibleCount} connexion{visibleCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Stats — mobile */}
      {isMobile && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 10, color: T.text, fontFamily: 'var(--font)' }}>
            {rawNodes.length} nœuds · {visibleCount} connexions
          </span>
        </div>
      )}

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel=""
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        linkColor={edgeColor}
        linkVisibility={edgeVisible}
        linkWidth={l => l.type === 'wiki' ? 1.4 : 0.8}
        linkDirectionalParticles={l => l.type === 'wiki' && visible.wiki ? 1 : 0}
        linkDirectionalParticleWidth={1.4}
        linkDirectionalParticleColor={() => T.edgeWiki}
        linkDirectionalParticleSpeed={0.003}
        onNodeClick={node => onSelectNode(node.id)}
        onNodeHover={node => setHovered(node?.id ?? null)}
        backgroundColor={T.bg}
        cooldownTicks={150}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 80)}
      />

      {/* Hovered tooltip */}
      {hovered != null && (() => {
        const n = rawNodes.find(n => n.id === hovered);
        if (!n) return null;
        return (
          <div style={{
            ...panel,
            position: 'absolute', top: isMobile ? 30 : 48, left: '50%', transform: 'translateX(-50%)',
            padding: '4px 12px', fontSize: 11, color: T.textHi,
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {n.name}
            {n.degree > 0 && (
              <span style={{ color: T.text, marginLeft: 8 }}>
                {n.degree} lien{n.degree > 1 ? 's' : ''}
              </span>
            )}
          </div>
        );
      })()}

      {/* Legend — desktop, cliquable */}
      {!isMobile && (
        <div style={{ ...panel, position: 'absolute', bottom: 20, right: 20, padding: '10px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TYPES.map(({ key, colorKey, label, marker }) => {
              const on = visible[key];
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '3px 0', fontFamily: 'var(--font)',
                    opacity: on ? 1 : 0.35,
                    transition: 'opacity 0.15s',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: 10, color: on ? T[colorKey] : T.text, minWidth: 28, textAlign: 'left' }}>
                    {marker}
                  </span>
                  <span style={{
                    fontSize: 10, color: T.text,
                    textDecoration: on ? 'none' : 'line-through',
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}`, fontSize: 9, color: T.text, opacity: 0.55 }}>
            clic pour filtrer · ouvrir nœud
          </div>
        </div>
      )}

      {/* Toggles — mobile, horizontal strip */}
      {isMobile && (
        <div style={{
          ...panel,
          position: 'absolute', bottom: 68, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 0,
          overflow: 'hidden',
        }}>
          {TYPES.map(({ key, colorKey, label, marker }, i) => {
            const on = visible[key];
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', padding: '8px 12px',
                  borderRight: i < TYPES.length - 1 ? `1px solid ${T.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                  opacity: on ? 1 : 0.3,
                  transition: 'opacity 0.15s',
                  minHeight: 44, WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 10, color: on ? T[colorKey] : T.text }}>{marker}</span>
                <span style={{ fontSize: 9, color: T.text, textDecoration: on ? 'none' : 'line-through' }}>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Zoom reset */}
      <button
        onClick={() => fgRef.current?.zoomToFit(400, 80)}
        style={{
          ...panel,
          position: 'absolute', bottom: isMobile ? 16 : 20, left: isMobile ? 16 : 20,
          padding: isMobile ? '10px 16px' : '5px 10px',
          minHeight: isMobile ? 44 : 'auto',
          fontSize: 11, color: T.text,
          cursor: 'pointer', background: T.surface,
          transition: 'color 0.1s',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.textHi}
        onMouseLeave={e => e.currentTarget.style.color = T.text}
      >
        [⊕ recentrer]
      </button>
    </div>
  );
}
