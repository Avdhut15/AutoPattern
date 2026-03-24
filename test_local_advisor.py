"""Quick smoke test — verifies hybrid model selector + insights work end-to-end."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
import numpy as np

# Create test data
df = pd.DataFrame({
    'A': np.random.randn(200),
    'B': np.random.randn(200) * 5 + 10,
    'C': np.random.choice(['x', 'y', 'z'], 200),
    'D': np.random.randint(0, 100, 200),
    'E': np.random.randn(200) * 2,
})

print("=" * 60)
print("SMOKE TEST — Hybrid Model Selector + Insights")
print("=" * 60)

# Test 1: LLM availability
from execution.local_llm import is_available
llm_ok = is_available()
print(f"\n[0] Ollama available: {llm_ok}")
if not llm_ok:
    print("    (LLM features will use rule-based fallback)")

# Test 2: Problem detection
from execution.problem_detector import detect_problem_type
from execution.preprocessing import preprocess_features, get_summary_stats
df_processed, metadata = preprocess_features(df.select_dtypes(include=[np.number]).copy())
problem = detect_problem_type(df, metadata)
print(f"\n[1] Problem Detection:")
print(f"    Type: {problem['problem_type']}, Features: {problem['num_features']}, Rows: {problem['n_rows']}")

# Test 3: Hybrid model selection
from execution.model_selector import select_models
selected, reasoning = select_models(problem)
print(f"\n[2] Hybrid Model Selection:")
print(f"    Selected ({len(selected)}): {selected}")
if reasoning:
    print(f"    LLM Reasoning: {reasoning[:150]}...")
else:
    print(f"    LLM Reasoning: (none — rule-based fallback)")

# Test 4: Preprocessing
summary = get_summary_stats(df)
print(f"\n[3] Preprocessing: {summary['num_rows']} rows, {summary['num_cols']} cols OK")

# Test 5: Pattern detection
from execution.pattern_detection import detect_patterns
pattern_models = [m for m in selected if not m.startswith("anomaly_") and not m.startswith("supervised_")]
patterns = detect_patterns(df_processed, metadata, pattern_models)
print(f"\n[4] Pattern Detection keys: {list(patterns.keys())}")
if 'clustering' in patterns:
    print(f"    Clustering keys: {list(patterns['clustering'].keys())}")

# Test 6: Anomaly detection
from execution.anomaly_detection import detect_anomalies
anomaly_models = [m for m in selected if m.startswith('anomaly_') and m != 'anomaly_autoencoder']
anomalies = detect_anomalies(df_processed, metadata, anomaly_models)
print(f"\n[5] Anomaly Detection keys: {list(anomalies.keys())}")

# Test 7: Insight generation (hybrid)
from execution.insight_generator import generate_insights
dl_anomalies = {"outliers_count": 0}
context = {
    "problem_type": problem["problem_type"],
    "models_used": selected,
    "n_rows": problem["n_rows"],
    "n_cols": problem["num_features"],
    "distribution": "unknown",
    "anomalies": sum([
        anomalies.get("outliers_count", 0),
        anomalies.get("lof_outliers_count", 0),
        dl_anomalies.get("outliers_count", 0)
    ])
}
if "clustering" in patterns and "kmeans_labels" in patterns["clustering"]:
    labels = patterns["clustering"]["kmeans_labels"]
    context["num_clusters"] = len(set(labels))
    context["cluster_sizes"] = [labels.count(i) for i in set(labels)]

if "correlation" in patterns and patterns["correlation"].get("matrix"):
    matrix = patterns["correlation"]["matrix"]
    features = patterns["correlation"]["features"]
    corrs = {}
    for i in range(len(features)):
        for j in range(i+1, len(features)):
            corrs[f"{features[i]}-{features[j]}"] = matrix[i][j]
    context["correlation"] = corrs

insights = generate_insights(context)
print(f"\n[6] Insights ({len(insights)} generated):")
for i, insight in enumerate(insights, 1):
    print(f"    {i}. {insight[:120]}{'...' if len(insight) > 120 else ''}")

print("\n" + "=" * 60)
print("ALL TESTS PASSED")
print("=" * 60)
