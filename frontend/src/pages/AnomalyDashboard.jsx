import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVisualizations } from '../store/datasetSlice';
import PremiumCard from '../components/PremiumCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StateComponents';
import { DynamicScatterChart } from '../components/DynamicChart';
import './PatternDashboard.css';

const AnomalyDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    currentFile, 
    originalFileName, 
    visualizationData, 
    visualizationLoading, 
    visualizationError 
  } = useSelector((state) => state.dataset);

  useEffect(() => {
    if (currentFile && !visualizationData && !visualizationLoading) {
      dispatch(fetchVisualizations());
    }
  }, [currentFile, visualizationData, visualizationLoading, dispatch]);

  if (!currentFile) {
    return (
      <EmptyState 
        title="No Dataset Selected" 
        message="Please upload a dataset first to detect anomalies."
        actionText="Go to Upload"
        onAction={() => navigate('/')}
      />
    );
  }

  if (visualizationLoading && !visualizationData) return <LoadingState message="Running Isolation Forest and Deep Autoencoders..." />;
  if (visualizationError && !visualizationData) return <ErrorState error={visualizationError} onRetry={() => dispatch(fetchVisualizations())} />;
  if (!visualizationData) return null;

  const isoData = visualizationData.anomalies || {};
  const dlData = visualizationData.dl_anomalies || {};
  
  // Format data for ScatterChart components
  // We use the index as x-axis and the anomaly score / reconstruction error as y-axis
  
  const isoScatterData = isoData?.anomaly_scores?.map((score, idx) => ({
    x: idx,
    y: score,
    cluster: isoData.anomaly_labels[idx] === 1 ? -1 : 0 // -1 mapped to noise/anomaly color in DynamicChart
  })) || [];

  const dlScatterData = dlData?.reconstruction_errors?.map((error, idx) => ({
    x: idx,
    y: error,
    cluster: dlData.anomaly_labels[idx] === 1 ? -1 : 0
  })) || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-gradient">Anomaly Detection</h1>
        <p className="subtitle">Statistical and Deep Learning outlier detection for <strong>{originalFileName}</strong></p>
      </div>

      <div className="metrics-grid">
        <PremiumCard className="metric-card">
          <div className="metric-value">{isoData?.outliers_count || 0}</div>
          <div className="metric-label">Isolation Forest Anomalies</div>
        </PremiumCard>
        
        <PremiumCard className="metric-card">
          <div className="metric-value">{dlData?.outliers_count || 0}</div>
          <div className="metric-label">Autoencoder Anomalies</div>
        </PremiumCard>
      </div>

      <div className="charts-grid">
        <PremiumCard title="Isolation Forest (Anomaly Scores)" className="full-width-card">
          <p className="text-muted" style={{ marginBottom: '16px' }}>Lower scores indicate higher likelihood of being an anomaly (shown in white/gray).</p>
          {isoScatterData.length > 0 ? (
            <DynamicScatterChart 
              data={isoScatterData} 
              xAxisLabel="Data Point Index"
              yAxisLabel="Anomaly Score"
              zKey={null}
            />
          ) : (
            <EmptyState title="No Data" message="Unable to generate anomaly plot." />
          )}
        </PremiumCard>

        <PremiumCard title="Deep Learning Autoencoder (Reconstruction Error)" className="full-width-card">
          <p className="text-muted" style={{ marginBottom: '16px' }}>Higher reconstruction errors indicate higher likelihood of being an anomaly (shown in white/gray).</p>
          {dlScatterData.length > 0 ? (
            <DynamicScatterChart 
              data={dlScatterData} 
              xAxisLabel="Data Point Index"
              yAxisLabel="Reconstruction Error"
              zKey={null}
            />
          ) : (
            <EmptyState title="No Data" message="Unable to generate autoencoder plot." />
          )}
        </PremiumCard>
      </div>
    </div>
  );
};

export default AnomalyDashboard;
