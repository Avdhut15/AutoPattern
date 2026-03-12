import pandas as pd
from typing import Dict, Any, List

def generate_insights(df: pd.DataFrame, patterns: Dict[str, Any], anomalies: Dict[str, Any], dl_anomalies: Dict[str, Any]) -> List[str]:
    """
    Generates human-readable insights based on the analysis results.
    """
    insights = []
    
    # Basic data insights
    insights.append(f"The dataset contains {len(df)} rows and {len(df.columns)} features.")
    
    # Correlation insights
    if "correlation" in patterns and patterns["correlation"].get("matrix"):
        matrix = patterns["correlation"]["matrix"]
        features = patterns["correlation"]["features"]
        
        high_correlations = []
        for i in range(len(features)):
            for j in range(i+1, len(features)):
                corr = matrix[i][j]
                if abs(corr) > 0.7:
                    high_correlations.append((features[i], features[j], corr))
                    
        for feat1, feat2, corr in high_correlations[:3]:
            direction = "positively" if corr > 0 else "negatively"
            insights.append(f"'{feat1}' strongly correlates {direction} with '{feat2}' (r={corr:.2f}).")
            
    # Clustering insights
    if "clustering" in patterns and "kmeans_labels" in patterns["clustering"]:
        labels = patterns["clustering"]["kmeans_labels"]
        if labels:
            n_clusters = len(set(labels))
            insights.append(f"{n_clusters} distinct clusters were detected using KMeans.")
            
    # DBSCAN insights
    if "clustering" in patterns and "dbscan_labels" in patterns["clustering"]:
        labels = patterns["clustering"]["dbscan_labels"]
        if labels:
            n_clusters = len(set([l for l in labels if l != -1]))
            noise = sum([1 for l in labels if l == -1])
            insights.append(f"DBSCAN identified {n_clusters} dense clusters and {noise} noise points.")
            
    # Anomaly insights (Isolation Forest)
    if "outliers_count" in anomalies:
        count = anomalies["outliers_count"]
        insights.append(f"Isolation Forest detected {count} statistical anomalies ({count/len(df)*100:.1f}% of data).")
        
    # Deep Learning Anomaly insights
    if "outliers_count" in dl_anomalies:
        count = dl_anomalies["outliers_count"]
        insights.append(f"The Deep Learning Autoencoder flagged {count} data points with high reconstruction error.")
        
    return insights
