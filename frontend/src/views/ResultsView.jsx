import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { resetState } from '../store/datasetSlice';
import { UploadCloud, FileType, Hash, Columns, AlertTriangle, AlertCircle, RefreshCw, FileText } from 'lucide-react';

// Subcomponents placeholder
import SummaryPanel from '../panels/SummaryPanel';
import InsightsPanel from '../panels/InsightsPanel';
import PatternsPanel from '../panels/PatternsPanel';
import AnomaliesPanel from '../panels/AnomaliesPanel';

const ResultsView = () => {
  const dispatch = useDispatch();
  const { summaryData, originalFileName, visualizationData, insightsData } = useSelector(state => state.dataset);
  const [activeTab, setActiveTab] = useState('summary');

  // Fallback data if API hasn't returned yet
  const summary = summaryData || {};
  const { num_rows = 0, num_cols = 0, missing_values = {} } = summary;

  // Calculate overall missing value percentage
  const totalCells = num_rows * num_cols;
  const totalMissing = Object.values(missing_values).reduce((sum, val) => sum + val, 0);
  const overall_missing_percentage = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;
  
  // Backend currently doesn't provide duplicate_rows count explicitly
  const duplicate_rows = 'N/A';

  const handleReset = () => {
    dispatch(resetState());
  };

  const getExt = (name) => {
    if(!name) return 'CSV';
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'DATA';
  };

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'insights', label: 'Insights' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'anomalies', label: 'Anomalies' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary': return <SummaryPanel />;
      case 'insights': return <InsightsPanel />;
      case 'patterns': return <PatternsPanel />;
      case 'anomalies': return <AnomaliesPanel />;
      default: return null;
    }
  };

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      paddingBottom: '3rem',
    },
    actionRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '1rem'
    },
    uploadBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: 'white',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-active)',
      padding: '0.5rem 1rem',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      boxShadow: 'var(--shadow-soft)',
      transition: 'all 0.2s ease',
    },
    overviewCard: {
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-soft)',
    },
    overviewTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
    },
    infoItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    infoLabel: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
    },
    infoValue: {
      fontSize: '1rem',
      fontWeight: '500',
      color: 'var(--text-primary)',
      paddingLeft: '1.65rem', // Aligned with label text
    },
    tabsContainer: {
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-soft)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '400px',
    },
    tabGroup: {
      display: 'flex',
      gap: '0.5rem',
      backgroundColor: 'var(--bg-global)',
      padding: '0.25rem',
      borderRadius: 'var(--radius-full)',
      width: 'fit-content',
      marginBottom: '1rem',
    },
    tabBtn: (isActive) => ({
      padding: '0.5rem 1.25rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.875rem',
      fontWeight: isActive ? '600' : '500',
      color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'white' : 'transparent',
      boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
    })
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      {/* Action Row */}
      <div style={styles.actionRow}>
        <button style={styles.uploadBtn} onClick={handleReset}>
          <UploadCloud size={16} /> Clear & Upload New File
        </button>
      </div>

      {/* File Overview Card */}
      <div style={styles.overviewCard}>
        <h3 style={styles.overviewTitle}>
          <FileText size={20} color="var(--brand-primary)" />
          File Information
        </h3>
        
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>
               <FileType size={16} color="var(--brand-primary)" /> Name
            </div>
            <div style={styles.infoValue}>{originalFileName || 'dataset.csv'}</div>
          </div>
          
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>
               <Hash size={16} color="var(--success)" /> Rows / Records
            </div>
            <div style={styles.infoValue}>{num_rows.toLocaleString()}</div>
          </div>
          
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>
               <Columns size={16} color="#9333ea" /> Columns / Features
            </div>
            <div style={styles.infoValue}>{num_cols}</div>
          </div>
          
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>
               <AlertCircle size={16} color="var(--warning)" /> Duplicate Rows
            </div>
            <div style={styles.infoValue}>{duplicate_rows}</div>
          </div>
          
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>
               <AlertTriangle size={16} color="var(--error)" /> Missing Values
            </div>
            <div style={styles.infoValue}>{overall_missing_percentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Analysis Container */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabGroup}>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={styles.tabBtn(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Render Tab Panel */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ResultsView;
