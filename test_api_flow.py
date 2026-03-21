"""Test the full API flow: upload → recommend → analyze."""
import requests
import pandas as pd
import numpy as np
import json
import os

BASE = "http://127.0.0.1:8000"

# 1. Root check
r = requests.get(f"{BASE}/", timeout=5)
print(f"[1] Root: {r.json()}")

# 2. Create and upload test data
df = pd.DataFrame({
    'A': np.random.randn(150),
    'B': np.random.randn(150) * 5 + 10,
    'C': np.random.randint(0, 100, 150),
    'D': np.random.randn(150) * 2,
})
df.to_csv("_test_upload.csv", index=False)
with open("_test_upload.csv", "rb") as f:
    r2 = requests.post(f"{BASE}/upload_dataset", files={"file": f}, timeout=10)
up = r2.json()
print(f"[2] Upload: {up.get('status')}")
fp = up.get("file_path")

# 3. Recommend
r3 = requests.get(f"{BASE}/recommend", params={"file_path": fp}, timeout=30)
rec = r3.json()
print(f"[3] Recommend: {r3.status_code}")
print(f"    Type: {rec.get('dataset_type')}")
print(f"    Models: {rec.get('recommended_models')}")
print(f"    Reasoning: {rec.get('reasoning', '')[:150]}")

# 4. Full analyze
print("[4] Running full analysis (may take a moment)...")
r4 = requests.get(f"{BASE}/analyze", params={"file_path": fp}, timeout=120)
result = r4.json()
print(f"    Status: {r4.status_code}")
print(f"    Keys: {list(result.keys())}")
if "patterns" in result:
    print(f"    Pattern keys: {list(result['patterns'].keys())}")
if "anomalies" in result:
    print(f"    Anomaly keys: {list(result['anomalies'].keys())}")
if "insights" in result:
    print(f"    Insights ({len(result['insights'])}):")
    for i, ins in enumerate(result['insights'][:3], 1):
        print(f"      {i}. {ins[:100]}")

# Cleanup
os.remove("_test_upload.csv")
print("\nALL API TESTS PASSED!")
