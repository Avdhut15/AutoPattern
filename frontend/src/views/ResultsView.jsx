import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Sidebar from '../components/Sidebar';

// Subcomponents
import SummaryPanel from '../panels/SummaryPanel';
import InsightsPanel from '../panels/InsightsPanel';
import PatternsPanel from '../panels/PatternsPanel';
import AnomaliesPanel from '../panels/AnomaliesPanel';

const ResultsView = () => {
  const { summaryData, originalFileName, visualizationData, insightsData } = useStore();
  const [activeTab, setActiveTab] = useState('summary');

  // Fallback data if API hasn't returned yet
  const num_rows = summaryData?.summary_stats?.[0]?.count || 0;
  const num_cols = summaryData?.dataset_shape?.[1] || 0;
  const memory_usage = summaryData?.memory_usage || 'Unknown';
  const duplicate_rows = 'N/A';

  const getExt = (name) => {
    if (!name) return 'CSV';
    const parts = name.split('.');
    return parts[parts.length - 1].toUpperCase();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryPanel />;
      case 'insights':
        return <InsightsPanel />;
      case 'patterns':
        return <PatternsPanel />;
      case 'anomalies':
        return <AnomaliesPanel />;
      default:
        return <SummaryPanel />;
    }
  };

  const styles = {
    layout: {
      display: 'flex',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-global)',
    },
    mainArea: {
      flex: 1,
      marginLeft: '280px', /* Sidebar width */
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    },
    topBar: {
      height: '70px',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      backgroundColor: 'var(--bg-card)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    },
    pageTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
    },
    contentArea: {
      flex: 1,
      padding: '2rem',
      overflowY: 'auto',
    }
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case 'summary': return 'Dataset Overview';
      case 'insights': return 'AI Generated Insights';
      case 'patterns': return 'Patterns & Clustering Analysis';
      case 'anomalies': return 'Anomaly Detection Results';
      default: return 'Dashboard';
    }
  };

  return (
    <div style={styles.layout} className="animate-fade-in-up">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div style={styles.mainArea}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>{getPageTitle()}</h2>
        </div>
        
        <div style={styles.contentArea}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
