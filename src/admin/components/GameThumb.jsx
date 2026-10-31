import React from 'react';
import { Egg, Sprout, Circle, Calculator, FlaskConical, BookOpen, Gamepad2 } from 'lucide-react';

const ICONS = { Egg, Sprout, Circle, Calculator, FlaskConical, BookOpen, Gamepad2 };

export default function GameThumb({ game, size = 150, rounded = 0 }) {
  const Icon = ICONS[game.icon] || Gamepad2;
  if (game.thumbnail) {
    return <img src={game.thumbnail} alt={`${game.name} thumbnail`} loading="lazy" style={{ width: '100%', height: size, objectFit: 'cover', borderRadius: rounded }} />;
  }
  return (
    <div style={{ width: '100%', height: size, display: 'grid', placeItems: 'center', background: `color-mix(in srgb, ${game.color} 22%, var(--surface))`, borderRadius: rounded }} role="img" aria-label={`${game.name} placeholder thumbnail`}>
      <Icon size={Math.min(56, size / 2.5)} color={game.color} strokeWidth={1.8} aria-hidden />
    </div>
  );
}
