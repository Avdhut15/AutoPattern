import React from 'react';
import './StateComponents.css';
import { Loader2, AlertCircle } from 'lucide-react';

export const LoadingState = ({ message = "Loading data..." }) => (
  <div className="state-container loading-state">
    <div className="spinner-container">
      <Loader2 className="spinner" size={40} />
    </div>
    <h3 className="state-message">{message}</h3>
  </div>
);

export const ErrorState = ({ title = "Error", error, onRetry }) => (
  <div className="state-container error-state">
    <div className="error-icon-container">
      <AlertCircle size={48} />
    </div>
    <h3 className="state-title">{title}</h3>
    <p className="state-message">{error}</p>
    {onRetry && (
      <button className="retry-btn" onClick={onRetry}>Try Again</button>
    )}
  </div>
);

export const EmptyState = ({ title, message, actionText, onAction }) => (
  <div className="state-container empty-state">
    <div className="empty-icon"></div>
    <h3 className="state-title">{title}</h3>
    <p className="state-message">{message}</p>
    {onAction && (
      <button className="primary-btn" onClick={onAction}>
        {actionText}
      </button>
    )}
  </div>
);
