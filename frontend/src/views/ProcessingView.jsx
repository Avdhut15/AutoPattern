import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Loader2, CheckCircle2 } from 'lucide-react';

const ProcessingView = () => {
  const { uploadLoading, analysisLoading } = useStore();
  
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (uploadLoading) setCurrentStep(1);
    else if (analysisLoading) setCurrentStep(2);
    else setCurrentStep(3); // Waiting for data to arrive
  }, [uploadLoading, analysisLoading]);

  const steps = [
    { id: 1, text: "Uploading dataset..." },
    { id: 2, text: "Running AI analysis (recommend → models → insights)..." },
    { id: 3, text: "Preparing results..." }
  ];

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
    card: {
      backgroundColor: 'var(--bg-card)',
      padding: '3rem 4rem',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-hover)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '400px',
    },
    spinnerBox: {
      marginBottom: '2rem',
      color: 'var(--brand-primary)',
      animation: 'spin 2s linear infinite'
    },
    heading: {
      fontSize: '1.25rem',
      color: 'var(--text-primary)',
      marginBottom: '2rem',
      fontWeight: 600,
    },
    stepsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      width: '100%',
    },
    stepItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.95rem',
      transition: 'opacity 0.3s ease',
      color: 'var(--text-secondary)'
    },
    stepActive: {
      color: 'var(--text-primary)',
      fontWeight: 500,
      opacity: 1
    },
    stepDone: {
      color: 'var(--text-muted)',
      opacity: 0.7
    },
    stepFuture: {
      color: 'var(--text-muted)',
      opacity: 0.4
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <div style={styles.card}>
        <div style={styles.spinnerBox}>
          <Loader2 size={48} strokeWidth={1.5} />
        </div>
        <h2 style={styles.heading}>Processing Dataset</h2>
        <div style={styles.stepsList}>
          {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            
            let itemStyle = { ...styles.stepItem };
            if (isDone) Object.assign(itemStyle, styles.stepDone);
            else if (isActive) Object.assign(itemStyle, styles.stepActive);
            else Object.assign(itemStyle, styles.stepFuture);

            return (
              <div key={step.id} style={itemStyle}>
                {isDone ? (
                  <CheckCircle2 size={20} color="var(--success)" />
                ) : isActive ? (
                  <Loader2 size={20} style={{ animation: 'spin 2s linear infinite', color: 'var(--brand-primary)' }} />
                ) : (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-light)' }} />
                )}
                {step.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessingView;
