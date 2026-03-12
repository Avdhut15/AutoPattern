import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInsights } from '../store/datasetSlice';
import PremiumCard from '../components/PremiumCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StateComponents';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import './InsightsPage.css';

const InsightsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    currentFile, 
    originalFileName, 
    insightsData, 
    insightsLoading, 
    insightsError 
  } = useSelector((state) => state.dataset);

  useEffect(() => {
    if (currentFile && !insightsData && !insightsLoading) {
      dispatch(fetchInsights());
    }
  }, [currentFile, insightsData, insightsLoading, dispatch]);

  if (!currentFile) {
    return (
      <EmptyState 
        title="No Dataset Selected" 
        message="Please upload a dataset first to generate insights."
        actionText="Go to Upload"
        onAction={() => navigate('/')}
      />
    );
  }

  if (insightsLoading && !insightsData) return <LoadingState message="Synthesizing analysis results into natural language insights..." />;
  if (insightsError && !insightsData) return <ErrorState error={insightsError} onRetry={() => dispatch(fetchInsights())} />;

  const insights = insightsData?.insights || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <Sparkles className="text-warning" size={32} />
          <h1 className="text-gradient" style={{ margin: 0 }}>Auto-Generated Insights</h1>
        </div>
        <p className="subtitle">AI-synthesized conclusions for <strong>{originalFileName}</strong></p>
      </div>

      <PremiumCard className="insights-card">
        {insights.length > 0 ? (
          <div className="insights-list">
            {insights.map((insight, idx) => (
              <div key={idx} className="insight-item">
                <div className="insight-icon">
                  <CheckCircle2 size={24} className="text-success" />
                </div>
                <div className="insight-text">
                  {/* Highlight numbers and specific keywords for better readability */}
                  {insight.split(/('[^']+'|\b(?:correlated|anomalies|clusters|noise)\b|\d+(?:\.\d+)?%?)/i).map((part, i) => {
                    const isFeatureName = part.startsWith("'") && part.endsWith("'");
                    const isNumber = /^\d+(?:\.\d+)?%?$/.test(part);
                    const isKeyword = /^(correlated|anomalies|clusters|noise)$/i.test(part);
                    
                    if (isFeatureName) {
                      return <span key={i} className="highlight feature">{part}</span>;
                    }
                    if (isNumber) {
                      return <span key={i} className="highlight number">{part}</span>;
                    }
                    if (isKeyword) {
                      return <span key={i} className="highlight keyword">{part}</span>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No Insights Available" message="The dataset did not produce any significant insights across the models." />
        )}
      </PremiumCard>
    </div>
  );
};

export default InsightsPage;
