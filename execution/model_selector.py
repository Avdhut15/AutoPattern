from typing import Dict, Any, List

def select_models(problem_metadata: Dict[str, Any]) -> List[str]:
    """
    Select appropriate models based on dataset type and properties.
    """
    selected_models = []
    
    problem_type = problem_metadata.get("problem_type", "unsupervised")
    n_rows = problem_metadata.get("n_rows", 0)
    
    # IF unsupervised: KMeans, DBSCAN, Gaussian Mixture Model
    if problem_type == "unsupervised":
        selected_models.extend(["clustering_kmeans", "clustering_dbscan", "clustering_gmm"])
        if n_rows < 2000:
            selected_models.append("clustering_hierarchical")
            
    # IF supervised classification: Logistic Regression, Random Forest, SVM, KNN
    elif problem_type == "classification":
        selected_models.extend(["supervised_logistic_regression", "supervised_random_forest", "supervised_svm", "supervised_knn"])
        
    # IF regression: Linear Regression, Random Forest Regressor
    elif problem_type == "regression":
        selected_models.extend(["supervised_linear_regression", "supervised_random_forest_regressor"])

    # Always include correlation for any type
    selected_models.append("correlation")

    # IF anomaly detection needed (basically applicable to mostly numerical data)
    # The requirement: IF anomaly detection needed -> Isolation Forest, Local Outlier Factor, Autoencoder
    # Let's say it's needed for all unsupervised or numerical-heavy supervised
    dominant_type = problem_metadata.get("dominant_type", "numerical")
    if dominant_type == "numerical":
        selected_models.extend(["anomaly_isolation_forest", "anomaly_lof"])
        if problem_metadata.get("num_features", 0) >= 3 and n_rows >= 100:
            selected_models.append("anomaly_autoencoder")

    # IF high dimensional: apply PCA before models (we select the models to run dimensionality reduction)
    if problem_metadata.get("high_dimensional", False):
        selected_models.extend(["pca", "tsne", "umap"])
    elif problem_metadata.get("num_features", 0) >= 3:
        # even if not high dimensional, we can run them for visualization if >= 3 features
        selected_models.extend(["pca", "tsne"])
            
    # Filter duplicates
    return list(set(selected_models))
