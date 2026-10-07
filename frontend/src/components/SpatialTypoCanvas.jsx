import React, { useState } from 'react';

/**
 * SpatialTypoCanvas
 * High-performance, 100% lag-free editorial typographic grid.
 * Uses hardware-accelerated CSS frosted porcelain droplet layers with natural parallax.
 * Directly captures the spatial letter aesthetic of Image 2 with zero WebGL overhead.
 */
const PHRASES = {
  proveIt: {
    id: 'proveIt',
    title: 'PROVE IT.',
    sub: 'WHAT YOU CLAIM VS WHAT YOU CAN PROVE',
    meta: 'VERIFIED SKILLS • REAL CODE PROOF',
    rows: [
      [
        { char: 'P', x: 20, y: 22, size: 5.5 },
        { char: 'R', x: 44, y: 16, size: 5.5 },
        { char: 'O', x: 72, y: 24, size: 5.8 },
      ],
      [
        { char: 'V', x: 30, y: 50, size: 5.5 },
        { char: 'E', x: 58, y: 46, size: 5.5 },
      ],
      [
        { char: 'I', x: 40, y: 76, size: 5.5 },
        { char: 'T', x: 64, y: 74, size: 5.5 },
        { char: '.', x: 76, y: 76, size: 5.5, color: 'var(--accent-warm)' },
      ]
    ]
  },
  knowStand: {
    id: 'knowStand',
    title: 'STAND',
    sub: 'HONEST POSITIONING',
    meta: 'READINESS 78/100 • TOP 15%',
    rows: [
      [
        { char: 'S', x: 18, y: 24, size: 5.2 },
        { char: 'T', x: 42, y: 18, size: 5.2 },
        { char: 'A', x: 70, y: 26, size: 5.5 },
      ],
      [
        { char: 'N', x: 32, y: 52, size: 5.2 },
        { char: 'D', x: 60, y: 48, size: 5.2 },
        { char: '.', x: 74, y: 50, size: 5.2, color: 'var(--accent-warm)' },
      ]
    ]
  },
  reactClaim: {
    id: 'reactClaim',
    title: 'CLAIM',
    sub: 'STARTING POINT',
    meta: 'REACT 91% • 4 REPOSITORIES',
    rows: [
      [
        { char: 'I', x: 20, y: 20, size: 5.0 },
        { char: 'K', x: 38, y: 26, size: 5.0 },
        { char: 'N', x: 66, y: 20, size: 5.0 },
      ],
      [
        { char: 'O', x: 28, y: 48, size: 5.2 },
        { char: 'W', x: 56, y: 54, size: 5.0 },
      ],
      [
        { char: 'R', x: 24, y: 76, size: 5.0 },
        { char: 'E', x: 46, y: 72, size: 5.0 },
        { char: 'A', x: 68, y: 78, size: 5.0 },
        { char: 'C', x: 82, y: 74, size: 5.0 },
      ]
    ]
  }
};

export default function SpatialTypoCanvas() {
  const [activePreset, setActivePreset] = useState('proveIt');
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const currentPhrase = PHRASES[activePreset];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: nx * 18, y: ny * 14 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <div className="spatial-typo-outer" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* Editorial Header Controls */}
      <div className="spatial-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="template-top-pill" style={{ margin: 0, padding: '0.25rem 0.75rem' }}>
            Interactive Word Grid
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            // Click to switch phrasing
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            className={`btn-pill-outline btn-sm ${activePreset === 'proveIt' ? 'active' : ''}`}
            onClick={() => setActivePreset('proveIt')}
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.85rem',
              background: activePreset === 'proveIt' ? 'var(--text-primary)' : '#FFFFFF',
              color: activePreset === 'proveIt' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            “P R O V E  I T .”
          </button>
          <button
            className={`btn-pill-outline btn-sm ${activePreset === 'knowStand' ? 'active' : ''}`}
            onClick={() => setActivePreset('knowStand')}
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.85rem',
              background: activePreset === 'knowStand' ? 'var(--text-primary)' : '#FFFFFF',
              color: activePreset === 'knowStand' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            “S T A N D .”
          </button>
          <button
            className={`btn-pill-outline btn-sm ${activePreset === 'reactClaim' ? 'active' : ''}`}
            onClick={() => setActivePreset('reactClaim')}
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.85rem',
              background: activePreset === 'reactClaim' ? 'var(--text-primary)' : '#FFFFFF',
              color: activePreset === 'reactClaim' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            “I  K N O W  R E A C T”
          </button>
        </div>
      </div>

      {/* Main Spatial Stage */}
      <div className="spatial-stage-box" style={{ height: '460px' }}>
        {/* Subtle background grid pattern */}
        <div className="spatial-grid-overlay" />

        {/* 1. Background Floating Porcelain Droplet (Upper Right) */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            right: '18%',
            width: '120px',
            height: '95px',
            borderRadius: '45% 55% 60% 40% / 50% 45% 55% 50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,238,230,0.8) 100%)',
            boxShadow: '0 20px 35px -8px rgba(24,37,27,0.08), inset 0 2px 6px rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.8)',
            transform: `translate(${mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px)`,
            transition: 'transform 0.15s ease-out',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        />

        {/* 2. Deconstructed Letterforms Layer */}
        <div className="spatial-letters-layer" style={{ zIndex: 6 }}>
          {currentPhrase.rows.map((row, rowIdx) => (
            <React.Fragment key={rowIdx}>
              {row.map((item, charIdx) => {
                const shiftX = mouseOffset.x * (charIdx % 2 === 0 ? 0.7 : -0.7);
                const shiftY = mouseOffset.y * (rowIdx % 2 === 0 ? 0.6 : -0.6);

                return (
                  <span
                    key={`${rowIdx}-${charIdx}`}
                    className="spatial-char"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      fontSize: `clamp(3rem, ${item.size}vw, 5.8rem)`,
                      color: item.color || 'var(--text-primary)',
                      transform: `translate(${shiftX}px, ${shiftY}px)`,
                    }}
                  >
                    {item.char}
                  </span>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* 3. Foreground Large Porcelain Droplet (Bottom Left, overlaps text just like Image 2!) */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '14%',
            width: '190px',
            height: '150px',
            borderRadius: '52% 48% 55% 45% / 48% 54% 46% 52%',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(246,244,236,0.7) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 25px 45px -10px rgba(24,37,27,0.12), inset 0 2px 8px rgba(255,255,255,0.95)',
            border: '1.5px solid rgba(255,255,255,0.9)',
            transform: `translate(${-mouseOffset.x * 1.2}px, ${-mouseOffset.y * 1.2}px)`,
            transition: 'transform 0.15s ease-out',
            zIndex: 8,
            pointerEvents: 'none'
          }}
        >
          {/* Subtle soft blue/sky reflection dot (matching reference image) */}
          <div
            style={{
              position: 'absolute',
              bottom: '28%',
              right: '25%',
              width: '32px',
              height: '24px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(160,195,235,0.45) 0%, transparent 70%)',
              filter: 'blur(4px)'
            }}
          />
        </div>

        {/* Small companion pebble */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '8%',
            width: '45px',
            height: '38px',
            borderRadius: '50% 50% 45% 55%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,238,230,0.7) 100%)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 12px 20px -4px rgba(24,37,27,0.08)',
            transform: `translate(${-mouseOffset.x * 0.9}px, ${-mouseOffset.y * 0.9}px)`,
            transition: 'transform 0.15s ease-out',
            zIndex: 8,
            pointerEvents: 'none'
          }}
        />

        {/* 4. Minimal Editorial Metadata Caption (Bottom Right, matching reference image) */}
        <div className="spatial-meta-stamp" style={{ zIndex: 10 }}>
          <span className="label-caps" style={{ color: 'var(--accent-warm)', display: 'block', marginBottom: '3px', fontSize: '0.68rem' }}>
            {currentPhrase.sub}
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
            CAREER READINESS PROOF
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {currentPhrase.meta}
          </div>
        </div>
      </div>
    </div>
  );
}
