"""Test that advisor gives DIFFERENT recommendations for different datasets."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
import numpy as np
from execution.preprocessing import preprocess_features
from execution.problem_detector import detect_problem_type
from execution.model_selector import select_models

print("=" * 60)
print("TEST: Advisor selectivity for different datasets")
print("=" * 60)

def analyze(df, label):
    df_processed, metadata = preprocess_features(df)
    problem = detect_problem_type(df, metadata)
    selected, reasoning = select_models(problem)
    print(f"\n[{label}]")
    print(f"    Type: {problem['problem_type']}")
    print(f"    Recommended ({len(selected)}): {selected}")
    if reasoning:
        print(f"    LLM Reasoning: {reasoning[:120]}...")
    else:
        print(f"    LLM Reasoning: (fallback to rules — Ollama not available)")
    return selected

# Dataset 1: Small, mostly categorical
df1 = pd.DataFrame({
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] * 6,
    'City': ['NY', 'LA', 'SF', 'NY', 'LA'] * 6,
    'Color': ['red', 'blue', 'green', 'red', 'blue'] * 6,
    'Score': np.random.randint(0, 100, 30),
})
rec1 = analyze(df1, "1 - Categorical-heavy (30 rows, 1 numeric, 3 categorical)")

# Dataset 2: Numeric with many features
df2 = pd.DataFrame({
    'A': np.random.randn(500),
    'B': np.random.randn(500) * 5,
    'C': np.random.randn(500) * 2,
    'D': np.random.randn(500),
    'E': np.random.randn(500) * 3,
    'F': np.random.randn(500),
})
rec2 = analyze(df2, "2 - High-dimensional numeric (500 rows, 6 numeric)")

# Dataset 3: Small simple dataset
df3 = pd.DataFrame({
    'X': np.random.randn(25),
    'Y': np.random.randn(25),
})
rec3 = analyze(df3, "3 - Tiny numeric (25 rows, 2 numeric)")

# Dataset 4: Medium mixed
df4 = pd.DataFrame({
    'A': np.random.randn(150),
    'B': np.random.randn(150) * 5 + 10,
    'C': np.random.choice(['x', 'y', 'z'], 150),
    'D': np.random.randint(0, 100, 150),
})
rec4 = analyze(df4, "4 - Medium mixed (150 rows, 3 numeric, 1 categorical)")

print(f"\n{'=' * 60}")
r_counts = [len(rec1), len(rec2), len(rec3), len(rec4)]
if len(set(r_counts)) >= 2:
    print("PASS: Advisor gives different recommendations for different datasets!")
else:
    print("FAIL: All datasets got the same number of recommendations.")
print(f"{'=' * 60}")
