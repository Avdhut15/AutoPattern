import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from typing import Dict, Any, List

MAX_FIT_ROWS = 3000
MAX_OUTPUT_POINTS = 2000

def _sample_rows(X: np.ndarray, max_rows: int = MAX_FIT_ROWS):
    if len(X) <= max_rows:
        return X, list(range(len(X)))
    rng = np.random.default_rng(42)
    idx = sorted(rng.choice(len(X), max_rows, replace=False).tolist())
    return X[idx], idx

def _sample_output(labels: list, scores: list, max_pts: int = MAX_OUTPUT_POINTS):
    if len(labels) <= max_pts:
        return labels, scores
    rng = np.random.default_rng(42)
    idx = sorted(rng.choice(len(labels), max_pts, replace=False).tolist())
    return [labels[i] for i in idx], [scores[i] for i in idx]

def run_isolation_forest(df_scaled: pd.DataFrame, num_features: List[str], contamination: float = 0.1) -> Dict[str, Any]:
    if not num_features or df_scaled[num_features].empty:
        return {"anomaly_scores": [], "anomaly_labels": [], "outliers_count": 0}
    X = df_scaled[num_features].values
    X_fit, _ = _sample_rows(X)
    model = IsolationForest(contamination=contamination, random_state=42, n_jobs=-1)
    model.fit(X_fit)
    predictions = model.predict(X)
    anomaly_labels = [1 if p == -1 else 0 for p in predictions]
    scores = model.score_samples(X).tolist()
    sampled_labels, sampled_scores = _sample_output(anomaly_labels, scores)
    return {
        "anomaly_scores": sampled_scores,
        "anomaly_labels": sampled_labels,
        "outliers_count": int(sum(anomaly_labels)),
    }

def run_lof(df_scaled: pd.DataFrame, num_features: List[str], contamination: float = 0.1) -> Dict[str, Any]:
    if not num_features or df_scaled[num_features].empty:
        return {"lof_scores": [], "lof_labels": [], "lof_outliers_count": 0}
    X = df_scaled[num_features].values
    X_fit, _ = _sample_rows(X)
    n_neighbors = min(20, len(X_fit) - 1)
    if n_neighbors < 1:
        return {"lof_scores": [], "lof_labels": [], "lof_outliers_count": 0}
    lof = LocalOutlierFactor(n_neighbors=n_neighbors, contamination=contamination, novelty=True)
    lof.fit(X_fit)
    predictions = lof.predict(X)
    lof_labels = [1 if p == -1 else 0 for p in predictions]
    scores = lof.score_samples(X).tolist()
    sampled_labels, sampled_scores = _sample_output(lof_labels, scores)
    return {
        "lof_scores": sampled_scores,
        "lof_labels": sampled_labels,
        "lof_outliers_count": int(sum(lof_labels)),
    }



def detect_anomalies(df_processed: pd.DataFrame, metadata: Dict[str, Any], models: List[str] = None) -> Dict[str, Any]:
    num_features = metadata.get("numerical_features", [])
    if models is None:
        models = ["anomaly_isolation_forest", "anomaly_lof"]

    result = {}
    if "anomaly_isolation_forest" in models:
        result.update(run_isolation_forest(df_processed, num_features))
    if "anomaly_lof" in models:
        result.update(run_lof(df_processed, num_features))

    # Ensure base keys always exist for backward compatibility
    if "anomaly_labels" not in result:
        result["anomaly_labels"] = []
        result["anomaly_scores"] = []
        result["outliers_count"] = 0
    return result
