import React from 'react';
import { useSelector } from 'react-redux';
import { Database, TrendingUp, AlertTriangle, Layers, Type, Percent } from 'lucide-react';

const SummaryPanel = () => {
  const { summaryData } = useSelector(state => state.dataset);
  
  if (!summaryData) return <div className="p-4">No data available</div>;

  const { 
    num_rows = 0, 
    num_cols = 0, 
    numerical_columns = [], 
    categorical_columns = [], 
    missing_values = {},
    summary_stats = {}
  } = summaryData;

  // Derive insights
  const totalCells = num_rows * num_cols;
  const missingCount = Object.values(missing_values).reduce((a, b) => a + b, 0);
  const missingPercentage = totalCells > 0 ? ((missingCount / totalCells) * 100).toFixed(2) : 0;
  
  const numericCount = numerical_columns.length;
  const categoricalCount = categorical_columns.length;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      padding: '1rem 0',
      animation: 'fadeInUp 0.4s ease forwards'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem',
    },
    statCard: {
      backgroundColor: 'white',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
    },
    iconWrapper: (color, bg) => ({
      backgroundColor: bg,
      color: color,
      padding: '0.75rem',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    statInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    statLabel: {
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      fontWeight: 500,
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: 'var(--text-primary)',
    },
    statSubtext: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
      marginTop: '0.25rem',
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: 'var(--text-primary)',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    pillContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
    },
    pill: (isNum) => ({
      padding: '0.25rem 0.75rem',
      backgroundColor: isNum ? 'var(--tint-blue)' : 'var(--tint-purple)',
      color: isNum ? 'var(--brand-primary)' : '#9333ea',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.8rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
    })
  };

  return (
    <div style={styles.container}>
      {/* Top Value Cards */}
      <div style={styles.grid}>
        <div style={styles.statCard}>
          <div style={styles.iconWrapper('var(--brand-primary)', 'var(--tint-blue)')}>
            <Database size={24} />
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Total Data Points</span>
            <span style={styles.statValue}>{(num_rows * num_cols).toLocaleString()}</span>
            <span style={styles.statSubtext}>Across {num_cols} columns</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.iconWrapper(missingCount > 0 ? 'var(--warning)' : 'var(--success)', missingCount > 0 ? 'var(--tint-orange)' : 'var(--tint-green)')}>
            {missingCount > 0 ? <AlertTriangle size={24} /> : <Percent size={24} />}
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Data Completeness</span>
            <span style={styles.statValue}>{100 - missingPercentage}%</span>
            <span style={styles.statSubtext}>
              {missingCount > 0 ? `${missingCount.toLocaleString()} missing values detected` : 'Perfectly clean dataset'}
            </span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.iconWrapper('#9333ea', 'var(--tint-purple)')}>
            <Layers size={24} />
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Feature Types</span>
            <span style={styles.statValue}>{numericCount} Numeric</span>
            <span style={styles.statSubtext}>and {categoricalCount} Categorical</span>
          </div>
        </div>
      </div>

      {/* Column Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Numerical Columns */}
        {numerical_columns.length > 0 && (
          <div>
            <h4 style={styles.sectionTitle}>
              <TrendingUp size={20} color="var(--brand-primary)" /> Numerical Features
            </h4>
            <div style={styles.pillContainer}>
              {numerical_columns.map(col => (
                <span key={col} style={styles.pill(true)}>
                  <Type size={12} /> {col}
                </span>
              ))}
            </div>
            {/* We could add summary mini-charts here later using Recharts */}
          </div>
        )}

        {/* Categorical Columns */}
        {categorical_columns.length > 0 && (
          <div>
            <h4 style={styles.sectionTitle}>
              <Database size={20} color="#9333ea" /> Categorical Features
            </h4>
            <div style={styles.pillContainer}>
              {categorical_columns.map(col => {
                 const stats = summary_stats[col] || {};
                 const uniqueCount = stats.unique_values || 0;
                 return (
                  <span key={col} style={styles.pill(false)}>
                    <Layers size={12} /> {col} <span style={{opacity: 0.7, fontSize: '0.75rem'}}>({uniqueCount} unique)</span>
                  </span>
                 );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SummaryPanel;
