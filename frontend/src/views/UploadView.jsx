import React, { useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import { UploadCloud, FileText } from 'lucide-react';

const UploadView = () => {
  const uploadDataset = useStore((state) => state.uploadDataset);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const file = files[0];
    // Check file size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }
    uploadDataset(file);
  };

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    },
    dropzone: {
      width: '100%',
      maxWidth: '650px',
      border: `2px dashed ${isDragging ? 'var(--brand-primary)' : 'var(--border-active)'}`,
      borderRadius: 'var(--radius-xl)',
      padding: '4rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDragging ? 'var(--tint-blue)' : 'var(--bg-card)',
      transition: 'all var(--transition-normal)',
      cursor: 'pointer',
      boxShadow: 'var(--shadow-soft)',
    },
    iconWrapper: {
      backgroundColor: isDragging ? 'var(--tint-blue-dark)' : 'var(--bg-global)',
      padding: '1.2rem',
      borderRadius: '50%',
      marginBottom: '1.5rem',
      color: 'var(--brand-primary)',
      transition: 'all var(--transition-normal)',
    },
    textMain: {
      fontSize: '1.1rem',
      fontWeight: 500,
      color: isDragging ? 'var(--brand-primary)' : 'var(--text-primary)',
      marginBottom: '0.5rem',
    },
    textSub: {
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      marginBottom: '2rem',
    },
    tipsContainer: {
      display: 'flex',
      gap: '1.5rem',
      marginTop: '3rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    tip: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.85rem',
      color: 'var(--text-secondary)',
      background: 'var(--bg-card)',
      padding: '0.5rem 1rem',
      borderRadius: 'var(--radius-full)',
      boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div 
        style={styles.dropzone}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input 
          type="file" 
          id="file-upload" 
          style={{ display: 'none' }} 
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileInput}
        />
        
        <div style={styles.iconWrapper}>
          <UploadCloud size={40} strokeWidth={1.5} />
        </div>
        
        <p style={styles.textMain}>
          {isDragging ? 'Drop it here!' : 'Drop a dataset here or click to browse'}
        </p>
        <p style={styles.textSub}>
          Supports CSV, XLSX, JSON (Max 10MB)
        </p>
      </div>

      <div style={styles.tipsContainer}>
        <div style={styles.tip}>
          <FileText size={16} color="var(--brand-primary)" />
          Ensure dataset has column headers
        </div>
        <div style={styles.tip}>
          <FileText size={16} color="var(--success)" />
          Max Size: 10MB
        </div>
        <div style={styles.tip}>
          <FileText size={16} color="var(--warning)" />
          Avoid overly sparse matrices
        </div>
      </div>
    </div>
  );
};

export default UploadView;
