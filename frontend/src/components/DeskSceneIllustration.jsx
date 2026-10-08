import React from 'react';

/**
 * DeskSceneIllustration
 * High-craft editorial meeting table scene faithfully recreating the SayBriefly aesthetic:
 * - Butter-yellow halo arch in background
 * - Crisp, 100% unobscured Candidate Brief card with dynamic dock updates
 * - Central candidate engineer in 3/4 profile with terracotta curls, wireless earbud, green top, lilac laptop & yellow tea mug
 * - 6 charming editorial line-art colleagues collaborating along the table
 * - 100% lag-free SVG vector artwork with zero WebGL overhead
 */
export default function DeskSceneIllustration({ activeTab = 'dossier', onInspectBrief }) {
  // Dynamic card content reflecting the active dock tile
  const cardData = {
    dossier: {
      title: 'Brief: Full-Stack Engineer',
      tag: 'CANDIDATE AUDIT',
      row1Label: 'Target Role:',
      row1Val: 'Senior Full-Stack Engineer',
      row2Label: 'Verified Stack:',
      row2Val: 'React 18 • TypeScript • Node',
      row3Label: 'Code Evidence:',
      row3Val: '4 Repos • 127 Commits',
      row4Label: 'Readiness:',
      row4Val: '78/100 (Top 15%)',
      action: 'Next: Containerize API (Docker)'
    },
    telemetry: {
      title: 'Evidence: Real Code Proof',
      tag: 'VERIFIED GITHUB',
      row1Label: 'Repositories:',
      row1Val: '4 Production Repos',
      row2Label: 'Commits Analyzed:',
      row2Val: '127 Commits (6 Months)',
      row3Label: 'TypeScript Depth:',
      row3Val: '98% Strict (Zero "any")',
      row4Label: 'Automated Tests:',
      row4Val: '42 Tests Passing ✓',
      action: 'Status: 100% Real code footprint ✓'
    },
    readiness: {
      title: 'Index: Readiness Score',
      tag: 'OBJECTIVE SCORE',
      row1Label: 'Total Score:',
      row1Val: '78 / 100 (Strong Baseline)',
      row2Label: 'Code Quality:',
      row2Val: '82% (Clean hooks & types)',
      row3Label: 'Project Depth:',
      row3Val: '76% (4 Full-stack Apps)',
      row4Label: 'Role Match:',
      row4Val: 'Frontend 91% • FullStack 79%',
      action: 'Quick Win: +11 pts with 2 projects'
    },
    rolefit: {
      title: 'Roles: Job Match Matrix',
      tag: 'MARKET FIT',
      row1Label: 'Frontend Lead:',
      row1Val: '91% Match (Interview Ready)',
      row2Label: 'Full Stack Dev:',
      row2Val: '79% Match (Strong)',
      row3Label: 'Backend Dev:',
      row3Val: '74% Match (Solid APIs)',
      row4Label: 'Top Focus Area:',
      row4Val: 'Containerized Deployment',
      action: 'Target: Reach 89% in 3 weeks'
    },
    roadmap: {
      title: 'Plan: 4-Week Roadmap',
      tag: 'STEP-BY-STEP',
      row1Label: 'Week 1:',
      row1Val: 'Docker & Compose (+4 pts)',
      row2Label: 'Week 2:',
      row2Val: 'Deploy to Cloud (+3 pts)',
      row3Label: 'Week 3:',
      row3Val: 'GitHub Actions CI/CD (+4 pts)',
      row4Label: 'Projected Score:',
      row4Val: '89 / 100 (Interview Ready)',
      action: 'Outcome: Senior interview ready ✓'
    }
  };

  const current = cardData[activeTab] || cardData.dossier;

  return (
    <div className="desk-scene-wrapper">
      <svg
        viewBox="0 0 960 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="desk-scene-svg"
      >
        <defs>
          {/* Soft natural drop shadow for brief document card */}
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#18251B" floodOpacity="0.09" />
          </filter>
        </defs>

        {/* ==================================================
            1. BUTTER-YELLOW SUN HALO ARCH IN BACKGROUND
            ================================================== */}
        <path
          d="M 90 415 A 390 390 0 0 1 870 415 Z"
          fill="#F6E79D"
          opacity="0.9"
        />

        {/* ==================================================
            2. THE BRIEF DOCUMENT CARD (TALL & FULLY UNOBSTRUCTED)
            All text placed in the upper portion so it is 100% visible
            ================================================== */}
        <g 
          filter="url(#cardShadow)" 
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={onInspectBrief}
        >
          {/* Crisp white paper card */}
          <rect
            x="285"
            y="22"
            width="390"
            height="315"
            rx="12"
            fill="#FFFFFF"
            stroke="#18251B"
            strokeWidth="2.5"
          />

          {/* Butter-yellow pill badge in top right */}
          <rect x="545" y="34" width="116" height="22" rx="11" fill="#F6E79D" />
          <text 
            x="603" 
            y="49" 
            fontFamily="'Plus Jakarta Sans', sans-serif" 
            fontSize="9" 
            fontWeight="700" 
            fill="#18251B" 
            textAnchor="middle"
          >
            {current.tag}
          </text>

          {/* Header Title */}
          <text 
            x="305" 
            y="50" 
            fontFamily="'Plus Jakarta Sans', sans-serif" 
            fontSize="13" 
            fontWeight="700" 
            fill="#18251B"
          >
            {current.title}
          </text>
          <line x1="305" y1="64" x2="655" y2="64" stroke="#E5E1D5" strokeWidth="1.5" />

          {/* Row 1: Target Role */}
          <text x="305" y="90" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="600" fill="#576356">
            {current.row1Label}
          </text>
          <text x="425" y="90" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="600" fill="#18251B">
            {current.row1Val}
          </text>

          {/* Row 2: Stack */}
          <text x="305" y="118" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="600" fill="#576356">
            {current.row2Label}
          </text>
          <text x="425" y="118" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="600" fill="#18251B">
            {current.row2Val}
          </text>

          {/* Row 3: Evidence */}
          <text x="305" y="146" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="600" fill="#576356">
            {current.row3Label}
          </text>
          <text x="425" y="146" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="600" fill="#18251B">
            {current.row3Val}
          </text>

          {/* Row 4: Readiness */}
          <text x="305" y="174" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="600" fill="#576356">
            {current.row4Label}
          </text>
          <text x="425" y="174" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10.5" fontWeight="700" fill="#203822">
            {current.row4Val}
          </text>

          {/* Divider */}
          <line x1="305" y1="190" x2="655" y2="190" stroke="#E5E1D5" strokeWidth="1.5" />

          {/* Row 5: Action note */}
          <text x="305" y="210" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="10" fill="#C96547" fontWeight="600">
            {current.action}
          </text>
          
          {/* Subtle click prompt */}
          <text x="305" y="226" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fill="#838F82">
            Click card to open full analysis →
          </text>
        </g>

        {/* ==================================================
            3. TABLE / DESK SURFACE
            ================================================== */}
        <rect x="0" y="415" width="960" height="65" fill="#D98A6C" />
        <line x1="0" y1="415" x2="960" y2="415" stroke="#18251B" strokeWidth="3" />

        {/* ==================================================
            4. LEFT SIDE LINE-ART COLLEAGUES (EDITORIAL CRAFT)
            ================================================== */}

        {/* Colleague 1: Far Left - Engineer sipping coffee */}
        <g stroke="#18251B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Torso & Shirt */}
          <path d="M 15 415 c 0 -45 20 -65 50 -65 c 25 0 45 15 50 65" fill="#FAF8F3" />
          <path d="M 60 350 l 8 20 l 8 -20" fill="none" />
          {/* Neck & Head */}
          <path d="M 65 350 v -15" fill="none" />
          <path d="M 55 335 c 0 -22 18 -30 32 -18 c 12 10 12 28 2 34 c -10 6 -34 4 -34 -16 Z" fill="#FCEBD6" />
          {/* Face Profile */}
          <path d="M 86 322 q 4 5 1 10 q 5 2 1 6 q -6 4 -12 2" fill="none" />
          {/* Smiling Eye */}
          <path d="M 76 324 q 4 -3 8 0" fill="none" />
          {/* Wavy Hair */}
          <path 
            d="M 52 328 c -8 -20 10 -38 32 -32 c 12 -12 30 -6 32 10 c -8 -4 -16 2 -18 8 c -6 -2 -14 2 -16 8 c -10 -4 -22 -2 -30 6 Z" 
            fill="#18251B" 
          />
          {/* Hand holding mug */}
          <path d="M 100 395 q 10 -8 18 2" fill="none" />
          <rect x="115" y="385" width="20" height="22" rx="3" fill="#FFFFFF" />
          <path d="M 135 390 h 5 a 4 4 0 0 1 0 8 h -5" fill="none" />
          {/* Steam lines */}
          <path d="M 122 378 q 2 -5 0 -8" fill="none" strokeWidth="1.5" />
          <path d="M 128 376 q 2 -5 0 -8" fill="none" strokeWidth="1.5" />
        </g>

        {/* Colleague 2: Mid-Left - Woman with chic bob hair raising hand */}
        <g stroke="#18251B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Torso */}
          <path d="M 145 415 c 5 -50 25 -65 52 -65 c 26 0 46 15 52 65" fill="#FAF8F3" />
          {/* Necklace accent */}
          <path d="M 185 365 q 12 10 24 0" fill="none" />
          {/* Head & Face */}
          <path d="M 182 348 c 0 -25 22 -32 36 -18 c 12 12 10 32 -2 36 c -14 5 -34 -2 -34 -18 Z" fill="#FCEBD6" />
          {/* Eye with eyelashes */}
          <path d="M 205 330 q 4 -3 7 0" fill="none" />
          <line x1="211" y1="329" x2="214" y2="326" />
          {/* Nose & Smile */}
          <path d="M 213 336 q 3 3 0 6 q -5 3 -9 0" fill="none" />
          {/* Textured Bob Hair */}
          <path 
            d="M 176 345 c -6 -24 16 -40 38 -36 c 16 -4 28 8 28 26 c -4 14 -12 24 -18 28 c -2 -8 -8 -14 -16 -12 c -8 2 -12 12 -12 16 c -8 -2 -16 -8 -20 -22 Z" 
            fill="#18251B" 
          />
          {/* Raised hand with defined fingers */}
          <path d="M 235 385 c 10 -18 16 -35 22 -48 c 3 -6 8 -4 6 2 c -2 8 -6 18 -6 18" fill="none" />
          <path d="M 256 340 c 3 -5 6 -3 4 3 c -2 6 -6 14 -6 14" fill="none" />
        </g>

        {/* Colleague 3: Inner Left - Attentive engineer taking notes */}
        <g stroke="#18251B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Torso with neat tie */}
          <path d="M 268 415 c 5 -45 22 -60 46 -60 c 24 0 40 15 45 60" fill="#FAF8F3" />
          <path d="M 308 358 l 6 42 l 6 -42" fill="#D98A6C" stroke="#18251B" strokeWidth="1.8" />
          {/* Head looking slightly down at notepad */}
          <path d="M 300 345 c 0 -22 18 -30 32 -22 c 12 8 14 26 2 34 c -10 8 -34 6 -34 -12 Z" fill="#FCEBD6" />
          {/* Glasses */}
          <rect x="316" y="326" width="12" height="10" rx="3" fill="none" strokeWidth="1.8" />
          <line x1="312" y1="330" x2="316" y2="330" strokeWidth="1.8" />
          {/* Smiling mouth */}
          <path d="M 322 346 q 5 3 10 0" fill="none" />
          {/* Clean Side-Part Hair */}
          <path 
            d="M 296 338 c -4 -20 14 -32 34 -30 c 12 0 20 8 20 18 c -10 -4 -22 -2 -28 4 c -6 6 -8 16 -8 20 c -8 -2 -14 -6 -18 -12 Z" 
            fill="#18251B" 
          />
          {/* Notepad and pen on desk */}
          <rect x="330" y="392" width="28" height="22" rx="3" fill="#FFFFFF" />
          <line x1="335" y1="398" x2="350" y2="398" strokeWidth="1.5" stroke="#C5A15A" />
          <line x1="335" y1="404" x2="348" y2="404" strokeWidth="1.5" stroke="#C5A15A" />
          <line x1="356" y1="384" x2="348" y2="402" strokeWidth="2" stroke="#18251B" />
        </g>

        {/* ==================================================
            5. CENTER CANDIDATE HERO (FULL COLOR, REFINED PROPORTIONS)
            Positioned cleanly below card so ALL text above is visible
            ================================================== */}
        <g>
          {/* Candidate Torso in deep forest green */}
          <path
            d="M 432 415 c 0 -50 22 -70 48 -70 s 48 20 48 70 Z"
            fill="#203822"
            stroke="#18251B"
            strokeWidth="2.5"
          />

          {/* Clean neck */}
          <path d="M 470 348 v -20 h 16 v 20 Z" fill="#FCEBD6" stroke="#18251B" strokeWidth="2" />

          {/* Candidate Face & Profile (Facing right toward laptop) */}
          <path
            d="M 466 310 
               c 0 -22 18 -32 30 -22 
               c 8 6 14 16 14 26 
               c -2 12 -12 18 -22 18 
               c -12 0 -22 -8 -22 -22 Z"
            fill="#FCEBD6"
            stroke="#18251B"
            strokeWidth="2"
          />

          {/* Delicate Side Profile: Forehead, Nose, Lips */}
          <path
            d="M 498 296 
               q 4 4 6 8 
               q -2 4 -5 5 
               q 4 3 0 6 
               q -4 3 -8 1"
            fill="none"
            stroke="#18251B"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Joyful closed eyelid with delicate eyelashes */}
          <path d="M 488 296 q 4 -3 7 0" fill="none" stroke="#18251B" strokeWidth="2" strokeLinecap="round" />
          <line x1="494" y1="295" x2="497" y2="292" stroke="#18251B" strokeWidth="1.6" strokeLinecap="round" />

          {/* Gentle smiling cheek warmth */}
          <circle cx="490" cy="305" r="4.5" fill="#F0A892" opacity="0.45" />

          {/* Wireless white earbud in ear */}
          <ellipse cx="474" cy="305" rx="3.5" ry="5" fill="#FCEBD6" stroke="#18251B" strokeWidth="1.8" />
          <circle cx="474" cy="305" r="2.5" fill="#FFFFFF" stroke="#18251B" strokeWidth="1.2" />

          {/* LUSH WAVY TERRACOTTA CURLS (Sculpted naturally around face, NOT an awkward blob) */}
          <path
            d="M 454 290 
               c -10 -16 6 -38 28 -34 
               c 16 -12 36 -6 40 10 
               c -4 2 -8 6 -6 12 
               c -6 -2 -14 0 -16 6 
               c -6 -2 -12 2 -14 8 
               c -10 -6 -22 -2 -32 8 Z"
            fill="#C96547"
            stroke="#18251B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Back flowing hair locks resting along shoulder */}
          <path
            d="M 454 295 
               c -8 12 -12 26 -8 40 
               c 4 14 16 18 16 26 
               c 0 8 -8 14 -4 20 
               c 4 4 12 2 14 -6 
               c 2 -12 -6 -20 -4 -32 
               c 2 -14 8 -22 4 -36 
               c -4 -6 -12 -8 -18 -12 Z"
            fill="#C96547"
            stroke="#18251B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Butter-Yellow Ceramic Mug with terracotta heart on desk */}
          <g transform="translate(446, 386)">
            {/* Saucer */}
            <ellipse cx="14" cy="27" rx="18" ry="3.5" fill="#E8DEC4" stroke="#18251B" strokeWidth="1.8" />
            {/* Cup */}
            <rect x="2" y="6" width="24" height="20" rx="4" fill="#F6E79D" stroke="#18251B" strokeWidth="2" />
            {/* Handle */}
            <path d="M 26 10 h 5 a 4 4 0 0 1 0 8 h -5" stroke="#18251B" strokeWidth="2" fill="none" />
            {/* Tiny heart icon */}
            <path d="M 14 14 a 2.5 2.5 0 0 0 -4 2.5 c 0 3 4 5.5 4 5.5 s 4 -2.5 4 -5.5 a 2.5 2.5 0 0 0 -4 -2.5" fill="#C96547" />
          </g>

          {/* Modern Pastel Lilac Laptop (Tilted open on desk) */}
          <g transform="translate(525, 332)">
            {/* Screen */}
            <polygon
              points="8,82 126,82 116,8 14,8"
              fill="#D8BFE8"
              stroke="#18251B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Keyboard base */}
            <polygon
              points="0,82 134,82 126,86 8,86"
              fill="#EADCF2"
              stroke="#18251B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Glowing code lines on screen back */}
            <line x1="35" y1="36" x2="75" y2="36" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="46" x2="98" y2="46" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="56" x2="65" y2="56" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        {/* ==================================================
            6. RIGHT SIDE LINE-ART COLLEAGUES (EDITORIAL CRAFT)
            ================================================== */}

        {/* Colleague 4: Inner Right - Engineer with high ponytail smiling warmly */}
        <g stroke="#18251B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Torso */}
          <path d="M 640 415 c 5 -45 22 -60 46 -60 c 25 0 42 15 48 60" fill="#FAF8F3" />
          {/* Head & Smiling Face looking left toward candidate */}
          <path d="M 660 348 c 0 -22 18 -30 32 -20 c 10 8 12 26 2 34 c -12 8 -34 4 -34 -14 Z" fill="#FCEBD6" />
          {/* Smiling eye */}
          <path d="M 672 328 q 4 -3 8 0" fill="none" />
          {/* Nose & Smile */}
          <path d="M 668 334 q -3 4 2 6 q 4 1 8 -2" fill="none" />
          {/* Chic High Ponytail Hair */}
          <path 
            d="M 666 332 c -4 -18 10 -28 28 -28 c 14 -2 22 8 20 18 c -6 -2 -14 0 -18 6 c -4 4 -6 14 -8 16 c -8 -2 -16 -4 -22 -12 Z" 
            fill="#18251B" 
          />
          {/* Ponytail arching up and back */}
          <path d="M 705 312 q 8 -4 14 -12 q 4 12 -2 22 q -8 8 -16 6" fill="#18251B" />
          <ellipse cx="704" cy="312" rx="3" ry="4" fill="#C96547" stroke="#18251B" strokeWidth="1.5" />
        </g>

        {/* Colleague 5: Mid-Right - Bearded engineer smiling */}
        <g stroke="#18251B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Torso */}
          <path d="M 745 415 c 5 -48 24 -62 48 -62 c 25 0 45 14 50 62" fill="#FAF8F3" />
          {/* Head */}
          <path d="M 770 346 c 0 -24 20 -30 34 -20 c 12 10 12 28 0 36 c -12 8 -34 6 -34 -16 Z" fill="#FCEBD6" />
          {/* Glasses */}
          <rect x="778" y="326" width="12" height="10" rx="3" fill="none" strokeWidth="1.8" />
          <line x1="790" y1="330" x2="795" y2="330" strokeWidth="1.8" />
          {/* Neat groomed beard & smile */}
          <path d="M 774 340 c 2 18 20 18 28 2 c -8 6 -20 6 -28 -2 Z" fill="#18251B" />
          {/* Hair */}
          <path 
            d="M 768 335 c -4 -20 12 -32 32 -30 c 14 0 22 10 20 20 c -8 -4 -18 -2 -24 4 c -6 4 -8 14 -8 18 c -8 -2 -16 -4 -20 -12 Z" 
            fill="#18251B" 
          />
        </g>

        {/* Colleague 6: Far Right - Engineer in knit beanie cap */}
        <g stroke="#18251B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Torso & Hoodie */}
          <path d="M 852 415 c 4 -48 22 -62 48 -62 c 24 0 42 14 48 62" fill="#FAF8F3" />
          {/* Hoodie pocket */}
          <path d="M 875 390 h 30 v 25 h -30 Z" fill="#F3EFE6" strokeWidth="1.8" />
          {/* Head & Smiling Face */}
          <path d="M 876 348 c 0 -20 18 -28 30 -18 c 12 8 12 26 0 32 c -12 8 -30 6 -30 -14 Z" fill="#FCEBD6" />
          {/* Eye & Smile */}
          <path d="M 888 332 q 4 -3 7 0" fill="none" />
          <path d="M 886 340 q -3 3 2 5 q 4 1 6 -2" fill="none" />
          {/* Trendy Knit Beanie Cap */}
          <path d="M 870 334 c -4 -24 16 -36 36 -32 c 12 2 20 14 18 24 c -6 -2 -14 -2 -24 0 c -10 2 -20 4 -30 8 Z" fill="#768D74" />
          <path d="M 868 335 q 26 -6 52 0" fill="none" strokeWidth="2.4" />
          {/* Device on desk */}
          <rect x="912" y="388" width="16" height="26" rx="3" fill="#FFFFFF" />
          <line x1="916" y1="394" x2="924" y2="394" strokeWidth="1.5" stroke="#768D74" />
        </g>
      </svg>
    </div>
  );
}
