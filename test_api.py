import requests
import pandas as pd
import numpy as np
import os

BASE_URL = "http://127.0.0.1:8000"

def create_dummy_data():
    df = pd.DataFrame({
        'A': np.random.randn(100),
        'B': np.random.randn(100) * 5 + 10,
        'C': np.random.choice(['cat', 'dog', 'mouse'], 100),
        'D': np.random.randint(0, 100, 100)
    })
    df.loc[10:15, 'A'] = np.nan
    df.loc[20:25, 'C'] = np.nan
    
    file_path = "dummy_data.csv"
    df.to_csv(file_path, index=False)
    return file_path

def test_upload(file_path):
    print(f"Testing upload for {file_path}...")
    with open(file_path, 'rb') as f:
        response = requests.post(f"{BASE_URL}/upload_dataset", files={"file": f})
    
    print(f"Upload Status Code: {response.status_code}")
    print(f"Upload Response: {response.json()}")
    return response.json()

def test_summary(file_path):
    print(f"\nTesting summary for {file_path}...")
    response = requests.get(f"{BASE_URL}/dataset_summary", params={"file_path": file_path})
    
    print(f"Summary Status Code: {response.status_code}")
    print(f"Summary Response keys: {response.json().keys()}")
    print("Summary Stats for 'A':", response.json().get('summary_stats', {}).get('A'))
    print("Missing Values:", response.json().get('missing_values'))
    
def test_analysis(file_path):
    print(f"\nTesting analysis for {file_path}...")
    response = requests.get(f"{BASE_URL}/pattern_analysis", params={"file_path": file_path})
    
    print(f"Analysis Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Analysis keys: {data.keys()}")
        print(f"Clustering labels lengths: {len(data['clustering'].get('kmeans_labels', []))}")
        print(f"PCA explained variance: {data['pca'].get('explained_variance_ratio')}")
        
def test_anomaly(file_path):
    print(f"\nTesting anomaly detection for {file_path}...")
    response = requests.get(f"{BASE_URL}/anomaly_detection", params={"file_path": file_path})
    
    print(f"Anomaly Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Outliers count: {data.get('outliers_count')}")
        print(f"First 10 scores: {data.get('anomaly_scores', [])[:10]}")
        
def test_dl_anomaly(file_path):
    print(f"\nTesting DL anomaly detection for {file_path}...")
    response = requests.get(f"{BASE_URL}/dl_anomaly_detection", params={"file_path": file_path})
    
    print(f"DL Anomaly Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"DL Outliers count: {data.get('outliers_count')}")
        print(f"DL First 5 recon errors: {data.get('reconstruction_errors', [])[:5]}")
        
def test_insights(file_path):
    print(f"\nTesting insights for {file_path}...")
    response = requests.get(f"{BASE_URL}/insights", params={"file_path": file_path})
    
    print(f"Insights Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Generated Insights:")
        for ins in data.get("insights", []):
            print(f"- {ins}")
        
if __name__ == "__main__":
    file_path = create_dummy_data()
    try:
        upload_resp = test_upload(file_path)
        if upload_resp.get('status') == 'success':
            server_file_path = upload_resp.get('file_path')
            test_summary(server_file_path)
            test_analysis(server_file_path)
            test_anomaly(server_file_path)
            test_dl_anomaly(server_file_path)
            test_insights(server_file_path)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
