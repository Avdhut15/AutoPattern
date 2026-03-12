import React from 'react';
import './PremiumCard.css';

const PremiumCard = ({ title, children, className = '' }) => {
  return (
    <div className={`premium-card glass-panel ${className}`}>
      {title && (
        <div className="premium-card-header">
          <h3 className="premium-card-title">{title}</h3>
        </div>
      )}
      <div className="premium-card-content">
        {children}
      </div>
    </div>
  );
};

export default PremiumCard;
