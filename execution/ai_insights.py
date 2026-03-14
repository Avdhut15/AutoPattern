import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
import pandas as pd
from typing import Dict, Any, List

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", ".env"))
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))


def generate_ai_insights(
    df: pd.DataFrame,
    patterns: Dict[str, Any],
    anomalies: Dict[str, Any],
    dl_anomalies: Dict[str, Any],
    recommendation: Dict[str, Any],
) -> List[str]:
    """Use Gemini to generate detailed, dataset-specific insights."""
    try:
        num_cols = df.select_dtypes(include=["number"]).columns.tolist()
        cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        # Build a compact summary of results for the prompt
        clustering_summary = {}
        if "clustering" in patterns:
            cl = patterns["clustering"]
            if "kmeans_labels" in cl and cl["kmeans_labels"]:
                from collections import Counter
                counts = Counter(cl["kmeans_labels"])
                clustering_summary["kmeans_clusters"] = dict(counts)
            if "dbscan_labels" in cl and cl["dbscan_labels"]:
                from collections import Counter
                counts = Counter(cl["dbscan_labels"])
                clustering_summary["dbscan_clusters"] = dict(counts)

        correlation_summary = {}
        if "correlation" in patterns:
            corr = patterns["correlation"]
            features = corr.get("features", [])
            matrix = corr.get("matrix", [])
            high_corrs = []
            for i in range(len(features)):
                for j in range(i + 1, len(features)):
                    val = matrix[i][j] if matrix else 0
                    if abs(val) > 0.6:
                        high_corrs.append({"feat1": features[i], "feat2": features[j], "corr": round(val, 3)})
            correlation_summary["high_correlations"] = high_corrs[:5]

        anomaly_summary = {
            "isolation_forest_outliers": anomalies.get("outliers_count", 0),
            "autoencoder_outliers": dl_anomalies.get("outliers_count", 0),
            "total_rows": len(df),
        }
        if "lof_outliers_count" in anomalies:
            anomaly_summary["lof_outliers"] = anomalies["lof_outliers_count"]
        if "zscore_outliers_count" in anomalies:
            anomaly_summary["zscore_outliers"] = anomalies["zscore_outliers_count"]

        prompt = f"""You are an expert data scientist providing insights to a non-technical user about their dataset.

Dataset: {len(df)} rows, {len(df.columns)} columns
Numeric features: {num_cols}
Categorical features: {cat_cols}
Dataset type identified: {recommendation.get('dataset_type', 'unknown')}
Models used: {recommendation.get('recommended_models', [])}
AI Reasoning: {recommendation.get('reasoning', '')}

Analysis Results:
- Clustering: {json.dumps(clustering_summary)}
- Correlations: {json.dumps(correlation_summary)}
- Anomalies: {json.dumps(anomaly_summary)}

Write 6-8 specific, actionable insights. Rules:
- Reference actual column names and numbers from the data above
- Use plain English, no jargon
- Each insight should be one clear sentence
- Cover: data quality, patterns found, anomalies, correlations, recommendations
- Do NOT use generic phrases like "the dataset contains interesting patterns"
- Format: return a JSON array of strings only. No markdown, no extra text.

Example format: ["Insight 1 here.", "Insight 2 here.", ...]"""

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        insights = json.loads(text.strip())
        if isinstance(insights, list):
            return [str(i) for i in insights]
        return _fallback_insights(df, patterns, anomalies, dl_anomalies)
    except Exception as e:
        print(f"[ai_insights] Gemini call failed: {e}. Using fallback.")
        return _fallback_insights(df, patterns, anomalies, dl_anomalies)


def _fallback_insights(df, patterns, anomalies, dl_anomalies) -> List[str]:
    """Rule-based fallback if Gemini is unavailable."""
    insights = [f"The dataset contains {len(df)} rows and {len(df.columns)} features."]
    if "correlation" in patterns:
        corr = patterns["correlation"]
        features = corr.get("features", [])
        matrix = corr.get("matrix", [])
        for i in range(len(features)):
            for j in range(i + 1, len(features)):
                val = matrix[i][j] if matrix else 0
                if abs(val) > 0.7:
                    direction = "positively" if val > 0 else "negatively"
                    insights.append(f"'{features[i]}' strongly correlates {direction} with '{features[j]}' (r={val:.2f}).")
    if "clustering" in patterns and "kmeans_labels" in patterns["clustering"]:
        labels = patterns["clustering"]["kmeans_labels"]
        if labels:
            insights.append(f"{len(set(labels))} distinct clusters were detected using KMeans.")
    if "outliers_count" in anomalies:
        count = anomalies["outliers_count"]
        insights.append(f"Isolation Forest detected {count} anomalies ({count/len(df)*100:.1f}% of data).")
    if "outliers_count" in dl_anomalies:
        count = dl_anomalies["outliers_count"]
        insights.append(f"Deep Learning Autoencoder flagged {count} data points with high reconstruction error.")
    return insights
