import React, { useState, useEffect } from 'react';

/**
 * Signature Typography Animation
 * Smooth word transitions: STAND → PROVE → IMPROVE → GROW → NEXT
 * Opacity + subtle vertical movement + slight blur
 * Transition: 850ms, Pause: 2200ms, Cinematic easing.
 */
const WORDS = ['STAND', 'PROVE', 'IMPROVE', 'GROW', 'NEXT'];

export default function HeroWordMorph() {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState('enter'); // 'enter' | 'exit'

  useEffect(() => {
    // Word stays visible for pause duration (2200ms)
    const pauseTimer = setTimeout(() => {
      setStage('exit');

      // After transition duration (850ms), switch word and enter
      const transitionTimer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length);
        setStage('enter');
      }, 850);

      return () => clearTimeout(transitionTimer);
    }, 2200);

    return () => clearTimeout(pauseTimer);
  }, [index]);

  return (
    <span className="hero-transition-word" aria-live="polite">
      <span className={`word-morph-item ${stage}`}>
        {WORDS[index]}.
      </span>
    </span>
  );
}
