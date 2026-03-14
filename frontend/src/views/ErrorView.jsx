import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetState } from '../store/datasetSlice';
import { AlertOctagon, RotateCcw } from 'lucide-react';

const ErrorView = () => {
  const dispatch = useDispatch();
  const { uploadError, analysisError } = useSelector((state) => state.dataset);
  
  const errorMsg = uploadError || analysisError || "An unknown error occurred.";

  const handleRetry = () => {
    dispatch(resetState());
  };

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
    card: {
      backgroundColor: 'var(--tint-red)',
      border: '1px solid var(--tint-red-dark)',
      padding: '3rem 4rem',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-hover)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: '500px',
      textAlign: 'center',
    },
    iconBox: {
      backgroundColor: 'var(--bg-card)',
      color: 'var(--error)',
      padding: '1rem',
      borderRadius: '50%',
      marginBottom: '1.5rem',
      boxShadow: 'var(--shadow-soft)'
    },
    title: {
      fontSize: '1.25rem',
      color: 'var(--error)',
      marginBottom: '1rem',
      fontWeight: 600,
    },
    subtitle: {
      fontSize: '0.95rem',
      color: 'var(--text-secondary)',
      marginBottom: '2rem',
      lineHeight: '1.5'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: 'var(--bg-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-active)',
      padding: '0.5rem 1.5rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      boxShadow: 'var(--shadow-soft)',
      transition: 'all 0.2s ease',
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.card}>
        <div style={styles.iconBox}>
          <AlertOctagon size={40} strokeWidth={1.5} />
        </div>
        <h2 style={styles.title}>Analysis Failed</h2>
        <p style={styles.subtitle}>
          {errorMsg}
        </p>
        <button style={styles.button} onClick={handleRetry}>
          <RotateCcw size={16} /> Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorView;
