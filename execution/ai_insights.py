"""
Local AI Insights Generator — rule-based, no API calls.
Produces 6-8 specific, actionable insights from analysis results.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List


def generate_ai_insights(
    df: pd.DataFrame,
    patterns: Dict[str, Any],
    anomalies: Dict[str, Any],
    dl_anomalies: Dict[str, Any],
    recommendation: Dict[str, Any],
) -> List[str]:
    """
    Generate detailed, dataset-specific insights using rule-based analysis.
    No API calls — instant results.
    """
    insights = []
    n_rows = len(df)
    n_cols = len(df.columns)
    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # ── 1. Dataset overview ──
    dataset_type = recommendation.get("dataset_type", "unknown")
    type_labels = {
        "tabular_numeric": "purely numeric",
        "tabular_mixed": "mixed numeric and categorical",
        "categorical_heavy": "predominantly categorical",
        "high_dimensional": "high-dimensional",
    }
    type_desc = type_labels.get(dataset_type, dataset_type)
    insights.append(
        f"This is a {type_desc} dataset with {n_rows:,} rows and {n_cols} columns "
        f"({len(num_cols)} numeric, {len(cat_cols)} categorical)."
    )

    # ── 2. Data quality ──
    missing_total = int(df.isnull().sum().sum())
    if missing_total > 0:
        missing_pct = missing_total / (n_rows * n_cols) * 100
        worst_col = df.isnull().sum().idxmax()
        worst_count = int(df.isnull().sum().max())
        insights.append(
            f"Data quality: {missing_pct:.1f}% missing values detected. "
            f"Column '{worst_col}' has the most gaps ({worst_count} missing entries, "
            f"{worst_count / n_rows * 100:.1f}% of rows)."
        )
    else:
        insights.append("Data quality is excellent — no missing values detected in any column.")

    # ── 3. Correlation insights ──
    if "correlation" in patterns:
        corr = patterns["correlation"]
        features = corr.get("features", [])
        matrix = corr.get("matrix", [])
        high_corrs = []
        for i in range(len(features)):
            for j in range(i + 1, len(features)):
                val = matrix[i][j] if matrix else 0
                if abs(val) > 0.7:
                    high_corrs.append((features[i], features[j], val))

        if high_corrs:
            high_corrs.sort(key=lambda x: abs(x[2]), reverse=True)
            top = high_corrs[0]
            direction = "positively" if top[2] > 0 else "negatively"
            insights.append(
                f"Strong correlation found: '{top[0]}' and '{top[1]}' are {direction} correlated "
                f"(r={top[2]:.2f}). {len(high_corrs)} highly correlated feature pair(s) total — "
                f"consider dimensionality reduction or feature selection."
            )
        else:
            insights.append(
                "No strong correlations (|r| > 0.7) found between features — "
                "each variable carries relatively independent information."
            )

    # ── 4. Clustering insights ──
    clustering = patterns.get("clustering", {})
    if "kmeans_labels" in clustering and clustering["kmeans_labels"]:
        labels = clustering["kmeans_labels"]
        from collections import Counter
        counts = Counter(labels)
        n_clusters = len(counts)
        sizes = sorted(counts.values(), reverse=True)
        largest_pct = sizes[0] / len(labels) * 100
        smallest_pct = sizes[-1] / len(labels) * 100
        balance = "well-balanced" if (largest_pct - smallest_pct) < 20 else "imbalanced"
        insights.append(
            f"KMeans identified {n_clusters} clusters. The clusters are {balance} "
            f"(largest: {largest_pct:.0f}%, smallest: {smallest_pct:.0f}% of data). "
            f"This suggests {'natural groupings' if balance == 'well-balanced' else 'a dominant group with smaller segments'}."
        )

    if "hierarchical_labels" in clustering and clustering["hierarchical_labels"]:
        h_labels = clustering["hierarchical_labels"]
        from collections import Counter
        h_counts = Counter(h_labels)
        if len(h_counts) > 1:
            insights.append(
                f"Hierarchical clustering confirms {len(h_counts)} groups with a tree-based approach, "
                f"providing a complementary view to KMeans."
            )

    if "dbscan_labels" in clustering and clustering["dbscan_labels"]:
        d_labels = clustering["dbscan_labels"]
        from collections import Counter
        d_counts = Counter(d_labels)
        n_clusters_db = len([k for k in d_counts if k != -1])
        noise = d_counts.get(-1, 0)
        insights.append(
            f"DBSCAN found {n_clusters_db} density-based clusters and classified "
            f"{noise} points as noise ({noise / max(len(d_labels), 1) * 100:.1f}% of sampled data)."
        )

    if "gmm_labels" in clustering and clustering["gmm_labels"]:
        g_labels = clustering["gmm_labels"]
        from collections import Counter
        g_counts = Counter(g_labels)
        insights.append(
            f"Gaussian Mixture Model identified {len(g_counts)} probabilistic clusters, "
            f"suggesting overlapping group boundaries in the data."
        )

    # ── 5. Anomaly detection insights ──
    anomaly_insights = []
    if "outliers_count" in anomalies:
        count = anomalies["outliers_count"]
        pct = count / n_rows * 100
        anomaly_insights.append(f"Isolation Forest: {count} anomalies ({pct:.1f}%)")

    if "lof_outliers_count" in anomalies:
        count = anomalies["lof_outliers_count"]
        pct = count / n_rows * 100
        anomaly_insights.append(f"LOF: {count} density outliers ({pct:.1f}%)")

    if "zscore_outliers_count" in anomalies:
        count = anomalies["zscore_outliers_count"]
        pct = count / n_rows * 100
        anomaly_insights.append(f"Z-Score: {count} statistical outliers ({pct:.1f}%)")

    if "svm_outliers_count" in anomalies:
        count = anomalies["svm_outliers_count"]
        pct = count / n_rows * 100
        anomaly_insights.append(f"One-Class SVM: {count} boundary outliers ({pct:.1f}%)")

    if "envelope_outliers_count" in anomalies:
        count = anomalies["envelope_outliers_count"]
        pct = count / n_rows * 100
        anomaly_insights.append(f"Elliptic Envelope: {count} Mahalanobis outliers ({pct:.1f}%)")

    if anomaly_insights:
        insights.append("Anomaly detection summary — " + "; ".join(anomaly_insights) + ".")

    if "outliers_count" in dl_anomalies:
        count = dl_anomalies["outliers_count"]
        if count > 0:
            pct = count / n_rows * 100
            insights.append(
                f"Deep Learning Autoencoder flagged {count} data points ({pct:.1f}%) with high "
                f"reconstruction error — these may have complex structural anomalies missed by simpler methods."
            )

    # ── 6. Dimensionality reduction insights ──
    if "pca" in patterns:
        pca_data = patterns["pca"]
        evr = pca_data.get("explained_variance_ratio", [])
        if evr:
            total_var = sum(evr) * 100
            insights.append(
                f"PCA: the first {len(evr)} components explain {total_var:.1f}% of total variance"
                + (". The data is highly compressible." if total_var > 80 else
                   ". Significant variance remains in higher dimensions." if total_var < 50 else
                   ".")
            )

    # ── 7. Recommendations ──
    models_used = recommendation.get("recommended_models", [])
    skipped = recommendation.get("skip_reasons", {})
    if skipped:
        skip_list = list(skipped.keys())[:3]
        insights.append(
            f"Models skipped for this dataset: {', '.join(skip_list)} — "
            f"dataset characteristics did not meet their requirements."
        )

    # Ensure we have at least 6 insights
    if len(insights) < 6:
        if num_cols:
            # Add distribution insight
            for col in num_cols[:2]:
                std = float(df[col].std())
                mean = float(df[col].mean())
                skew = float(df[col].skew()) if hasattr(df[col], 'skew') else 0
                if abs(skew) > 1:
                    direction = "right" if skew > 0 else "left"
                    insights.append(
                        f"Column '{col}' is notably {direction}-skewed (skewness={skew:.2f}), "
                        f"which may affect model performance."
                    )
                if len(insights) >= 8:
                    break

    return insights[:8]
