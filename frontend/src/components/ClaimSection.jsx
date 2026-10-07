import React, { useState } from 'react';
import SpatialTypoCanvas from './SpatialTypoCanvas';

/**
 * Section 01: CLAIM
 * "I know React." → Minimal text → transitions into "PROVE IT."
 * Elevated with Avant-Garde Spatial Typographic Canvas & 3D porcelain forms
 */
export default function ClaimSection() {
  const [hasHovered, setHasHovered] = useState(false);

  return (
    <section className="section-claim" id="claim-section">
      <div className="container">
        <div className="claim-inner">
          <div className="section-tag">Resume Bullets vs Real Code</div>

          <div 
            className="claim-quote-box"
            onMouseEnter={() => setHasHovered(true)}
          >
            <div className="claim-label">Self-Reported Resume Bullet</div>
            <div className="claim-text-large">
              “I know React.”
            </div>
          </div>

          <div className="claim-transition-arrow">
            <span className="claim-arrow-line"></span>
            <span className="label-caps">Verified Against GitHub</span>
            <span className="claim-arrow-line"></span>
          </div>

          <div className="claim-prove-it">
            BACK IT UP WITH REAL CODE.
          </div>

          <p className="claim-editorial-note">
            Anyone can write a skill on a resume. ProfiQ connects your self-reported claims 
            to the code you actually built—giving you verified proof that hiring managers trust.
          </p>

          {/* Avant-Garde Spatial Typographic Grid with 3D Porcelain Droplets */}
          <SpatialTypoCanvas />
        </div>
      </div>
    </section>
  );
}
