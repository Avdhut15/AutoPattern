import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, AlertTriangle, AlertOctagon, Activity, BarChart3, Search, Crosshair, Target } from 'lucide-react';
import ReconstructionChart from '../components/ReconstructionChart';
import { DynamicBarChart } from '../components/DynamicChart';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'isolation_forest', label: 'Isolation Forest', icon: AlertTriangle },
  { id: 'lof', label: 'LOF', icon: Search },
  { id: 'zscore', label: 'Z-Score', icon: AlertOctagon },
  { id: 'one_class_svm', label: 'One-Class SVM', icon: Crosshair },
  { id: 'elliptic_envelope', label: 'Elliptic Envelope', icon: Target },
  { id: 'autoencoder', label: 'Autoencoder', icon: Activity },
];

const AnomaliesPanel = () => {
  const visualizationData = useStore(state => state.visualizationData);
  const [activeTab, setActiveTab] = useState('overview');

  if (!visualizationData || !visualizationData.anomalies) {
    return <div className="p-4" style={{ color: 'var(--text-secondary)' }}>No anomaly data available yet.</div>;
  }

  const { anomalies, dl_anomalies, patterns } = visualizationData;
  const { pca } = patterns || {};

  // Model availability
  const hasIF = anomalies?.anomaly_labels?.length > 0;
  const hasLOF = anomalies?.lof_labels?.length > 0;
  const hasZScore = anomalies?.zscore_labels?.length > 0;
  const hasOCSVM = anomalies?.ocsvm_labels?.length > 0;
  const hasElliptic = anomalies?.elliptic_labels?.length > 0;
  const hasAE = dl_anomalies?.latent_vectors?.length > 0;

  // Compute unique de-duplicated anomalies count
  const uniqueCount = useMemo(() => {
    if (anomalies?.unique_outliers_count !== undefined) {
      return anomalies.unique_outliers_count;
    }
    const lists = [
      anomalies?.anomaly_labels,
      anomalies?.lof_labels,
      anomalies?.zscore_labels,
      anomalies?.ocsvm_labels,
      anomalies?.elliptic_labels,
      dl_anomalies?.anomaly_labels,
    ].filter(Boolean);
    if (!lists.length) return 0;
    const minLen = Math.min(...lists.map(l => l.length));
    let count = 0;
    for (let i = 0; i < minLen; i++) {
      if (lists.some(l => l[i] === 1)) count++;
    }
    return count;
  }, [anomalies, dl_anomalies]);

  // Isolation Forest scatter data
  const ifData = useMemo(() => {
    if (!pca?.projections || !anomalies?.anomaly_labels) return [];
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      isAnomaly: anomalies.anomaly_labels[idx] === 1,
      score: anomalies.anomaly_scores?.[idx]
    }));
  }, [pca, anomalies]);

  // LOF scatter data (reuse PCA projections)
  const lofData = useMemo(() => {
    if (!pca?.projections || !anomalies?.lof_labels) return [];
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      isAnomaly: anomalies.lof_labels[idx] === 1,
      score: anomalies.lof_scores?.[idx]
    }));
  }, [pca, anomalies]);

  // Z-Score scatter data (reuse PCA projections)
  const zscoreData = useMemo(() => {
    if (!pca?.projections || !anomalies?.zscore_labels) return [];
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      isAnomaly: anomalies.zscore_labels[idx] === 1,
      score: anomalies.zscore_scores?.[idx]
    }));
  }, [pca, anomalies]);

  // One-Class SVM scatter data
  const ocsvmData = useMemo(() => {
    if (!pca?.projections || !anomalies?.ocsvm_labels) return [];
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      isAnomaly: anomalies.ocsvm_labels[idx] === 1,
      score: anomalies.ocsvm_scores?.[idx]
    }));
  }, [pca, anomalies]);

  // Elliptic Envelope scatter data
  const ellipticData = useMemo(() => {
    if (!pca?.projections || !anomalies?.elliptic_labels) return [];
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      isAnomaly: anomalies.elliptic_labels[idx] === 1,
      score: anomalies.elliptic_scores?.[idx]
    }));
  }, [pca, anomalies]);

  // Autoencoder latent space
  const dlData = useMemo(() => {
    if (!dl_anomalies?.latent_vectors?.length) return [];
    return dl_anomalies.latent_vectors.map((vec, idx) => ({
      x: Number(vec[0].toFixed(2)),
      y: Number(vec[1].toFixed(2)),
      isAnomaly: dl_anomalies.anomaly_labels[idx] === 1,
      error: dl_anomalies.reconstruction_errors?.[idx]
    }));
  }, [dl_anomalies]);

  // Comparison bar chart data
  const comparisonData = useMemo(() => {
    const items = [];
    if (hasIF) items.push({ name: 'Isolation Forest', value: anomalies.outliers_count || 0, color: '#f59e0b' });
    if (hasLOF) items.push({ name: 'LOF', value: anomalies.lof_outliers_count || 0, color: '#06b6d4' });
    if (hasZScore) items.push({ name: 'Z-Score', value: anomalies.zscore_outliers_count || 0, color: '#9333ea' });
    if (hasOCSVM) items.push({ name: 'One-Class SVM', value: anomalies.ocsvm_outliers_count || 0, color: '#10b981' });
    if (hasElliptic) items.push({ name: 'Elliptic Envelope', value: anomalies.elliptic_outliers_count || 0, color: '#6366f1' });
    if (hasAE) items.push({ name: 'Autoencoder', value: dl_anomalies.outliers_count || 0, color: '#ef4444' });
    return items;
  }, [anomalies, dl_anomalies, hasIF, hasLOF, hasZScore, hasOCSVM, hasElliptic, hasAE]);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1rem 0',
      animation: 'fadeInUp 0.4s ease forwards'
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginBottom: '0.5rem',
    },
    statCard: (color, bg) => ({
      backgroundColor: bg,
      border: `1px solid ${color}20`,
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: 'var(--shadow-soft)',
    }),
    iconWrapper: (color) => ({
      backgroundColor: 'var(--bg-card)',
      color: color,
      padding: '0.75rem',
      borderRadius: 'var(--radius-full)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    }),
    statValue: (color) => ({
      fontSize: '1.5rem',
      fontWeight: '700',
      color: color,
    }),
    statLabel: {
      fontSize: '0.8rem',
      color: 'var(--text-secondary)',
      fontWeight: '500',
    },
    tabGroup: {
      display: 'flex',
      gap: '0.35rem',
      backgroundColor: 'var(--bg-global)',
      padding: '0.25rem',
      borderRadius: 'var(--radius-full)',
      width: 'fit-content',
      flexWrap: 'wrap',
    },
    tabBtn: (isActive) => ({
      padding: '0.4rem 1rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.8rem',
      fontWeight: isActive ? '600' : '500',
      color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
      boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
      border: isActive ? '1px solid var(--border-light)' : '1px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
    }),
    card: {
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
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
    emptyState: {
      display: 'flex',
      height: '200px',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
    },
  };

  const ScatterTooltip = ({ active, payload, modelName }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 'bold', color: data.isAnomaly ? 'var(--error)' : 'var(--brand-primary)', marginBottom: '4px' }}>
            {data.isAnomaly ? '🚨 Anomaly' : '✅ Normal'}
          </div>
          {data.score !== undefined && <p><strong>Score:</strong> {data.score?.toFixed(3)}</p>}
          {data.error !== undefined && <p><strong>Error:</strong> {data.error?.toFixed(4)}</p>}
        </div>
      );
    }
    return null;
  };

  const renderScatterChart = (data, label, normalColor, anomalyColor) => {
    if (data.length === 0) return <div style={styles.emptyState}>Not enough data for visualization.</div>;
    return (
      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
            <XAxis type="number" dataKey="x" name="PCA 1" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="PCA 2" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <Tooltip content={<ScatterTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Scatter name={label} data={data} isAnimationActive={data.length < 500}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isAnomaly ? anomalyColor : normalColor} opacity={entry.isAnomaly ? 1 : 0.3} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Available tabs based on what models ran
  const availableTabs = TABS.filter(tab => {
    if (tab.id === 'overview') return true;
    if (tab.id === 'isolation_forest') return hasIF;
    if (tab.id === 'lof') return hasLOF;
    if (tab.id === 'zscore') return hasZScore;
    if (tab.id === 'one_class_svm') return hasOCSVM;
    if (tab.id === 'elliptic_envelope') return hasElliptic;
    if (tab.id === 'autoencoder') return hasAE;
    return false;
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <BarChart3 size={20} color="var(--brand-primary)" /> Anomaly Comparison Across Models
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Number of anomalies detected by each model. Different models capture different types of outliers.
            </p>
            {comparisonData.length > 0 ? (
              <DynamicBarChart data={comparisonData} xKey="name" yKey="value" height={280} />
            ) : (
              <div style={styles.emptyState}>No anomaly models were run.</div>
            )}
          </div>
        );

      case 'isolation_forest':
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <AlertTriangle size={20} color="var(--warning)" /> Isolation Forest — PCA Projection
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Orange points are statistical outliers detected by the Isolation Forest algorithm.
            </p>
            {renderScatterChart(ifData, 'IF Anomalies', 'var(--brand-primary)', 'var(--warning)')}
          </div>
        );

      case 'lof':
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Search size={20} color="#06b6d4" /> Local Outlier Factor (LOF) — PCA Projection
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              LOF measures local density deviation. Cyan-highlighted points have significantly lower density than their neighbors.
            </p>
            {renderScatterChart(lofData, 'LOF Anomalies', 'var(--brand-primary)', '#06b6d4')}
          </div>
        );

      case 'zscore':
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <AlertOctagon size={20} color="#9333ea" /> Z-Score Outlier Detection
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Points where any feature value exceeds 3 standard deviations (±3σ) from the mean.
            </p>
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--tint-purple)', borderRadius: 'var(--radius-md)', marginTop: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#9333ea' }}>
                {anomalies.zscore_outliers_count || 0}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                data points exceed the ±3σ threshold in at least one feature
              </div>
            </div>
            {renderScatterChart(zscoreData, 'Z-Score Anomalies', 'var(--brand-primary)', '#9333ea')}
          </div>
        );

      case 'one_class_svm':
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Crosshair size={20} color="#10b981" /> One-Class SVM — PCA Projection
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Non-linear kernel Support Vector Machine learns an RBF decision boundary around normal data.
            </p>
            {renderScatterChart(ocsvmData, 'One-Class SVM Anomalies', 'var(--brand-primary)', '#10b981')}
          </div>
        );

      case 'elliptic_envelope':
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Target size={20} color="#6366f1" /> Elliptic Envelope — PCA Projection
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Robust covariance estimation (FastMCD) fits an elliptical boundary to isolate outliers.
            </p>
            {renderScatterChart(ellipticData, 'Elliptic Envelope Anomalies', 'var(--brand-primary)', '#6366f1')}
          </div>
        );

      case 'autoencoder':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Latent space scatter */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Activity size={20} color="var(--error)" /> Autoencoder Latent Space
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Red points failed to reconstruct through the neural network, indicating complex structural anomalies.
              </p>
              {renderScatterChart(dlData, 'AE Anomalies', '#a855f7', 'var(--error)')}
            </div>
            {/* Reconstruction error line chart */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Activity size={20} color="var(--brand-primary)" /> Reconstruction Error
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Error per data point. Points above the dashed threshold line are flagged as anomalies.
              </p>
              <ReconstructionChart
                reconstruction_errors={dl_anomalies.reconstruction_errors || []}
                anomaly_labels={dl_anomalies.anomaly_labels || []}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.statCard('var(--brand-primary)', 'var(--tint-blue)')}>
          <div style={styles.iconWrapper('var(--brand-primary)')}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={styles.statLabel}>Unique Anomalies</div>
            <div style={styles.statValue('var(--brand-primary)')}>{uniqueCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span></div>
          </div>
        </div>

        {hasIF && (
          <div style={styles.statCard('var(--warning)', 'var(--tint-orange)')}>
            <div style={styles.iconWrapper('var(--warning)')}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={styles.statLabel}>Isolation Forest</div>
              <div style={styles.statValue('var(--warning)')}>{anomalies.outliers_count} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span></div>
            </div>
          </div>
        )}
        {hasLOF && (
          <div style={styles.statCard('#06b6d4', '#ECFEFF')}>
            <div style={styles.iconWrapper('#06b6d4')}>
              <Search size={22} />
            </div>
            <div>
              <div style={styles.statLabel}>LOF</div>
              <div style={styles.statValue('#06b6d4')}>{anomalies.lof_outliers_count} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span></div>
            </div>
          </div>
        )}
        {hasZScore && (
          <div style={styles.statCard('#9333ea', 'var(--tint-purple)')}>
            <div style={styles.iconWrapper('#9333ea')}>
              <AlertOctagon size={22} />
            </div>
            <div>
              <div style={styles.statLabel}>Z-Score</div>
              <div style={styles.statValue('#9333ea')}>{anomalies.zscore_outliers_count} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span></div>
            </div>
          </div>
        )}
        {hasOCSVM && (
          <div style={styles.statCard('#10b981', '#ECFDF5')}>
            <div style={styles.iconWrapper('#10b981')}>
              <Crosshair size={22} />
            </div>
            <div>
              <div style={styles.statLabel}>One-Class SVM</div>
              <div style={styles.statValue('#10b981')}>{anomalies.ocsvm_outliers_count} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span></div>
            </div>
          </div>
        )}
        {hasElliptic && (
          <div style={styles.statCard('#6366f1', '#EEF2FF')}>
            <div style={styles.iconWrapper('#6366f1')}>
              <Target size={22} />
            </div>
            <div>
              <div style={styles.statLabel}>Elliptic Env</div>
              <div style={styles.statValue('#6366f1')}>{anomalies.elliptic_outliers_count} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span></div>
            </div>
          </div>
        )}
        {hasAE && (
          <div style={styles.statCard('var(--error)', 'var(--tint-red)')}>
            <div style={styles.iconWrapper('var(--error)')}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={styles.statLabel}>Autoencoder</div>
              <div style={styles.statValue('var(--error)')}>{dl_anomalies.outliers_count} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Model Tabs */}
      <div style={styles.tabGroup}>
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={styles.tabBtn(activeTab === tab.id)}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default AnomaliesPanel;
