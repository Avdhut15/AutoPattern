# AutoPattern

AutoPattern is an intelligent platform for automated dataset analysis, pattern discovery, and anomaly detection. It analyzes data using a suite of 14 machine learning models and generates actionable insights automatically.

## Features

- **Local AI Advisor**: A fast, rule-based engine that automatically analyzes your dataset's metadata (shape, types, distributions, correlations) to intelligently recommend the best ML models for analysis. Runs locally in ~100ms with zero API dependencies.
- **14 ML Models Supported**:
  - **Pattern Detection**: KMeans, Hierarchical Clustering, DBSCAN, Gaussian Mixture Model (GMM), PCA, t-SNE, UMAP, Correlation Analysis.
  - **Anomaly Detection**: Isolation Forest, Local Outlier Factor (LOF), Z-Score, One-Class SVM, Elliptic Envelope, Deep Learning Autoencoder.
- **Automated Insights**: Generates specific, dataset-referencing insights explaining the discovered patterns, detected anomalies, and correlation strength in plain English.
- **Fast Execution**: Uses parallel processing, fast C-engine CSV loading, and highly optimized ML executing paths.

## Running the Application

AutoPattern requires both the FastAPI backend and React frontend to be running simultaneously.

### 1. Start the Backend (FastAPI)

```bash
cd AutoPattern
backend\venv\Scripts\activate
python -m uvicorn backend.main:app --port 8000
```
*Note: Run uvicorn from the root `AutoPattern` folder, not from inside the `backend` folder.*

### 2. Start the Frontend (React)

Open a new terminal window:
```bash
cd AutoPattern/frontend
npm install  # First time only
npm run dev
```

The application will be available at `http://localhost:5173`.

## Optional Dependencies
To enable UMAP for advanced non-linear dimensionality reduction, install `umap-learn`:
```bash
pip install umap-learn
```
