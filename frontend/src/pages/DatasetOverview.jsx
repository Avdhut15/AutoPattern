import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary } from '../store/datasetSlice';
import PremiumCard from '../components/PremiumCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StateComponents';
import './DatasetOverview.css';

const DatasetOverview = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    currentFile, 
    originalFileName, 
    summaryData, 
    summaryLoading, 
    summaryError 
  } = useSelector((state) => state.dataset);

  useEffect(() => {
    if (currentFile && !summaryData && !summaryLoading) {
      dispatch(fetchSummary());
    }
  }, [currentFile, summaryData, summaryLoading, dispatch]);

  if (!currentFile) {
    return (
      <EmptyState 
        title="No Dataset Uploaded" 
        message="Please upload a dataset first to see its overview and metrics."
        actionText="Go to Upload"
        onAction={() => navigate('/')}
      />
    );
  }

  if (summaryLoading && !summaryData) return <LoadingState message="Analyzing dataset structure and statistics..." />;
  if (summaryError && !summaryData) return <ErrorState error={summaryError} onRetry={() => dispatch(fetchSummary())} />;
  if (!summaryData) return null;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="text-gradient">Dataset Overview</h1>
        <p className="subtitle">Extracted metrics for <strong>{originalFileName || summaryData.filename}</strong></p>
      </div>

      <div className="metrics-grid">
        <PremiumCard className="metric-card">
          <div className="metric-value">{summaryData.num_rows.toLocaleString()}</div>
          <div className="metric-label">Total Rows</div>
        </PremiumCard>
        
        <PremiumCard className="metric-card">
          <div className="metric-value">{summaryData.num_cols}</div>
          <div className="metric-label">Total Columns</div>
        </PremiumCard>
        
        <PremiumCard className="metric-card">
          <div className="metric-value">{summaryData.numerical_columns.length}</div>
          <div className="metric-label">Numeric Features</div>
        </PremiumCard>
        
        <PremiumCard className="metric-card">
          <div className="metric-value">{summaryData.categorical_columns.length}</div>
          <div className="metric-label">Categorical Features</div>
        </PremiumCard>
      </div>

      <div className="overview-content">
        <PremiumCard title="Column Details" className="details-card">
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Feature Name</th>
                  <th>Type</th>
                  <th>Missing Values</th>
                  <th>Preview (Stats/Unique)</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.columns.map((col, idx) => {
                  const isNumeric = summaryData.numerical_columns.includes(col);
                  const missingCount = summaryData.missing_values[col] || 0;
                  const stats = summaryData.summary_stats?.[col];
                  
                  return (
                    <tr key={idx}>
                      <td className="font-semibold">{col}</td>
                      <td>
                        <span className={`badge ${isNumeric ? 'badge-numeric' : 'badge-categorical'}`}>
                          {isNumeric ? 'Numeric' : 'Categorical'}
                        </span>
                      </td>
                      <td>
                        {missingCount > 0 ? (
                          <span className="text-error">{missingCount} ({(missingCount/summaryData.num_rows*100).toFixed(1)}%)</span>
                        ) : '0'}
                      </td>
                      <td className="stats-preview">
                        {isNumeric && stats ? (
                          <div className="mini-stats">
                            <span>Mean: {stats.mean?.toFixed(2)}</span>
                            <span>SD: {stats.std?.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-muted">
                            {stats?.unique_values || 0} unique values
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PremiumCard>
        
        {Object.keys(summaryData.missing_values).length > 0 && (
          <PremiumCard title="Data Quality Alerts" className="alerts-card">
            <ul className="alerts-list">
              {Object.entries(summaryData.missing_values).map(([col, count]) => (
                <li key={col} className="alert-item warning">
                  <span className="alert-dot"></span>
                  <strong>{col}</strong> is missing {count} values. They will be automatically imputed during pattern detection.
                </li>
              ))}
            </ul>
          </PremiumCard>
        )}
      </div>
    </div>
  );
};

export default DatasetOverview;
