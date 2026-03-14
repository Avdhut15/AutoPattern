import React from 'react';
import { useSelector } from 'react-redux';
import { Lightbulb, TrendingUp, Network, AlertTriangle, ShieldAlert, FileText, Zap, BarChart3 } from 'lucide-react';

const InsightsPanel = () => {
  const { insightsData } = useSelector(state => state.dataset);

  // insightsData is a flat array of strings from the unified /analyze endpoint
  if (!insightsData || !Array.isArray(insightsData) || insightsData.length === 0) {
    return <div className="p-4" style={{ color: 'var(--text-secondary)' }}>Gathering insights...</div>;
  }

  const insights = insightsData;

  const determineInsightType = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('correlat')) {
      return {
        title: 'Correlation Insight',
        icon: <TrendingUp size={20} />,
        color: 'var(--brand-primary)',
        bg: 'var(--tint-blue)'
      };
    }
    if (lower.includes('cluster') || lower.includes('dbscan') || lower.includes('kmeans') || lower.includes('group')) {
      return {
        title: 'Clustering Pattern',
        icon: <Network size={20} />,
        color: '#9333ea',
        bg: 'var(--tint-purple)'
      };
    }
    if (lower.includes('isolation forest') || lower.includes('anomal') || lower.includes('outlier')) {
      return {
        title: 'Anomaly Detection',
        icon: <AlertTriangle size={20} />,
        color: 'var(--warning)',
        bg: 'var(--tint-orange)'
      };
    }
    if (lower.includes('autoencoder') || lower.includes('deep learning') || lower.includes('reconstruction')) {
      return {
        title: 'Deep Learning Insight',
        icon: <ShieldAlert size={20} />,
        color: 'var(--error)',
        bg: 'var(--tint-red)'
      };
    }
    if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('consider') || lower.includes('action')) {
      return {
        title: 'Recommendation',
        icon: <Zap size={20} />,
        color: '#0d9488',
        bg: '#F0FDFA'
      };
    }
    if (lower.includes('distribution') || lower.includes('feature') || lower.includes('column') || lower.includes('data quality')) {
      return {
        title: 'Data Quality',
        icon: <BarChart3 size={20} />,
        color: '#06b6d4',
        bg: '#ECFEFF'
      };
    }
    return {
      title: 'General Observation',
      icon: <FileText size={20} />,
      color: 'var(--success)',
      bg: 'var(--tint-green)'
    };
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1rem 0',
      animation: 'fadeInUp 0.4s ease forwards'
    },
    headerRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.5rem',
    },
    titleIcon: {
      background: 'linear-gradient(135deg, var(--brand-primary), #9333ea)',
      color: 'white',
      padding: '8px',
      borderRadius: 'var(--radius-sm)',
      display: 'flex'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
    },
    subtitle: {
      fontSize: '0.9rem',
      color: 'var(--text-secondary)',
      marginBottom: '1rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem',
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    iconBox: (color, bg) => ({
      backgroundColor: bg,
      color: color,
      padding: '0.6rem',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    cardTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--text-primary)',
    },
    cardBody: {
      fontSize: '0.9rem',
      color: 'var(--text-secondary)',
      lineHeight: '1.6',
    }
  };

  const getCardHoverStyle = (e, isEnter) => {
    if (isEnter) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
    } else {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.01)';
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <div style={styles.headerRow}>
          <div style={styles.titleIcon}>
            <Lightbulb size={20} />
          </div>
          <h2 style={styles.title}>AI-Generated Insights</h2>
        </div>
        <p style={styles.subtitle}>
          Powered by Gemini AI — specific, actionable analysis based on your dataset's actual columns and values.
        </p>
      </div>

      <div style={styles.grid}>
        {insights.map((insightText, idx) => {
          const typeInfo = determineInsightType(insightText);

          return (
            <div
              key={idx}
              style={styles.card}
              onMouseEnter={(e) => getCardHoverStyle(e, true)}
              onMouseLeave={(e) => getCardHoverStyle(e, false)}
            >
              <div style={styles.cardHeader}>
                <div style={styles.iconBox(typeInfo.color, typeInfo.bg)}>
                  {typeInfo.icon}
                </div>
                <h3 style={styles.cardTitle}>{typeInfo.title}</h3>
              </div>
              <p style={styles.cardBody}>
                {insightText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsPanel;
