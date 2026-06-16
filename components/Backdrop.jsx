'use client';
import { useMemo } from 'react';

const INGREDIENTS = ['🍜','🌶️','🥬','🍄','🍅','🥟','🍤','🌽','🧄','🥩'];

export default function Backdrop({ children, showSpotlight = true }) {
  // generate ambient elements once
  const stars = useMemo(() =>
    Array.from({ length: 70 }).map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 78,
      dur: 2.5 + Math.random() * 4,
      delay: Math.random() * 5,
      size: Math.random() < 0.2 ? 3 : 2,
    })), []);

  const streaks = useMemo(() =>
    Array.from({ length: 6 }).map(() => ({
      left: Math.random() * 90,
      sdur: 7 + Math.random() * 6,
      sdelay: Math.random() * 8,
    })), []);

  const fogs = useMemo(() =>
    Array.from({ length: 4 }).map((_, i) => ({
      left: i * 26 - 8,
      fdur: 20 + Math.random() * 12,
    })), []);

  const steams = useMemo(() =>
    Array.from({ length: 5 }).map(() => ({
      left: 10 + Math.random() * 80,
      stdur: 9 + Math.random() * 6,
      delay: Math.random() * 6,
    })), []);

  const ingredients = useMemo(() =>
    Array.from({ length: 7 }).map((_, i) => ({
      emoji: INGREDIENTS[i % INGREDIENTS.length],
      top: 12 + Math.random() * 55,
      idur: 18 + Math.random() * 16,
      idelay: Math.random() * 22,
    })), []);

  return (
    <div className="stage">
      {stars.map((s, i) => (
        <span key={`st${i}`} className="star"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size,
            '--dur': `${s.dur}s`, '--delay': `${s.delay}s` }} />
      ))}
      {streaks.map((s, i) => (
        <span key={`sk${i}`} className="streak"
          style={{ left: `${s.left}%`, '--sdur': `${s.sdur}s`, '--sdelay': `${s.sdelay}s` }} />
      ))}
      {fogs.map((f, i) => (
        <span key={`fg${i}`} className="fog"
          style={{ left: `${f.left}%`, '--fdur': `${f.fdur}s` }} />
      ))}
      {steams.map((s, i) => (
        <span key={`stm${i}`} className="steam"
          style={{ left: `${s.left}%`, '--stdur': `${s.stdur}s`, animationDelay: `${s.delay}s` }} />
      ))}
      {ingredients.map((g, i) => (
        <span key={`ig${i}`} className="ingredient"
          style={{ top: `${g.top}%`, '--idur': `${g.idur}s`, '--idelay': `${g.idelay}s` }}>{g.emoji}</span>
      ))}

      {showSpotlight && (
        <div className="spotlight">
          <div className="beam" />
          <div className="lamp" />
        </div>
      )}

      {children}
    </div>
  );
}
