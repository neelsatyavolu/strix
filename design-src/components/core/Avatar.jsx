import React from 'react';

/** Avatar — circular initials or image. */
export function Avatar({
  name = '',
  src,
  size = 'md',  // 'sm' | 'md' | 'lg'
  color,        // optional override
  presence,     // 'online' | 'idle' | 'offline'
  style: styleProp,
}) {
  const D = { sm: 24, md: 32, lg: 44 };
  const FZ = { sm: 10, md: 12, lg: 16 };
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase() || '?';
  // Deterministic color from name
  const palette = ['#6B47C7', '#0E8A6F', '#2E5BFF', '#D8721A', '#D92D20', '#0A1330'];
  const bg = color ?? palette[hash(name) % palette.length];

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...styleProp }}>
      <div style={{
        width: D[size], height: D[size],
        borderRadius: '50%',
        background: src ? 'transparent' : bg,
        color: '#fff',
        display: 'grid', placeItems: 'center',
        fontWeight: 600, fontSize: FZ[size], fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10)',
      }}>
        {src
          ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>
      {presence && (
        <span style={{
          position: 'absolute', right: -1, bottom: -1,
          width: Math.max(8, D[size] / 4), height: Math.max(8, D[size] / 4),
          borderRadius: '50%',
          background: presence === 'online' ? 'var(--success)' :
                       presence === 'idle' ? 'var(--warning)' :
                       'var(--ink-4)',
          boxShadow: '0 0 0 2px var(--paper)',
        }}/>
      )}
    </div>
  );
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
