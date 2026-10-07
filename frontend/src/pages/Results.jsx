import React from 'react';
import ScoreCard from '../components/ScoreCard';
import SkillAnalysis from '../components/SkillAnalysis';
import EvidenceCard from '../components/EvidenceCard';
import GapAnalysis from '../components/GapAnalysis';
import Roadmap from '../components/Roadmap';

export default function Results() {
  return (
    <div className="page results-page">
      <h2>Readiness & Skill Verification Results</h2>
      <ScoreCard title="Employability Readiness Score" score="78/100" />
      <SkillAnalysis />
      <EvidenceCard />
      <GapAnalysis />
      <Roadmap />
    </div>
  );
}
