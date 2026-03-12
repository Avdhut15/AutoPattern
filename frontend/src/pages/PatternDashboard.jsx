import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVisualizations } from '../store/datasetSlice';
import PremiumCard from '../components/PremiumCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StateComponents';
import { DynamicScatterChart } from '../components/DynamicChart';
import './PatternDashboard.css';

const PatternDashboard = () => {
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
        message="Please upload a dataset first to discover patterns."
        actionText="Go to Upload"
        onAction={() => navigate('/')}
      />
    );
  }

  if (visualizationLoading && !visualizationData) return <LoadingState message="Running clustering and dimensionality reduction algorithms..." />;
  if (visualizationError && !visualizationData) return <ErrorState error={visualizationError} onRetry={() => dispatch(fetchVisualizations())} />;
  if (!visualizationData) return null;

  const patternData = visualizationData.patterns || {};

  // Process PCA + KMeans data for the scatter plot
  const pcaProjections = patternData.pca?.projections || [];
  const kmeansLabels = patternData.clustering?.kmeans_labels || [];
  
  const scatterData = pcaProjections.map((proj, idx) => ({
    x: proj[0],
    y: proj[1] || 0,
    z: proj[2] || 0,
    cluster: kmeansLabels[idx] !== undefined ? kmeansLabels[idx] : 0,
    id: idx
  }));

  // Process Correlation Matrix for display
  const corrFeatures = patternData.correlation?.features || [];
  const corrMatrix = patternData.correlation?.matrix || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-gradient">Pattern Discovery</h1>
        <p className="subtitle">Algorithmic clustering and correlations for <strong>{originalFileName}</strong></p>
      </div>

      <div className="charts-grid">
        <PremiumCard title="PCA 2D Projection (KMeans Clusters)" className="full-width-card">
          {scatterData.length > 0 ? (
            <DynamicScatterChart 
              data={scatterData} 
              xAxisLabel="Principal Component 1"
              yAxisLabel="Principal Component 2"
            />
          ) : (
            <EmptyState title="Insufficient Data" message="Not enough numerical columns for PCA." />
          )}
        </PremiumCard>

        {corrFeatures.length > 0 && (
          <PremiumCard title="Top Correlations" className="full-width-card">
            <div className="correlation-grid">
              {(() => {
                const topPairs = [];
                for(let i=0; i<corrFeatures.length; i++) {
                  for(let j=i+1; j<corrFeatures.length; j++) {
                    const corr = corrMatrix[i][j];
                    if (Math.abs(corr) > 0.5) {
                      topPairs.push({ f1: corrFeatures[i], f2: corrFeatures[j], corr });
                    }
                  }
                }
                topPairs.sort((a,b) => Math.abs(b.corr) - Math.abs(a.corr));
                
                if (topPairs.length === 0) return <p className="text-muted">No strong correlations found (|r| &gt; 0.5).</p>;
                
                return topPairs.slice(0, 8).map((pair, idx) => (
                  <div key={idx} className="correlation-item">
                    <div className="corr-features">
                      <span>{pair.f1}</span>
                      <span className="corr-arrow">↔</span>
                      <span>{pair.f2}</span>
                    </div>
                    <div className={`corr-value ${pair.corr > 0 ? 'positive' : 'negative'}`}>
                      {pair.corr > 0 ? '+' : ''}{pair.corr.toFixed(2)}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </PremiumCard>
        )}
      </div>
    </div>
  );
};

export default PatternDashboard;
