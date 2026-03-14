import React from 'react';
import { useSelector } from 'react-redux';
import { Brain, Check, X, Sparkles } from 'lucide-react';

const AIAdvisorCard = () => {
  const { recommendationData } = useSelector(state => state.dataset);

  if (!recommendationData) return null;

  const { dataset_type, recommended_models = [], skip_reasons = {}, reasoning } = recommendationData;

  const modelLabels = {
    clustering_kmeans: 'KMeans Clustering',
    clustering_hierarchical: 'Hierarchical Clustering',
    pca: 'PCA',
    tsne: 't-SNE',
    correlation: 'Correlation Matrix',
    anomaly_isolation_forest: 'Isolation Forest',
    anomaly_lof: 'Local Outlier Factor',
    anomaly_zscore: 'Z-Score Detection',
    anomaly_autoencoder: 'Deep Learning Autoencoder',
  };

  const allModels = Object.keys(modelLabels);
  const skippedModels = allModels.filter(m => !recommended_models.includes(m));

  const styles = {
    card: {
      background: 'linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%)',
      border: '1px solid var(--tint-blue-dark)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      animation: 'fadeInUp 0.4s ease forwards',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1rem',
    },
    iconBox: {
      background: 'linear-gradient(135deg, var(--brand-primary), #9333ea)',
      color: 'white',
      padding: '0.6rem',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.15rem 0.6rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: 'var(--tint-purple)',
      color: '#9333ea',
      marginLeft: 'auto',
    },
    reasoning: {
      fontSize: '0.9rem',
      color: 'var(--text-secondary)',
      lineHeight: '1.6',
      marginBottom: '1.25rem',
      padding: '0.75rem 1rem',
      backgroundColor: 'rgba(255,255,255,0.7)',
      borderRadius: 'var(--radius-md)',
      borderLeft: '3px solid var(--brand-primary)',
    },
    chipsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginBottom: '0.5rem',
    },
    chipActive: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.3rem 0.75rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.8rem',
      fontWeight: '500',
      backgroundColor: 'var(--tint-green)',
      color: 'var(--success)',
      border: '1px solid var(--tint-green-dark)',
    },
    chipSkipped: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.3rem 0.75rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.8rem',
      fontWeight: '500',
      backgroundColor: '#F1F5F9',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-light)',
      textDecoration: 'line-through',
    },
    sectionLabel: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.5rem',
      marginTop: '0.75rem',
    },
    skipReason: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      marginTop: '0.25rem',
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.iconBox}>
          <Brain size={20} />
        </div>
        <span style={styles.title}>AI Model Advisor</span>
        <span style={styles.badge}>
          <Sparkles size={12} />
          {dataset_type?.replace(/_/g, ' ') || 'Auto-detected'}
        </span>
      </div>

      {reasoning && (
        <div style={styles.reasoning}>
          {reasoning}
        </div>
      )}

      <div style={styles.sectionLabel}>Selected Models ({recommended_models.length})</div>
      <div style={styles.chipsContainer}>
        {recommended_models.map(m => (
          <span key={m} style={styles.chipActive}>
            <Check size={14} /> {modelLabels[m] || m}
          </span>
        ))}
      </div>

      {skippedModels.length > 0 && (
        <>
          <div style={styles.sectionLabel}>Skipped ({skippedModels.length})</div>
          <div style={styles.chipsContainer}>
            {skippedModels.map(m => (
              <span key={m} style={styles.chipSkipped} title={skip_reasons[m] || 'Not recommended for this dataset'}>
                <X size={14} /> {modelLabels[m] || m}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AIAdvisorCard;
