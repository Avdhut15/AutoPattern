import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from typing import Dict, Any, List

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", ".env"))
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

AVAILABLE_MODELS = [
    "clustering_kmeans",
    "clustering_hierarchical",
    "pca",
    "tsne",
    "correlation",
    "anomaly_isolation_forest",
    "anomaly_lof",
    "anomaly_zscore",
    "anomaly_autoencoder",
]

def build_metadata_prompt(df: pd.DataFrame) -> str:
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    sample = df.head(5).to_dict(orient="records")
    # Convert numpy types for JSON safety
    def safe(v):
        if isinstance(v, (np.integer,)): return int(v)
        if isinstance(v, (np.floating,)): return float(v)
        return v
    sample = [{k: safe(v) for k, v in row.items()} for row in sample]

    basic_stats = {}
    if num_cols:
        desc = df[num_cols].describe().to_dict()
        basic_stats = {col: {k: round(float(v), 3) for k, v in vals.items() if pd.notnull(v)}
                       for col, vals in desc.items()}

    prompt = f"""You are an expert data scientist. Analyze the following dataset metadata and decide which ML analysis models to run.

Dataset Info:
- Rows: {len(df)}, Columns: {len(df.columns)}
- Numeric columns ({len(num_cols)}): {num_cols}
- Categorical columns ({len(cat_cols)}): {cat_cols}
- Sample rows (first 5): {json.dumps(sample, default=str)}
- Basic stats: {json.dumps(basic_stats)}

Available models: {AVAILABLE_MODELS}

Rules:
- clustering_kmeans: only if >= 2 numeric columns and >= 30 rows
- clustering_hierarchical: only if >= 2 numeric columns and <= 5000 rows
- pca: only if >= 3 numeric columns
- tsne: only if >= 3 numeric columns and >= 50 rows
- correlation: only if >= 2 numeric columns
- anomaly_isolation_forest: always useful if >= 2 numeric columns
- anomaly_lof: only if >= 2 numeric columns and <= 10000 rows
- anomaly_zscore: only if >= 1 numeric column
- anomaly_autoencoder: only if >= 2 numeric columns and >= 100 rows (slow, deep learning)

Return ONLY valid JSON (no markdown, no extra text):
{{
  "dataset_type": "<one of: tabular_numeric | tabular_mixed | categorical_heavy | time_series | high_dimensional>",
  "recommended_models": ["model1", "model2"],
  "skip_reasons": {{"model_name": "reason for skipping", ...}},
  "reasoning": "2-3 sentence explanation of the dataset and why these models were chosen"
}}"""
    return prompt


def get_ai_recommendation(df: pd.DataFrame) -> Dict[str, Any]:
    """Call Gemini to get model recommendations for this dataset."""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = build_metadata_prompt(df)
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        # Validate required keys
        if "recommended_models" not in result:
            raise ValueError("Missing recommended_models")
        # Only keep valid model names
        result["recommended_models"] = [m for m in result["recommended_models"] if m in AVAILABLE_MODELS]
        return result
    except Exception as e:
        print(f"[ai_advisor] Gemini call failed: {e}. Falling back to defaults.")
        return {
            "dataset_type": "tabular_numeric",
            "recommended_models": ["clustering_kmeans", "pca", "correlation", "anomaly_isolation_forest", "anomaly_zscore"],
            "skip_reasons": {},
            "reasoning": "AI advisor unavailable. Running standard models.",
        }
