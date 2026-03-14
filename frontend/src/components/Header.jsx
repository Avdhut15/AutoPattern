import React from 'react';
import { Activity } from 'lucide-react';

const Header = () => {
  const styles = {
    header: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem 1.5rem',
      backgroundColor: 'transparent',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '1rem',
    },
    iconBox: {
      backgroundColor: 'var(--brand-primary)',
      color: 'white',
      padding: '8px',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: 'var(--text-primary)',
      letterSpacing: '-1px'
    },
    subtitle: {
      fontSize: '1rem',
      color: 'var(--text-secondary)',
      maxWidth: '500px',
      textAlign: 'center',
      lineHeight: '1.5'
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <div style={styles.iconBox}>
          <Activity size={28} strokeWidth={2.5} />
        </div>
        <h1 style={styles.title}>AutoPattern</h1>
      </div>
      <p style={styles.subtitle}>
        Upload your dataset to automatically detect hidden patterns, correlations, and anomalies.
      </p>
    </header>
  );
};

export default Header;
