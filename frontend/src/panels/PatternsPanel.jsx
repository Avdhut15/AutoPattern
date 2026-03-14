import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Network, GitMerge } from 'lucide-react';

const PatternsPanel = () => {
  const { visualizationData } = useSelector(state => state.dataset);
  
  // visualizationData has patterns, anomalies, dl_anomalies
  if (!visualizationData || !visualizationData.patterns) {
    return <div className="p-4" style={{ color: 'var(--text-secondary)' }}>No pattern data available yet.</div>;
  }

  const { correlation, pca, clustering } = visualizationData.patterns;

  // 1. Prepare Scatter Plot Data (PCA 2D Projection with KMeans labels)
  const scatterData = useMemo(() => {
    if (!pca?.projections || pca.projections.length === 0) return [];
    
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      cluster: clustering?.kmeans_labels ? clustering.kmeans_labels[idx] : 0
    }));
  }, [pca, clustering]);

  // Brand colors for different clusters (soft UI approved)
  const clusterColors = [
    'var(--brand-primary)', // Blue
    '#0d9488',              // Teal
    '#9333ea',              // Purple
    '#f59e0b',              // Orange
    '#ef4444',              // Red
  ];

  // 2. Prepare Correlation Data
  // We will build a simple CSS Grid heatmap
  const features = correlation?.features || [];
  const matrix = correlation?.matrix || [];

  const getHeatmapColor = (value) => {
    // Value is between -1 and 1
    if (value === 1) return 'rgba(59, 130, 246, 1)'; // Brand primary
    if (value > 0.7) return 'rgba(59, 130, 246, 0.7)';
    if (value > 0.3) return 'rgba(59, 130, 246, 0.4)';
    if (value > 0) return 'rgba(59, 130, 246, 0.1)';
    if (value < -0.7) return 'rgba(239, 68, 68, 0.7)'; // Red for strong negative
    if (value < -0.3) return 'rgba(239, 68, 68, 0.4)';
    if (value < 0) return 'rgba(239, 68, 68, 0.1)';
    return 'transparent'; // 0
  };

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
      gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
      gap: '1.5rem',
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
      display: 'flex',
      flexDirection: 'column',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
      fontSize: '1.1rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
    },
    chartContainer: {
      height: '350px',
      width: '100%',
      marginTop: '1rem'
    },
    // Heatmap styles
    heatmapContainer: {
      overflowX: 'auto',
      marginTop: '1rem',
      padding: '0.5rem'
    },
    heatmapRow: {
      display: 'flex',
      alignItems: 'center',
    },
    heatmapCell: (val) => ({
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getHeatmapColor(val),
      border: '1px solid white',
      fontSize: '0.65rem',
      color: Math.abs(val) > 0.5 ? 'white' : 'var(--text-secondary)',
      fontWeight: '500',
      borderRadius: '4px',
      cursor: 'default',
    }),
    heatmapLabelY: {
      width: '120px',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textAlign: 'right',
      paddingRight: '1rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    heatmapLabelX: {
      width: '40px',
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      textAlign: 'center',
      transform: 'rotate(-45deg)',
      transformOrigin: 'left bottom',
      marginBottom: '10px'
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)', fontSize: '0.85rem' }}>
          <p><strong>Cluster:</strong> {payload[0].payload.cluster}</p>
          <p><strong>PCA X:</strong> {payload[0].value}</p>
          <p><strong>PCA Y:</strong> {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        
        {/* Cluster Plot */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Network size={20} color="#9333ea" /> Data Clusters (PCA Projection)
          </div>
          <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
            Visualizing mathematical similarities. Points of the same color belong to the same cluster detected by KMeans algorithms.
          </p>
          
          <div style={styles.chartContainer}>
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis type="number" dataKey="x" name="PCA 1" stroke="var(--text-muted)" tick={{fontSize: 12}} />
                  <YAxis type="number" dataKey="y" name="PCA 2" stroke="var(--text-muted)" tick={{fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Clusters" data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={clusterColors[entry.cluster % clusterColors.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
                Not enough numerical data to plot clusters.
              </div>
            )}
          </div>
        </div>

        {/* Correlation Heatmap */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <GitMerge size={20} color="var(--brand-primary)" /> Feature Correlation Matrix
          </div>
          <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
            Understanding relationships. Dark blue indicates strong positive correlation, red indicates negative correlation.
          </p>
          
          <div style={styles.heatmapContainer}>
            {features.length > 0 ? (
              <>
                {/* X-Axis Labels */}
                <div style={{...styles.heatmapRow, marginLeft: '120px' }}>
                  {features.map((feat, i) => (
                    <div key={`hx-${i}`} style={styles.heatmapLabelX} title={feat}>
                      {feat.substring(0, 6)}{(feat.length > 6 ? '.' : '')}
                    </div>
                  ))}
                </div>
                
                {/* Matrix Rows */}
                {features.map((featY, i) => (
                  <div key={`row-${i}`} style={styles.heatmapRow}>
                    <div style={styles.heatmapLabelY} title={featY}>{featY}</div>
                    {matrix[i].map((val, j) => (
                      <div 
                        key={`cell-${i}-${j}`} 
                        style={styles.heatmapCell(val)}
                        title={`${featY} & ${features[j]}: ${val.toFixed(2)}`}
                      >
                        {val === 1 ? '1.0' : Math.abs(val) > 0.1 ? val.toFixed(1) : ''}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
                Not enough numerical features to calculate correlation.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatternsPanel;
