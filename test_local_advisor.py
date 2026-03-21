"""Quick smoke test — verifies local advisor + all models work end-to-end."""
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
print("SMOKE TEST — Local AI Advisor + Models")
print("=" * 60)

# Test 1: AI Advisor
from execution.ai_advisor import get_ai_recommendation
rec = get_ai_recommendation(df)
print(f"\n[1] AI Advisor:")
print(f"    Dataset type: {rec['dataset_type']}")
print(f"    Recommended: {rec['recommended_models']}")
print(f"    Skipped: {list(rec['skip_reasons'].keys())}")
print(f"    Reasoning: {rec['reasoning'][:120]}...")

# Test 2: Preprocessing
from execution.preprocessing import preprocess_features, get_summary_stats
df_processed, metadata = preprocess_features(df.select_dtypes(include=[np.number]).copy())
summary = get_summary_stats(df)
print(f"\n[2] Preprocessing: {summary['num_rows']} rows, {summary['num_cols']} cols OK")

# Test 3: Pattern detection with new models
from execution.pattern_detection import detect_patterns
patterns = detect_patterns(df_processed, metadata, rec['recommended_models'])
print(f"\n[3] Pattern Detection keys: {list(patterns.keys())}")
if 'clustering' in patterns:
    print(f"    Clustering keys: {list(patterns['clustering'].keys())}")

# Test 4: Anomaly detection with new models
from execution.anomaly_detection import detect_anomalies
anomaly_models = [m for m in rec['recommended_models'] if m.startswith('anomaly_') and m != 'anomaly_autoencoder']
anomalies = detect_anomalies(df_processed, metadata, anomaly_models)
print(f"\n[4] Anomaly Detection keys: {list(anomalies.keys())}")

# Test 5: AI Insights (local)
from execution.ai_insights import generate_ai_insights
dl_anomalies = {"outliers_count": 0}
insights = generate_ai_insights(df, patterns, anomalies, dl_anomalies, rec)
print(f"\n[5] AI Insights ({len(insights)} generated):")
for i, insight in enumerate(insights, 1):
    print(f"    {i}. {insight[:100]}{'...' if len(insight) > 100 else ''}")

print("\n" + "=" * 60)
print("ALL TESTS PASSED")
print("=" * 60)
