import React, { useState, useEffect, useCallback } from 'react';
import { getAgenda } from '../api/notes.js';

const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const FR_DAYS   = ['lun','mar','mer','jeu','ven','sam','dim'];

function isoDate(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// Monday-first day index 0-6
function dayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export default function Agenda({ onSelectNote, isMobile }) {
  const now   = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [data, setData]   = useState({});
  const [selected, setSelected] = useState(null); // 'YYYY-MM-DD'

  const load = useCallback(() => {
    getAgenda(year, month).then(setData).catch(() => setData({}));
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = dayIndex(firstDay); // 0=Mon
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const selectedNotes = selected ? (data[selected] ?? []) : [];

  const pad = isMobile ? '12px 16px' : '16px 24px';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--canvas)', fontFamily: 'var(--font)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '14px 24px',
        borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        <NavBtn onClick={prevMonth} label="[←]" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>
          {FR_MONTHS[month - 1]} {year}
        </span>
        <NavBtn onClick={nextMonth} label="[→]" />
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '0 16px',
        borderBottom: '1px solid var(--hairline)', flexShrink: 0,
      }}>
        {FR_DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 9, color: 'var(--ash)',
            letterSpacing: '0.06em', padding: '6px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '8px 16px', gap: 2, flexShrink: 0,
      }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = isoDate(year, month, day);
          const hasNotes = !!(data[dateStr]?.length);
          const isToday = dateStr === todayStr;
          const isSel   = dateStr === selected;
          return (
            <button
              key={i}
              onClick={() => setSelected(isSel ? null : dateStr)}
              style={{
                background: isSel ? 'var(--ink)' : isToday ? 'var(--surface-c)' : 'none',
                border: isToday && !isSel ? '1px solid var(--hairline-s)' : '1px solid transparent',
                borderRadius: 4,
                cursor: hasNotes || isToday ? 'pointer' : 'default',
                fontFamily: 'var(--font)', fontSize: 11,
                color: isSel ? 'var(--canvas)' : isToday ? 'var(--ink)' : hasNotes ? 'var(--body)' : 'var(--ash)',
                fontWeight: isToday || hasNotes ? 500 : 400,
                padding: '6px 2px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 0.1s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface-c)'; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isToday ? 'var(--surface-c)' : 'none'; }}
            >
              {day}
              {hasNotes && (
                <span style={{
                  width: 3, height: 3, borderRadius: '50%',
                  background: isSel ? 'var(--canvas)' : 'var(--mute)',
                  display: 'block',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day notes */}
      {selected && (
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          borderTop: '1px solid var(--hairline)',
        }}>
          {selectedNotes.length === 0 ? (
            <div style={{ padding: pad, fontSize: 10, color: 'var(--ash)', letterSpacing: '0.03em' }}>
              [ ] aucune note pour ce jour
            </div>
          ) : (
            <>
              <div style={{ padding: isMobile ? '8px 16px 4px' : '10px 24px 4px', fontSize: 9, color: 'var(--ash)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {selected}
              </div>
              {selectedNotes.map(n => (
                <button
                  key={n.id}
                  onClick={() => onSelectNote?.(n.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: isMobile ? '10px 16px' : '8px 24px',
                    fontSize: 11, color: 'var(--mute)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font)', letterSpacing: '0.01em',
                    borderBottom: '1px solid var(--hairline)',
                    transition: 'color 0.1s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--mute)'}
                >
                  {n.title}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {!selected && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--stone)', letterSpacing: '0.03em' }}>
            {Object.values(data).flat().length === 0
              ? '[ ] aucune note ce mois-ci'
              : 'clique sur un jour pour voir les notes'}
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ onClick, label }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font)', fontSize: 11,
        color: hover ? 'var(--ink)' : 'var(--mute)',
        padding: '2px 6px', transition: 'color 0.1s',
        minHeight: 36, minWidth: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

