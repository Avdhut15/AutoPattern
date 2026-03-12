import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from typing import Dict, Any, Tuple, List

def run_clustering(df_scaled: pd.DataFrame, num_features: List[str]) -> Dict[str, List[int]]:
    """
    Runs KMeans and DBSCAN clustering on the scaled numerical features.
    """
    results = {}
    if not num_features or df_scaled[num_features].empty:
        return results
        
    X = df_scaled[num_features].values
    
    # Run KMeans (default 3 clusters)
    # Ensure n_samples >= n_clusters
    n_clusters = min(3, len(X))
    if n_clusters > 0:
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
        results['kmeans_labels'] = kmeans.fit_predict(X).tolist()
    else:
        results['kmeans_labels'] = []
        
    # Run DBSCAN
    if len(X) > 0:
        dbscan = DBSCAN(eps=0.5, min_samples=min(5, len(X)))
        results['dbscan_labels'] = dbscan.fit_predict(X).tolist()
    else:
        results['dbscan_labels'] = []
        
    return results

def calculate_correlation(df: pd.DataFrame, num_features: List[str]) -> Dict[str, Any]:
    """
    Calculates the Pearson correlation matrix for numerical features.
    Returns it in a format suitable for a heatmap front-end.
    """
    if not num_features or df[num_features].empty:
        return {"features": [], "matrix": []}
        
    corr_matrix = df[num_features].corr().fillna(0)
    
    return {
        "features": num_features,
        "matrix": corr_matrix.values.tolist()
    }

def run_pca(df_scaled: pd.DataFrame, num_features: List[str], n_components: int = 2) -> Dict[str, Any]:
    """
    Runs Principal Component Analysis to reduce dimensionality for 2D/3D visualization.
    """
    if not num_features or len(num_features) < 2 or df_scaled[num_features].empty:
        return {"explained_variance_ratio": [], "projections": []}
        
    X = df_scaled[num_features].values
    target_components = min(n_components, len(num_features), len(X))
    
    if target_components > 0:
        pca = PCA(n_components=target_components)
        projections = pca.fit_transform(X)
        
        return {
            "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
            "projections": projections.tolist()
        }
    return {"explained_variance_ratio": [], "projections": []}

def detect_patterns(df_processed: pd.DataFrame, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrates the pattern detection execution.
    """
    num_features = metadata.get('numerical_features', [])
    
    clustering_results = run_clustering(df_processed, num_features)
    correlation_results = calculate_correlation(df_processed, num_features)
    pca_results = run_pca(df_processed, num_features)
    
    return {
        "clustering": clustering_results,
        "correlation": correlation_results,
        "pca": pca_results
    }
