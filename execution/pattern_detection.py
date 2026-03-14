import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from typing import Dict, Any, List

MAX_OUTPUT_POINTS = 2000

def _sample_indices(n_total: int, max_pts: int = MAX_OUTPUT_POINTS):
    if n_total <= max_pts:
        return list(range(n_total))
    rng = np.random.default_rng(42)
    return sorted(rng.choice(n_total, max_pts, replace=False).tolist())

def run_kmeans(df_scaled: pd.DataFrame, num_features: List[str]) -> Dict[str, Any]:
    if not num_features or df_scaled[num_features].empty:
        return {"kmeans_labels": []}
    X = df_scaled[num_features].values
    n_clusters = min(3, len(X))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
    labels = kmeans.fit_predict(X).tolist()
    idx = _sample_indices(len(labels))
    return {"kmeans_labels": [labels[i] for i in idx], "sample_indices": idx}

def run_dbscan(df_scaled: pd.DataFrame, num_features: List[str]) -> Dict[str, Any]:
    if not num_features or df_scaled[num_features].empty:
        return {"dbscan_labels": []}
    X = df_scaled[num_features].values
    dbscan = DBSCAN(eps=0.5, min_samples=min(5, len(X)))
    labels = dbscan.fit_predict(X).tolist()
    idx = _sample_indices(len(labels))
    return {"dbscan_labels": [labels[i] for i in idx], "sample_indices": idx}

def run_hierarchical(df_scaled: pd.DataFrame, num_features: List[str]) -> Dict[str, Any]:
    if not num_features or df_scaled[num_features].empty or len(df_scaled) < 2:
        return {"hierarchical_labels": []}
    X = df_scaled[num_features].values
    n_clusters = min(3, len(X))
    hc = AgglomerativeClustering(n_clusters=n_clusters, linkage="ward")
    labels = hc.fit_predict(X).tolist()
    idx = _sample_indices(len(labels))
    return {"hierarchical_labels": [labels[i] for i in idx], "sample_indices": idx}

def calculate_correlation(df: pd.DataFrame, num_features: List[str]) -> Dict[str, Any]:
    if not num_features or len(num_features) < 2:
        return {"features": [], "matrix": []}
    corr_matrix = df[num_features].corr().fillna(0)
    return {
        "features": num_features,
        "matrix": [[round(v, 4) for v in row] for row in corr_matrix.values.tolist()],
    }

def run_pca(df_scaled: pd.DataFrame, num_features: List[str], n_components: int = 2) -> Dict[str, Any]:
    if not num_features or len(num_features) < 2:
        return {"explained_variance_ratio": [], "projections": []}
    X = df_scaled[num_features].values
    target_components = min(n_components, len(num_features), len(X))
    if target_components < 1:
        return {"explained_variance_ratio": [], "projections": []}
    pca = PCA(n_components=target_components)
    projections = pca.fit_transform(X)
    idx = _sample_indices(len(projections))
    return {
        "explained_variance_ratio": [round(v, 4) for v in pca.explained_variance_ratio_.tolist()],
        "projections": [projections[i].tolist() for i in idx],
        "sample_indices": idx,
    }

def run_tsne(df_scaled: pd.DataFrame, num_features: List[str]) -> Dict[str, Any]:
    if not num_features or len(num_features) < 2 or len(df_scaled) < 10:
        return {"projections": []}
    X = df_scaled[num_features].values
    # t-SNE is slow — cap to 2000 rows for training
    cap = min(len(X), 2000)
    rng = np.random.default_rng(42)
    train_idx = sorted(rng.choice(len(X), cap, replace=False).tolist()) if len(X) > cap else list(range(len(X)))
    X_cap = X[train_idx]
    perplexity = min(30, max(5, len(X_cap) // 10))
    tsne = TSNE(n_components=2, random_state=42, perplexity=perplexity, n_iter=300)
    proj = tsne.fit_transform(X_cap)
    idx = _sample_indices(len(proj))
    return {
        "projections": [proj[i].tolist() for i in idx],
        "sample_indices": [train_idx[i] for i in idx],
    }

def detect_patterns(df_processed: pd.DataFrame, metadata: Dict[str, Any], models: List[str] = None) -> Dict[str, Any]:
    num_features = metadata.get("numerical_features", [])
    if models is None:
        models = ["clustering_kmeans", "clustering_hierarchical", "pca", "correlation"]

    result = {}
    clustering = {}
    if "clustering_kmeans" in models:
        clustering.update(run_kmeans(df_processed, num_features))
    if "clustering_hierarchical" in models:
        clustering.update(run_hierarchical(df_processed, num_features))
    if clustering:
        result["clustering"] = clustering

    if "correlation" in models:
        result["correlation"] = calculate_correlation(df_processed, num_features)

    if "pca" in models:
        result["pca"] = run_pca(df_processed, num_features)

    if "tsne" in models:
        result["tsne"] = run_tsne(df_processed, num_features)

    return result
