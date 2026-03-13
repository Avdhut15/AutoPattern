import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ShieldAlert, AlertTriangle, AlertOctagon, Activity } from 'lucide-react';

const AnomaliesPanel = () => {
  const { visualizationData } = useSelector(state => state.dataset);
  
  if (!visualizationData || !visualizationData.anomalies) {
    return <div className="p-4" style={{ color: 'var(--text-secondary)' }}>No anomaly data available yet.</div>;
  }

  const { anomalies, dl_anomalies, patterns } = visualizationData;
  const { pca } = patterns || {};

  // 1. Prepare Isolation Forest Scatter Data (PCA Projections mapped with Anomaly Labels)
  const ifData = useMemo(() => {
    if (!pca?.projections || pca.projections.length === 0 || !anomalies?.anomaly_labels) return [];
    
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      isAnomaly: anomalies.anomaly_labels[idx] === 1,
      score: anomalies.anomaly_scores[idx]
    }));
  }, [pca, anomalies]);

  // 2. Prepare Deep Learning Autoencoder Data
  const dlData = useMemo(() => {
    if (!dl_anomalies?.latent_vectors || dl_anomalies.latent_vectors.length === 0) return [];
    
    return dl_anomalies.latent_vectors.map((vec, idx) => ({
      x: Number(vec[0].toFixed(2)),
      y: Number(vec[1].toFixed(2)),
      isAnomaly: dl_anomalies.anomaly_labels[idx] === 1,
      error: dl_anomalies.reconstruction_errors[idx]
    }));
  }, [dl_anomalies]);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      padding: '1rem 0',
      animation: 'fadeInUp 0.4s ease forwards'
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '1rem',
    },
    statCard: (isHighSeverity) => ({
      backgroundColor: isHighSeverity ? 'var(--tint-red)' : 'var(--tint-orange)',
      border: `1px solid ${isHighSeverity ? 'var(--tint-red-dark)' : 'var(--tint-orange-dark)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      boxShadow: 'var(--shadow-soft)',
    }),
    iconWrapper: (color) => ({
      backgroundColor: 'white',
      color: color,
      padding: '1rem',
      borderRadius: 'var(--radius-full)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    }),
    statInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.2rem',
    },
    statValue: (color) => ({
      fontSize: '1.75rem',
      fontWeight: '700',
      color: color,
    }),
    statLabel: {
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      fontWeight: '500',
    },
    chartGrid: {
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
    }
  };

  const IFTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 'bold', color: data.isAnomaly ? 'var(--error)' : 'var(--brand-primary)', marginBottom: '4px' }}>
            {data.isAnomaly ? '🚨 Anomaly Detected' : '✅ Normal Point'}
          </div>
          <p><strong>Anomaly Score:</strong> {data.score?.toFixed(3)}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
            Lower scores indicate higher abnormality.
          </p>
        </div>
      );
    }
    return null;
  };

  const DLTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 'bold', color: data.isAnomaly ? 'var(--error)' : '#9333ea', marginBottom: '4px' }}>
            {data.isAnomaly ? '🚨 DL Anomaly Detected' : '✅ Normal Point'}
          </div>
          <p><strong>Reconstruction Error:</strong> {data.error?.toFixed(4)}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
            High error means the model couldn't reconstruct it.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.container}>
      
      {/* Summary Highlight Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.statCard(false)}>
          <div style={styles.iconWrapper('var(--warning)')}>
            <AlertTriangle size={28} />
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Isolation Forest Anomalies</span>
            <span style={styles.statValue('var(--warning)')}>{anomalies.outliers_count} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>points</span></span>
          </div>
        </div>

        {dl_anomalies && (
          <div style={styles.statCard(true)}>
            <div style={styles.iconWrapper('var(--error)')}>
              <ShieldAlert size={28} />
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Deep Learning Anomalies</span>
              <span style={styles.statValue('var(--error)')}>{dl_anomalies.outliers_count} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>points</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Charts */}
      <div style={styles.chartGrid}>
        
        {/* Isolation Forest Chart */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <AlertTriangle size={20} color="var(--warning)" /> Statistical Isolation (PCA)
          </div>
          <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
            Points highlighted in <span style={{color: 'var(--warning)', fontWeight: 600}}>Orange</span> are statistical outliers detected by the Isolation Forest model mapped onto 2D space.
          </p>
          
          <div style={styles.chartContainer}>
            {ifData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis type="number" dataKey="x" name="PCA 1" stroke="var(--text-muted)" tick={{fontSize: 12}} />
                  <YAxis type="number" dataKey="y" name="PCA 2" stroke="var(--text-muted)" tick={{fontSize: 12}} />
                  <Tooltip content={<IFTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Scatter name="Data Points" data={ifData}>
                    {ifData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isAnomaly ? 'var(--warning)' : 'var(--brand-primary)'} opacity={entry.isAnomaly ? 1 : 0.3} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
                Not enough data for visualization.
              </div>
            )}
          </div>
        </div>

        {/* Autoencoder Chart */}
        {dlData.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Activity size={20} color="var(--error)" /> Deep Learning Neural Network
            </div>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
              Points highlighted in <span style={{color: 'var(--error)', fontWeight: 600}}>Red</span> failed to reconstruct through the Autoencoder, indicating complex structural anomalies.
            </p>
            
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis type="number" dataKey="x" name="Latent 1" stroke="var(--text-muted)" tick={{fontSize: 12}} />
                  <YAxis type="number" dataKey="y" name="Latent 2" stroke="var(--text-muted)" tick={{fontSize: 12}} />
                  <Tooltip content={<DLTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Scatter name="Latent Space" data={dlData}>
                    {dlData.map((entry, index) => (
                      <Cell key={`dl-cell-${index}`} fill={entry.isAnomaly ? 'var(--error)' : '#a855f7'} opacity={entry.isAnomaly ? 1 : 0.3} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AnomaliesPanel;
