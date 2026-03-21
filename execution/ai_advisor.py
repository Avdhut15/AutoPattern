"""
Local AI Advisor — Smart rule-based model recommendation engine.
No API calls needed. Analyzes dataset metadata to recommend optimal models.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

from execution.models_registry import MODELS


def _analyze_dataset_profile(df: pd.DataFrame) -> Dict[str, Any]:
    """Build a detailed profile of the dataset for recommendation scoring."""
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    n_rows = len(df)
    n_cols = len(df.columns)
    n_num = len(num_cols)
    n_cat = len(cat_cols)

    profile = {
        "n_rows": n_rows,
        "n_cols": n_cols,
        "n_numeric": n_num,
        "n_categorical": n_cat,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "missing_pct": float(df.isnull().sum().sum() / max(n_rows * n_cols, 1) * 100),
    }

    # Numeric distribution stats
    if n_num >= 1:
        desc = df[num_cols].describe()
        # Check for high variance (outlier-prone)
        stds = desc.loc["std"].values
        means = desc.loc["mean"].values
        cvs = []
        for s, m in zip(stds, means):
            if abs(m) > 1e-8:
                cvs.append(abs(s / m))
            else:
                cvs.append(0.0)
        profile["avg_cv"] = float(np.mean(cvs))  # coefficient of variation
        profile["max_cv"] = float(np.max(cvs))

    if n_num >= 2:
        corr_matrix = df[num_cols].corr().fillna(0).values
        # Extract upper-triangle correlations
        upper = []
        for i in range(len(num_cols)):
            for j in range(i + 1, len(num_cols)):
                upper.append(abs(corr_matrix[i][j]))
        profile["avg_abs_corr"] = float(np.mean(upper)) if upper else 0.0
        profile["max_abs_corr"] = float(np.max(upper)) if upper else 0.0
        profile["high_corr_pairs"] = sum(1 for c in upper if c > 0.7)
    else:
        profile["avg_abs_corr"] = 0.0
        profile["max_abs_corr"] = 0.0
        profile["high_corr_pairs"] = 0

    # Categorical cardinality
    if n_cat >= 1:
        cardinalities = [df[c].nunique() for c in cat_cols]
        profile["avg_cardinality"] = float(np.mean(cardinalities))
        profile["max_cardinality"] = int(np.max(cardinalities))
    else:
        profile["avg_cardinality"] = 0
        profile["max_cardinality"] = 0

    return profile


def _classify_dataset(profile: Dict[str, Any]) -> str:
    """Classify dataset into a type category."""
    n_num = profile["n_numeric"]
    n_cat = profile["n_categorical"]
    n_cols = profile["n_cols"]

    if n_num >= 10:
        return "high_dimensional"
    if n_cat > n_num and n_cat >= 3:
        return "categorical_heavy"
    if n_num >= 2 and n_cat >= 1:
        return "tabular_mixed"
    if n_num >= 2:
        return "tabular_numeric"
    return "tabular_mixed"


def _score_model(model_id: str, model_info: Dict, profile: Dict[str, Any], dataset_type: str) -> tuple:
    """
    Score a model for this dataset. Returns (score, skip_reason).
    Higher score = stronger fit. Only models scoring >= RECOMMENDATION_THRESHOLD are recommended.
    """
    n_rows = profile["n_rows"]
    n_num = profile["n_numeric"]
    n_cat = profile["n_categorical"]

    # Hard constraints from registry
    min_num = model_info.get("min_numeric_cols", 0)
    min_rows = model_info.get("min_rows", 0)
    max_rows = model_info.get("max_rows", float("inf"))

    if n_num < min_num:
        return -1, f"Requires {min_num} numeric columns, dataset has {n_num}"
    if n_rows < min_rows:
        return -1, f"Requires at least {min_rows} rows, dataset has {n_rows}"
    if n_rows > max_rows:
        return -1, f"Max {max_rows} rows supported, dataset has {n_rows}"

    # Base score — models must earn their recommendation
    score = 20

    # Global penalty for categorical-heavy datasets on numeric models
    if dataset_type == "categorical_heavy" and model_info.get("min_numeric_cols", 0) >= 2:
        score -= 15  # Numeric models are less useful here

    # ── Pattern models scoring ──
    if model_id == "clustering_kmeans":
        if n_rows >= 100 and n_num >= 3:
            score += 35  # Strong fit: enough data and features
        elif n_rows >= 50 and n_num >= 2:
            score += 20  # Moderate fit
        else:
            score += 5   # Weak fit
        if profile["avg_abs_corr"] < 0.3:
            score += 5
        if profile.get("avg_cv", 0) > 0.5:
            score += 5  # Varied data → clusters more likely

    elif model_id == "clustering_hierarchical":
        if n_rows <= 500 and n_num >= 2:
            score += 30  # Best for small datasets
        elif n_rows <= 2000:
            score += 15
        else:
            score -= 10  # Too slow for large datasets
        if n_num >= 3:
            score += 5

    elif model_id == "clustering_dbscan":
        if profile.get("max_cv", 0) > 1.5:
            score += 30  # High variance → irregular clusters likely
        elif profile.get("max_cv", 0) > 0.8:
            score += 15
        else:
            score += 0   # Low variance → KMeans is probably better
        if n_rows >= 100:
            score += 10
        if n_num >= 3:
            score += 5

    elif model_id == "clustering_gmm":
        if n_num >= 4 and n_rows >= 100:
            score += 30  # GMM shines with more dimensions + data
        elif n_num >= 3 and n_rows >= 50:
            score += 15
        else:
            score += 0
        if profile.get("avg_abs_corr", 0) > 0.4:
            score += 10  # Correlated features → overlapping clusters

    elif model_id == "pca":
        if n_num >= 5:
            score += 35  # Many features → PCA very valuable
        elif n_num >= 3:
            score += 15
        else:
            score += 0   # Too few features for meaningful PCA
        if profile["high_corr_pairs"] > 0:
            score += 10  # Correlated → compression effective

    elif model_id == "tsne":
        if n_num >= 5 and n_rows >= 100:
            score += 30  # Good fit for high-dim visualization
        elif n_num >= 3 and n_rows >= 50:
            score += 10
        else:
            score += 0
        if n_rows > 5000:
            score -= 20  # Very slow

    elif model_id == "umap":
        if n_num >= 5 and n_rows >= 50:
            score += 35  # UMAP excels with higher dimensions
        elif n_num >= 3:
            score += 10
        else:
            score += 0
        if n_rows > 500:
            score += 5

    elif model_id == "correlation":
        if n_num >= 4:
            score += 40  # Many numeric features → correlation very insightful
        elif n_num >= 2:
            score += 25  # Still useful
        else:
            score += 0

    # ── Anomaly models scoring ──
    elif model_id == "anomaly_isolation_forest":
        score += 15  # Solid default anomaly detector
        if n_rows >= 100:
            score += 15
        if profile.get("max_cv", 0) > 1.0:
            score += 15  # High variance → likely outliers
        if n_num >= 3:
            score += 10

    elif model_id == "anomaly_lof":
        if n_rows <= 3000 and n_num >= 2:
            score += 25  # Good for smaller datasets
        elif n_rows <= 8000:
            score += 10
        else:
            score -= 10  # Too slow
        if profile.get("max_cv", 0) > 1.0:
            score += 10

    elif model_id == "anomaly_zscore":
        score += 20  # Fast, always applicable
        if n_num >= 2:
            score += 10
        if profile.get("max_cv", 0) > 2.0:
            score += 10  # High variance → z-score very useful

    elif model_id == "anomaly_autoencoder":
        if n_num >= 5 and n_rows >= 500:
            score += 35  # Complex data → autoencoder shines
        elif n_num >= 3 and n_rows >= 200:
            score += 15
        else:
            score -= 10  # Not enough data/features to justify cost
        if n_rows < 100:
            score -= 20

    elif model_id == "anomaly_one_class_svm":
        if n_num >= 3 and n_rows >= 50 and n_rows <= 3000:
            score += 25
        elif n_num >= 2:
            score += 10
        if n_rows > 5000:
            score -= 15

    elif model_id == "anomaly_elliptic_envelope":
        if n_num >= 3 and n_rows >= 50:
            score += 25
        elif n_num >= 2:
            score += 10
        if n_rows > 8000:
            score -= 10

    return score, ""


def _build_reasoning(dataset_type: str, profile: Dict[str, Any], recommended: List[str], skipped: Dict[str, str]) -> str:
    """Generate a human-readable reasoning string."""
    parts = []
    parts.append(f"Dataset has {profile['n_rows']} rows and {profile['n_cols']} columns "
                 f"({profile['n_numeric']} numeric, {profile['n_categorical']} categorical).")

    if dataset_type == "high_dimensional":
        parts.append("High-dimensional dataset — dimensionality reduction (PCA, UMAP) prioritized.")
    elif dataset_type == "categorical_heavy":
        parts.append("Dataset is categorical-heavy — numeric analysis models limited.")
    elif dataset_type == "tabular_numeric":
        parts.append("Purely numeric dataset — full suite of clustering and anomaly models applicable.")

    if profile.get("high_corr_pairs", 0) > 0:
        parts.append(f"Found {profile['high_corr_pairs']} highly correlated feature pairs.")

    if profile.get("missing_pct", 0) > 5:
        parts.append(f"Note: {profile['missing_pct']:.1f}% missing values detected.")

    n_rec = len(recommended)
    n_skip = len(skipped)
    parts.append(f"Recommended {n_rec} models, skipped {n_skip}.")

    return " ".join(parts)


AVAILABLE_MODELS = list(MODELS.keys())

RECOMMENDATION_THRESHOLD = 55  # Minimum score to be recommended


def get_ai_recommendation(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Local AI advisor: analyzes dataset metadata and returns recommended models.
    No API calls — pure rule-based intelligence, runs in <100ms.
    """
    try:
        profile = _analyze_dataset_profile(df)
        dataset_type = _classify_dataset(profile)

        recommended = []
        skip_reasons = {}

        for model_id, model_info in MODELS.items():
            score, reason = _score_model(model_id, model_info, profile, dataset_type)
            if score >= RECOMMENDATION_THRESHOLD:
                recommended.append(model_id)
            else:
                skip_reasons[model_id] = reason if reason else f"Score too low ({score})"

        # Ensure at least some models are recommended
        if not recommended:
            recommended = ["clustering_kmeans", "correlation", "anomaly_zscore"]
            recommended = [m for m in recommended if m in AVAILABLE_MODELS]

        reasoning = _build_reasoning(dataset_type, profile, recommended, skip_reasons)

        return {
            "dataset_type": dataset_type,
            "recommended_models": recommended,
            "skip_reasons": skip_reasons,
            "reasoning": reasoning,
        }
    except Exception as e:
        print(f"[ai_advisor] Local recommendation failed: {e}. Using defaults.")
        return {
            "dataset_type": "tabular_numeric",
            "recommended_models": ["clustering_kmeans", "pca", "correlation", "anomaly_isolation_forest", "anomaly_zscore"],
            "skip_reasons": {},
            "reasoning": "Advisor encountered an error. Running standard models.",
        }
