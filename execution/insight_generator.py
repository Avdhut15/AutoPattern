import pandas as pd
from typing import Dict, Any, List

def generate_insights(context: Dict[str, Any]) -> List[str]:
    """
    Generates intelligent, dataset-specific insights using a deterministic rule-based engine.
    """
    insights = []
    
    problem_type = context.get("problem_type", "unknown")
    models_used = context.get("models_used", [])
    num_clusters = context.get("num_clusters", 0)
    cluster_sizes = context.get("cluster_sizes", [])
    correlation = context.get("correlation", {})
    anomalies = context.get("anomalies", 0)
    distribution = context.get("distribution", "unknown")
    n_rows = context.get("n_rows", 0)
    n_cols = context.get("n_cols", 0)

    # 1. Dataset Overview
    insights.append(f"The dataset contains {n_rows:,} rows and {n_cols} columns, classified as a {problem_type} problem.")

    # 2. Correlation Insights
    if correlation:
        strong_pairs = []
        for pair, val in correlation.items():
            if abs(val) > 0.7:
                strong_pairs.append((pair, val))
        
        if strong_pairs:
            strong_pairs.sort(key=lambda x: abs(x[1]), reverse=True)
            top_pair, top_val = strong_pairs[0]
            direction = "positive" if top_val > 0 else "negative"
            feats = top_pair.split("-")
            if len(feats) == 2:
                insights.append(f"There is a strong {direction} correlation ({top_val:.2f}) between {feats[0]} and {feats[1]}.")
            else:
                insights.append(f"Strong {direction} correlation detected: {top_pair} ({top_val:.2f}).")
                
            if len(strong_pairs) > 1:
                insights.append(f"A total of {len(strong_pairs)} highly correlated feature pairs were found, suggesting potential redundancy.")

    # 3. Clustering Insights
    if num_clusters > 1:
        insights.append(f"The dataset forms {num_clusters} distinct clusters, indicating natural groupings.")
        if cluster_sizes:
            largest = max(cluster_sizes)
            smallest = min(cluster_sizes)
            if largest > smallest * 5:
                insights.append(f"The clusters are highly imbalanced, with the largest group containing {largest} points and the smallest containing {smallest} points.")
            else:
                insights.append(f"The clusters are relatively balanced in size.")

    # 4. Anomaly Insights
    if anomalies > 0:
        pct = (anomalies / max(n_rows, 1)) * 100
        insights.append(f"A total of {anomalies} anomalies ({pct:.1f}%) were detected, suggesting unusual data patterns or outliers.")
    else:
        if any(m.startswith("anomaly_") for m in models_used):
            insights.append("No significant anomalies were detected within the normal boundaries of the data.")

    # 5. Distribution Insights
    if distribution and distribution != "unknown":
        direction = distribution.replace("_", " ")
        insights.append(f"Data distributions exhibit {direction} behavior, which may impact model performance if left unscaled.")

    # 6. Model Selection Info
    insights.append(f"Analysis was performed using the following selected models: {', '.join(models_used)}.")

    return insights
