import React from 'react';
import ScoreCard from '../components/ScoreCard';

export default function PlacementDashboard() {
  return (
    <div className="page placement-dashboard-page">
      <h2>Placement Officer & Admin Dashboard</h2>
      <p>Cohort-wide employability metrics, readiness distribution, and batch trends.</p>
      <div className="stats-grid">
        <ScoreCard title="Cohort Average Score" score="72%" />
        <ScoreCard title="Profiles Evaluated" score="120" />
        <ScoreCard title="Placement Ready" score="64%" />
      </div>
    </div>
  );
}
