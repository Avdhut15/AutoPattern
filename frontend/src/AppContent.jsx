import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import UploadPage from './pages/UploadPage';
import DatasetOverview from './pages/DatasetOverview';
import PatternDashboard from './pages/PatternDashboard';
import AnomalyDashboard from './pages/AnomalyDashboard';
import InsightsPage from './pages/InsightsPage';

const AppContent = () => {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/overview" element={<DatasetOverview />} />
          <Route path="/patterns" element={<PatternDashboard />} />
          <Route path="/anomalies" element={<AnomalyDashboard />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default AppContent;
