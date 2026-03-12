import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List

def run_isolation_forest(df_scaled: pd.DataFrame, num_features: List[str], contamination: float = 0.1) -> Dict[str, Any]:
    """
    Runs Isolation Forest algorithm for anomaly detection.
    """
    if not num_features or df_scaled[num_features].empty:
        return {"anomaly_scores": [], "anomaly_labels": [], "outliers_count": 0}
        
    X = df_scaled[num_features].values
    
    if len(X) > 0:
        # Create and fit the model
        model = IsolationForest(contamination=contamination, random_state=42)
        
        # Predict: 1 for inliers, -1 for outliers
        # Convert to: 0 for normal, 1 for anomaly
        predictions = model.fit_predict(X)
        anomaly_labels = [1 if p == -1 else 0 for p in predictions]
        
        # Anomaly scores: lower means more anomalous
        scores = model.score_samples(X).tolist()
        
        return {
            "anomaly_scores": scores,
            "anomaly_labels": anomaly_labels,
            "outliers_count": sum(anomaly_labels)
        }
        
    return {"anomaly_scores": [], "anomaly_labels": [], "outliers_count": 0}

def detect_anomalies(df_processed: pd.DataFrame, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrates the anomaly detection execution.
    """
    num_features = metadata.get('numerical_features', [])
    
    return run_isolation_forest(df_processed, num_features)
