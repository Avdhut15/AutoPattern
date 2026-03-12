import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileType } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadDataset } from '../store/datasetSlice';
import PremiumCard from '../components/PremiumCard';
import './UploadPage.css';

const UploadPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState(null);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { uploadLoading, uploadError } = useSelector((state) => state.dataset);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;
    
    // Check extension
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      setLocalError("Please upload a valid CSV, Excel, or JSON file.");
      setFile(null);
      return false;
    }
    
    // Check size (e.g., max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setLocalError("File is too large. Maximum size is 50MB.");
      setFile(null);
      return false;
    }
    
    setLocalError(null);
    setFile(selectedFile);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const submitFile = async () => {
    if (!file) return;
    
    setLocalError(null);
    
    const resultAction = await dispatch(uploadDataset(file));
    if (uploadDataset.fulfilled.match(resultAction)) {
      navigate('/overview');
    }
  };

  const displayError = localError || uploadError;

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1 className="text-gradient">Welcome to AutoPattern</h1>
        <p className="subtitle">Upload your dataset to automatically discover patterns, anomalies, and insights.</p>
      </div>

      <PremiumCard className="upload-card">
        <div 
          className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!file ? handleUploadClick : undefined}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv,.xlsx,.xls,.json" 
            style={{ display: 'none' }} 
          />
          
          {file ? (
            <div className="file-preview">
              <FileType size={48} className="file-icon" />
              <div className="file-info">
                <h3>{file.name}</h3>
                <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon-wrapper">
                <UploadCloud size={48} />
              </div>
              <h3>Drag & drop your dataset here</h3>
              <p>or click to browse from your computer</p>
              <div className="supported-formats">
                <span>CSV</span> • <span>Excel</span> • <span>JSON</span>
              </div>
            </div>
          )}
        </div>

        {displayError && <div className="error-message">{displayError}</div>}

        <button 
          className={`primary-btn upload-btn ${!file || uploadLoading ? 'disabled' : ''}`}
          onClick={submitFile}
          disabled={!file || uploadLoading}
        >
          {uploadLoading ? 'Uploading & Processing...' : 'Analyze Dataset'}
        </button>
      </PremiumCard>
    </div>
  );
};

export default UploadPage;
