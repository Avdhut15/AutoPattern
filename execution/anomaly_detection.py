import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.covariance import EllipticEnvelope
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
        "anomaly_scores": [round(float(s), 4) for s in sampled_scores],
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
        "lof_scores": [round(float(s), 4) for s in sampled_scores],
        "lof_labels": sampled_labels,
        "lof_outliers_count": int(sum(lof_labels)),
    }

def run_zscore(df_scaled: pd.DataFrame, num_features: List[str], threshold: float = 3.0) -> Dict[str, Any]:
    """Z-Score statistical outlier detection (|Z| > threshold on any numeric feature)."""
    if not num_features or df_scaled[num_features].empty:
        return {"zscore_scores": [], "zscore_labels": [], "zscore_outliers_count": 0}
    X = df_scaled[num_features].values
    # In standardized data, values are already Z-normalized; compute max deviation across features
    max_z = np.max(np.abs(X), axis=1)
    zscore_labels = [1 if z > threshold else 0 for z in max_z]
    scores = max_z.tolist()
    sampled_labels, sampled_scores = _sample_output(zscore_labels, scores)
    return {
        "zscore_scores": [round(float(s), 4) for s in sampled_scores],
        "zscore_labels": sampled_labels,
        "zscore_outliers_count": int(sum(zscore_labels)),
    }

def run_one_class_svm(df_scaled: pd.DataFrame, num_features: List[str], nu: float = 0.05) -> Dict[str, Any]:
    """One-Class SVM kernel anomaly detector."""
    if not num_features or df_scaled[num_features].empty:
        return {"ocsvm_scores": [], "ocsvm_labels": [], "ocsvm_outliers_count": 0}
    X = df_scaled[num_features].values
    X_fit, _ = _sample_rows(X)
    ocsvm = OneClassSVM(nu=nu, kernel="rbf", gamma="scale")
    ocsvm.fit(X_fit)
    predictions = ocsvm.predict(X)
    ocsvm_labels = [1 if p == -1 else 0 for p in predictions]
    scores = ocsvm.decision_function(X).tolist()
    sampled_labels, sampled_scores = _sample_output(ocsvm_labels, scores)
    return {
        "ocsvm_scores": [round(float(s), 4) for s in sampled_scores],
        "ocsvm_labels": sampled_labels,
        "ocsvm_outliers_count": int(sum(ocsvm_labels)),
    }

def run_elliptic_envelope(df_scaled: pd.DataFrame, num_features: List[str], contamination: float = 0.1) -> Dict[str, Any]:
    """Elliptic Envelope robust covariance (FastMCD) outlier detection."""
    if not num_features or df_scaled[num_features].empty:
        return {"elliptic_scores": [], "elliptic_labels": [], "elliptic_outliers_count": 0}
    X = df_scaled[num_features].values
    X_fit, _ = _sample_rows(X)
    # EllipticEnvelope requires n_samples > n_features
    if len(X_fit) <= len(num_features):
        return {"elliptic_scores": [], "elliptic_labels": [], "elliptic_outliers_count": 0}
    try:
        ee = EllipticEnvelope(contamination=contamination, random_state=42)
        ee.fit(X_fit)
        predictions = ee.predict(X)
        elliptic_labels = [1 if p == -1 else 0 for p in predictions]
        scores = ee.decision_function(X).tolist()
        sampled_labels, sampled_scores = _sample_output(elliptic_labels, scores)
        return {
            "elliptic_scores": [round(float(s), 4) for s in sampled_scores],
            "elliptic_labels": sampled_labels,
            "elliptic_outliers_count": int(sum(elliptic_labels)),
        }
    except Exception:
        return {"elliptic_scores": [], "elliptic_labels": [], "elliptic_outliers_count": 0}

def detect_anomalies(df_processed: pd.DataFrame, metadata: Dict[str, Any], models: List[str] = None) -> Dict[str, Any]:
    num_features = metadata.get("numerical_features", [])
    if models is None:
        models = [
            "anomaly_isolation_forest",
            "anomaly_lof",
            "anomaly_zscore",
            "anomaly_one_class_svm",
            "anomaly_elliptic_envelope"
        ]

    result = {}
    if "anomaly_isolation_forest" in models:
        result.update(run_isolation_forest(df_processed, num_features))
    if "anomaly_lof" in models:
        result.update(run_lof(df_processed, num_features))
    if "anomaly_zscore" in models:
        result.update(run_zscore(df_processed, num_features))
    if "anomaly_one_class_svm" in models:
        result.update(run_one_class_svm(df_processed, num_features))
    if "anomaly_elliptic_envelope" in models:
        result.update(run_elliptic_envelope(df_processed, num_features))

    # Ensure base keys always exist for backward compatibility
    if "anomaly_labels" not in result:
        result["anomaly_labels"] = []
        result["anomaly_scores"] = []
        result["outliers_count"] = 0
    return result
