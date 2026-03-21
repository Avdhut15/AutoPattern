"""Test that advisor gives DIFFERENT recommendations for different datasets."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
import numpy as np
from execution.ai_advisor import get_ai_recommendation

print("=" * 60)
print("TEST: Advisor selectivity for different datasets")
print("=" * 60)

# Dataset 1: Small, mostly categorical
df1 = pd.DataFrame({
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] * 6,
    'City': ['NY', 'LA', 'SF', 'NY', 'LA'] * 6,
    'Color': ['red', 'blue', 'green', 'red', 'blue'] * 6,
    'Score': np.random.randint(0, 100, 30),
})
rec1 = get_ai_recommendation(df1)
print(f"\n[1] Categorical-heavy (30 rows, 1 numeric, 3 categorical)")
print(f"    Type: {rec1['dataset_type']}")
print(f"    Recommended ({len(rec1['recommended_models'])}): {rec1['recommended_models']}")
print(f"    Skipped ({len(rec1['skip_reasons'])}): {list(rec1['skip_reasons'].keys())}")

# Dataset 2: Numeric with many features
df2 = pd.DataFrame({
    'A': np.random.randn(500),
    'B': np.random.randn(500) * 5,
    'C': np.random.randn(500) * 2,
    'D': np.random.randn(500),
    'E': np.random.randn(500) * 3,
    'F': np.random.randn(500),
})
rec2 = get_ai_recommendation(df2)
print(f"\n[2] High-dimensional numeric (500 rows, 6 numeric)")
print(f"    Type: {rec2['dataset_type']}")
print(f"    Recommended ({len(rec2['recommended_models'])}): {rec2['recommended_models']}")
print(f"    Skipped ({len(rec2['skip_reasons'])}): {list(rec2['skip_reasons'].keys())}")

# Dataset 3: Small simple dataset
df3 = pd.DataFrame({
    'X': np.random.randn(25),
    'Y': np.random.randn(25),
})
rec3 = get_ai_recommendation(df3)
print(f"\n[3] Tiny numeric (25 rows, 2 numeric)")
print(f"    Type: {rec3['dataset_type']}")
print(f"    Recommended ({len(rec3['recommended_models'])}): {rec3['recommended_models']}")
print(f"    Skipped ({len(rec3['skip_reasons'])}): {list(rec3['skip_reasons'].keys())}")

# Dataset 4: Medium mixed
df4 = pd.DataFrame({
    'A': np.random.randn(150),
    'B': np.random.randn(150) * 5 + 10,
    'C': np.random.choice(['x', 'y', 'z'], 150),
    'D': np.random.randint(0, 100, 150),
})
rec4 = get_ai_recommendation(df4)
print(f"\n[4] Medium mixed (150 rows, 3 numeric, 1 categorical)")
print(f"    Type: {rec4['dataset_type']}")
print(f"    Recommended ({len(rec4['recommended_models'])}): {rec4['recommended_models']}")
print(f"    Skipped ({len(rec4['skip_reasons'])}): {list(rec4['skip_reasons'].keys())}")

print(f"\n{'=' * 60}")
r_counts = [len(rec1['recommended_models']), len(rec2['recommended_models']),
            len(rec3['recommended_models']), len(rec4['recommended_models'])]
if len(set(r_counts)) >= 2:
    print("PASS: Advisor gives different recommendations for different datasets!")
else:
    print("FAIL: All datasets got the same number of recommendations.")
print(f"{'=' * 60}")
