"""
Central model registry for AutoPattern.
Maps model IDs to their execution functions and metadata.
"""

MODELS = {
    # ── Pattern Detection Models ──
    "clustering_kmeans": {
        "name": "KMeans Clustering",
        "category": "patterns",
        "description": "Partitions data into k clusters based on feature similarity",
        "min_numeric_cols": 2,
        "min_rows": 30,
    },
    "clustering_hierarchical": {
        "name": "Hierarchical Clustering",
        "category": "patterns",
        "description": "Agglomerative clustering using Ward linkage",
        "min_numeric_cols": 2,
        "min_rows": 2,
        "max_rows": 5000,
    },
    "clustering_dbscan": {
        "name": "DBSCAN Clustering",
        "category": "patterns",
        "description": "Density-based clustering — finds arbitrarily shaped clusters and noise",
        "min_numeric_cols": 2,
        "min_rows": 20,
    },
    "clustering_gmm": {
        "name": "Gaussian Mixture Model",
        "category": "patterns",
        "description": "Probabilistic soft clustering — models data as mixture of Gaussians",
        "min_numeric_cols": 2,
        "min_rows": 30,
    },
    "pca": {
        "name": "Principal Component Analysis",
        "category": "patterns",
        "description": "Linear dimensionality reduction to 2D for visualization",
        "min_numeric_cols": 3,
        "min_rows": 2,
    },
    "tsne": {
        "name": "t-SNE",
        "category": "patterns",
        "description": "Non-linear dimensionality reduction for structure discovery",
        "min_numeric_cols": 3,
        "min_rows": 50,
    },
    "umap": {
        "name": "UMAP",
        "category": "patterns",
        "description": "Uniform Manifold Approximation — fast non-linear dimensionality reduction",
        "min_numeric_cols": 3,
        "min_rows": 20,
    },
    "correlation": {
        "name": "Correlation Matrix",
        "category": "patterns",
        "description": "Pairwise Pearson correlation between numeric features",
        "min_numeric_cols": 2,
        "min_rows": 2,
    },

    # ── Anomaly Detection Models ──
    "anomaly_isolation_forest": {
        "name": "Isolation Forest",
        "category": "anomalies",
        "description": "Tree-based anomaly detection — isolates outliers by random partitioning",
        "min_numeric_cols": 2,
        "min_rows": 10,
    },
    "anomaly_lof": {
        "name": "Local Outlier Factor",
        "category": "anomalies",
        "description": "Density-based outlier detection — compares local density to neighbors",
        "min_numeric_cols": 2,
        "min_rows": 10,
        "max_rows": 10000,
    },
    "anomaly_zscore": {
        "name": "Z-Score Detection",
        "category": "anomalies",
        "description": "Flags points where any feature exceeds ±3 standard deviations",
        "min_numeric_cols": 1,
        "min_rows": 10,
    },
    "anomaly_one_class_svm": {
        "name": "One-Class SVM",
        "category": "anomalies",
        "description": "Support vector boundary — learns a decision boundary around normal data",
        "min_numeric_cols": 2,
        "min_rows": 20,
        "max_rows": 5000,
    },
    "anomaly_elliptic_envelope": {
        "name": "Elliptic Envelope",
        "category": "anomalies",
        "description": "Mahalanobis distance-based — assumes Gaussian distribution for inliers",
        "min_numeric_cols": 2,
        "min_rows": 20,
        "max_rows": 10000,
    },
    "anomaly_autoencoder": {
        "name": "Deep Learning Autoencoder",
        "category": "anomalies",
        "description": "Neural network reconstruction error — catches complex structural anomalies",
        "min_numeric_cols": 2,
        "min_rows": 100,
    },
}


def get_pattern_models():
    """Return IDs of all pattern detection models."""
    return [k for k, v in MODELS.items() if v["category"] == "patterns"]


def get_anomaly_models():
    """Return IDs of all anomaly detection models."""
    return [k for k, v in MODELS.items() if v["category"] == "anomalies"]


def get_model_info(model_id: str):
    """Return metadata dict for a model, or None if not found."""
    return MODELS.get(model_id)
