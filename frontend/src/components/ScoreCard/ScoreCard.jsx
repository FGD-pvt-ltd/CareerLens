import React from 'react';

export default function ScoreCard({ title = 'Readiness Score', score = '--' }) {
  return (
    <div className="component-container score-card-component">
      <h4>{title}</h4>
      <div className="score-value">{score}</div>
    </div>
  );
}
