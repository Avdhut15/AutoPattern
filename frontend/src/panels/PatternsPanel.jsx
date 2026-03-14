import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Network, GitMerge, Compass, Layers } from 'lucide-react';
import AIAdvisorCard from '../components/AIAdvisorCard';

const PatternsPanel = () => {
  const { visualizationData, recommendationData } = useSelector(state => state.dataset);

  if (!visualizationData || !visualizationData.patterns) {
    return <div className="p-4" style={{ color: 'var(--text-secondary)' }}>No pattern data available yet.</div>;
  }

  const { correlation, pca, clustering, tsne } = visualizationData.patterns;

  // PCA scatter with KMeans labels
  const scatterData = useMemo(() => {
    if (!pca?.projections || pca.projections.length === 0) return [];
    return pca.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      cluster: clustering?.kmeans_labels ? clustering.kmeans_labels[idx] : 0
    }));
  }, [pca, clustering]);

  // t-SNE scatter with KMeans labels
  const tsneData = useMemo(() => {
    if (!tsne?.projections || tsne.projections.length === 0) return [];
    return tsne.projections.map((proj, idx) => ({
      x: Number(proj[0].toFixed(2)),
      y: Number(proj[1].toFixed(2)),
      cluster: clustering?.kmeans_labels ? clustering.kmeans_labels[idx % (clustering.kmeans_labels.length)] : 0
    }));
  }, [tsne, clustering]);

  const clusterColors = [
    'var(--brand-primary)',
    '#0d9488',
    '#9333ea',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
  ];

  const features = correlation?.features || [];
  const matrix = correlation?.matrix || [];

  const getHeatmapColor = (value) => {
    if (value === 1) return 'rgba(59, 130, 246, 1)';
    if (value > 0.7) return 'rgba(59, 130, 246, 0.7)';
    if (value > 0.3) return 'rgba(59, 130, 246, 0.4)';
    if (value > 0) return 'rgba(59, 130, 246, 0.15)';
    if (value < -0.7) return 'rgba(239, 68, 68, 0.7)';
    if (value < -0.3) return 'rgba(239, 68, 68, 0.4)';
    if (value < 0) return 'rgba(239, 68, 68, 0.15)';
    return 'transparent';
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
    },
    clusterInfoBar: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      marginTop: '0.5rem',
    },
    clusterBadge: (color) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.2rem 0.6rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.75rem',
      fontWeight: '500',
      backgroundColor: `${color}15`,
      color: color,
      border: `1px solid ${color}30`,
    }),
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)', fontSize: '0.85rem' }}>
          <p><strong>Cluster:</strong> {payload[0].payload.cluster}</p>
          <p><strong>X:</strong> {payload[0].value}</p>
          <p><strong>Y:</strong> {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  // Count cluster members
  const kmeansCounts = useMemo(() => {
    if (!clustering?.kmeans_labels) return {};
    const counts = {};
    clustering.kmeans_labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
    return counts;
  }, [clustering]);

  const hierarchicalCounts = useMemo(() => {
    if (!clustering?.hierarchical_labels) return {};
    const counts = {};
    clustering.hierarchical_labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
    return counts;
  }, [clustering]);

  return (
    <div style={styles.container}>
      {/* AI Advisor Card at the top */}
      <AIAdvisorCard />

      <div style={styles.grid}>

        {/* PCA Cluster Plot */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Network size={20} color="#9333ea" /> KMeans Clusters (PCA Projection)
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Points of the same color belong to the same cluster detected by KMeans, projected into 2D via PCA.
          </p>
          {Object.keys(kmeansCounts).length > 0 && (
            <div style={styles.clusterInfoBar}>
              {Object.entries(kmeansCounts).map(([label, count]) => (
                <span key={label} style={styles.clusterBadge(clusterColors[label % clusterColors.length])}>
                  Cluster {label}: {count} pts
                </span>
              ))}
            </div>
          )}
          <div style={styles.chartContainer}>
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis type="number" dataKey="x" name="PCA 1" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" name="PCA 2" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Clusters" data={scatterData} isAnimationActive={scatterData.length < 500}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={clusterColors[entry.cluster % clusterColors.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Not enough numerical data for PCA.
              </div>
            )}
          </div>
        </div>

        {/* t-SNE Plot */}
        {tsneData.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Compass size={20} color="#06b6d4" /> t-SNE Visualization
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Non-linear dimensionality reduction revealing hidden structure in your data.
            </p>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis type="number" dataKey="x" name="t-SNE 1" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" name="t-SNE 2" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="t-SNE" data={tsneData} isAnimationActive={tsneData.length < 500}>
                    {tsneData.map((entry, index) => (
                      <Cell key={`tsne-${index}`} fill={clusterColors[entry.cluster % clusterColors.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Hierarchical Clustering Info */}
        {Object.keys(hierarchicalCounts).length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Layers size={20} color="#0d9488" /> Hierarchical Clustering (Ward)
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Agglomerative clustering using Ward linkage — builds a hierarchy of clusters from the bottom up.
            </p>
            <div style={{ ...styles.clusterInfoBar, marginTop: '1rem' }}>
              {Object.entries(hierarchicalCounts).map(([label, count]) => (
                <span key={label} style={{
                  ...styles.clusterBadge('#0d9488'),
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                }}>
                  <Layers size={14} /> Cluster {label}: {count} data points
                </span>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--tint-green)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Ward linkage minimizes the variance within each cluster. The algorithm found <strong style={{ color: 'var(--text-primary)' }}>{Object.keys(hierarchicalCounts).length}</strong> natural groupings in your data, which can be compared against the KMeans results above for consistency.
            </div>
          </div>
        )}

        {/* Correlation Heatmap */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <GitMerge size={20} color="var(--brand-primary)" /> Feature Correlation Matrix
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Dark blue = strong positive correlation, Red = negative correlation.
          </p>

          <div style={styles.heatmapContainer}>
            {features.length > 0 ? (
              <>
                {/* X-Axis Labels */}
                <div style={{ ...styles.heatmapRow, marginLeft: '120px' }}>
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
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Not enough numerical features for correlation.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatternsPanel;
