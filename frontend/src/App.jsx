import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Analysis from './pages/Analysis';
import Results from './pages/Results';
import PlacementDashboard from './pages/PlacementDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');

  const renderPage = () => {
    switch (activeTab) {
      case 'landing':
        return <Landing />;
      case 'login':
        return <Login />;
      case 'profile':
        return <ProfileSetup />;
      case 'analysis':
        return <Analysis />;
      case 'results':
        return <Results />;
      case 'placement':
        return <PlacementDashboard />;
      default:
        return <Landing />;
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <nav className="nav-tabs" aria-label="Page navigation">
          <button className={activeTab === 'landing' ? 'active' : ''} onClick={() => setActiveTab('landing')}>Landing</button>
          <button className={activeTab === 'login' ? 'active' : ''} onClick={() => setActiveTab('login')}>Login</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile Setup</button>
          <button className={activeTab === 'analysis' ? 'active' : ''} onClick={() => setActiveTab('analysis')}>Analysis</button>
          <button className={activeTab === 'results' ? 'active' : ''} onClick={() => setActiveTab('results')}>Results</button>
          <button className={activeTab === 'placement' ? 'active' : ''} onClick={() => setActiveTab('placement')}>Placement Dashboard</button>
        </nav>
        {renderPage()}
      </div>
    </div>
  );
}
