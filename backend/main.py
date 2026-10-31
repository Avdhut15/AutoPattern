import os
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import shutil
import uuid
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from backend.models import UploadResponse, DatasetSummaryResponse, PatternAnalysisResponse, AnomalyDetectionResponse, DLAnomalyDetectionResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Tuple
from backend.utils import load_dataset
from execution.preprocessing import get_summary_stats, load_and_clean_data, preprocess_features
from execution.pattern_detection import detect_patterns
from execution.anomaly_detection import detect_anomalies
from execution.autoencoder_model import detect_dl_anomalies
from execution.problem_detector import detect_problem_type
from execution.model_selector import select_models
from execution.insight_generator import generate_insights

class InsightsResponse(BaseModel):
    filename: str
    insights: List[str]

app = FastAPI(title="AutoPattern API", version="2.0.0")

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".tmp")
os.makedirs(TMP_DIR, exist_ok=True)

# Cache: file_path -> { "df": df, "df_processed": df_processed, "metadata": metadata, "summary": ..., ... }
CACHE: Dict[str, Dict[str, Any]] = {}

def _get_preprocessed(file_path: str):
    """Load and preprocess a dataset, using cache to avoid re-reading."""
    if file_path in CACHE and "df_processed" in CACHE[file_path]:
        return CACHE[file_path]["df"], CACHE[file_path]["df_processed"], CACHE[file_path]["metadata"]
    df = load_and_clean_data(file_path)
    df_processed, metadata = preprocess_features(df)
    if file_path not in CACHE:
        CACHE[file_path] = {}
    CACHE[file_path]["df"] = df
    CACHE[file_path]["df_processed"] = df_processed
    CACHE[file_path]["metadata"] = metadata
    return df, df_processed, metadata


def _calculate_unique_anomalies(anomalies: Dict[str, Any], dl_anomalies: Dict[str, Any]) -> Tuple[int, int]:
    """
    Computes de-duplicated unique anomaly count and consensus anomaly count across all models.
    Prevents double-counting the same data point across multiple detectors.
    """
    label_lists = [
        anomalies.get("anomaly_labels", []),
        anomalies.get("lof_labels", []),
        anomalies.get("zscore_labels", []),
        anomalies.get("ocsvm_labels", []),
        anomalies.get("elliptic_labels", []),
        dl_anomalies.get("anomaly_labels", [])
    ]
    valid_lists = [l for l in label_lists if l and len(l) > 0]
    if not valid_lists:
        return 0, 0
    min_len = min(len(l) for l in valid_lists)
    unique_count = sum(1 for i in range(min_len) if any(l[i] == 1 for l in valid_lists))
    consensus_count = sum(1 for i in range(min_len) if sum(l[i] == 1 for l in valid_lists) >= 2)
    return unique_count, consensus_count


@app.get("/")
def read_root():
    return {"message": "Welcome to AutoPattern API v2.0"}


import hashlib

@app.post("/upload_dataset", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls", ".json"]:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    try:
        content = await file.read()
        file_hash = hashlib.md5(content).hexdigest()
        unique_filename = f"{file_hash}{ext}"
        file_path = os.path.join(TMP_DIR, unique_filename)
        
        if not os.path.exists(file_path):
            def write_file():
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
            await asyncio.to_thread(write_file)
            
        return UploadResponse(filename=file.filename, message="File uploaded successfully", file_path=file_path, status="success")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/recommend")
async def get_recommendation(file_path: str):
    """AI analyzes dataset metadata and returns recommended models + reasoning."""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    if file_path in CACHE and "recommendation" in CACHE[file_path]:
        return CACHE[file_path]["recommendation"]

    try:
        def _compute():
            df, _, metadata = _get_preprocessed(file_path)
            problem = detect_problem_type(df, metadata)
            selected, llm_reasoning = select_models(problem)
            default_reasoning = f"Detected {problem['problem_type']} dataset with {problem['num_features']} features. Automatically selected {len(selected)} models."
            return {
                "dataset_type": problem["problem_type"],
                "recommended_models": selected,
                "problem_metadata": problem,
                "reasoning": llm_reasoning if llm_reasoning else default_reasoning
            }
        recommendation = await asyncio.to_thread(_compute)
        CACHE.setdefault(file_path, {})["recommendation"] = recommendation
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze")
async def analyze(file_path: str):
    """
    Unified endpoint: runs AI recommendation + only recommended models in parallel.
    Returns summary, patterns, anomalies, dl_anomalies, insights in one response.
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    if file_path in CACHE and "full_analysis" in CACHE[file_path]:
        return CACHE[file_path]["full_analysis"]

    try:
        # Step 1 — preprocess (cached)
        def _preprocess():
            return _get_preprocessed(file_path)
        df, df_processed, metadata = await asyncio.to_thread(_preprocess)

        # Step 2 — Problem detection and model selection
        def _recommend():
            if file_path in CACHE and "recommendation" in CACHE[file_path]:
                return CACHE[file_path]["recommendation"]
            problem = detect_problem_type(df, metadata)
            selected, llm_reasoning = select_models(problem)
            default_reasoning = f"Detected {problem['problem_type']} dataset with {problem['num_features']} features. Automatically selected {len(selected)} models."
            rec = {
                "dataset_type": problem["problem_type"],
                "recommended_models": selected,
                "problem_metadata": problem,
                "reasoning": llm_reasoning if llm_reasoning else default_reasoning
            }
            CACHE.setdefault(file_path, {})["recommendation"] = rec
            return rec
        recommendation = await asyncio.to_thread(_recommend)

        recommended_models = recommendation.get("recommended_models", [])
        pattern_models = [m for m in recommended_models if not m.startswith("anomaly_") and not m.startswith("supervised_")]
        anomaly_models = [m for m in recommended_models if m.startswith("anomaly_") and m != "anomaly_autoencoder"]
        run_autoencoder = "anomaly_autoencoder" in recommended_models

        # Step 3 — summary
        def _summary():
            if file_path in CACHE and "summary" in CACHE[file_path]:
                return CACHE[file_path]["summary"]
            s = get_summary_stats(df)
            CACHE.setdefault(file_path, {})["summary"] = s
            return s

        # Step 4 — run models in parallel
        async def _run_patterns():
            return await asyncio.to_thread(detect_patterns, df_processed, metadata, pattern_models)

        async def _run_anomalies():
            return await asyncio.to_thread(detect_anomalies, df_processed, metadata, anomaly_models)

        async def _run_autoencoder():
            if run_autoencoder:
                return await asyncio.to_thread(detect_dl_anomalies, df_processed, metadata)
            return {"latent_vectors": [], "reconstruction_errors": [], "anomaly_labels": [], "outliers_count": 0}

        summary, patterns, anomalies, dl_anomalies = await asyncio.gather(
            asyncio.to_thread(_summary),
            _run_patterns(),
            _run_anomalies(),
            _run_autoencoder(),
        )

        unique_anomalies, consensus_anomalies = _calculate_unique_anomalies(anomalies, dl_anomalies)
        anomalies["unique_outliers_count"] = unique_anomalies
        anomalies["consensus_outliers_count"] = consensus_anomalies

        # Step 5 — AI insights (uses results from step 4)
        def _insights():
            context = {
                "problem_type": recommendation["dataset_type"],
                "models_used": recommended_models,
                "n_rows": recommendation["problem_metadata"]["n_rows"],
                "n_cols": recommendation["problem_metadata"]["num_features"] + (1 if recommendation["problem_metadata"]["has_target"] else 0),
                "distribution": "unknown",
                "anomalies": unique_anomalies,
                "consensus_anomalies": consensus_anomalies,
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

            return generate_insights(context)
        insights = await asyncio.to_thread(_insights)

        result = {
            "filename": os.path.basename(file_path),
            "recommendation": recommendation,
            "summary": summary,
            "patterns": patterns,
            "anomalies": anomalies,
            "dl_anomalies": dl_anomalies,
            "insights": insights,
        }

        CACHE.setdefault(file_path, {})["full_analysis"] = result
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Legacy endpoints (kept for backward compatibility) ──────────────────────

@app.get("/dataset_summary", response_model=DatasetSummaryResponse)
async def get_dataset_summary(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    if file_path in CACHE and "summary" in CACHE[file_path]:
        return DatasetSummaryResponse(filename=os.path.basename(file_path), **CACHE[file_path]["summary"])
    try:
        def _compute():
            df = load_dataset(file_path)
            if df is None:
                raise ValueError("Error loading dataset")
            return get_summary_stats(df)
        summary = await asyncio.to_thread(_compute)
        CACHE.setdefault(file_path, {})["summary"] = summary
        return DatasetSummaryResponse(filename=os.path.basename(file_path), **summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pattern_analysis", response_model=PatternAnalysisResponse)
async def get_pattern_analysis(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        def _compute():
            _, df_processed, metadata = _get_preprocessed(file_path)
            patterns = detect_patterns(df_processed, metadata)
            return PatternAnalysisResponse(
                filename=os.path.basename(file_path),
                clustering=patterns.get("clustering", {}),
                correlation=patterns.get("correlation", {}),
                pca=patterns.get("pca", {})
            )
        return await asyncio.to_thread(_compute)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/anomaly_detection", response_model=AnomalyDetectionResponse)
async def get_anomaly_detection(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        def _compute():
            _, df_processed, metadata = _get_preprocessed(file_path)
            anomalies = detect_anomalies(df_processed, metadata)
            return AnomalyDetectionResponse(
                filename=os.path.basename(file_path),
                **anomalies
            )
        return await asyncio.to_thread(_compute)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dl_anomaly_detection", response_model=DLAnomalyDetectionResponse)
async def get_dl_anomaly_detection(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        def _compute():
            _, df_processed, metadata = _get_preprocessed(file_path)
            dl_anomalies = detect_dl_anomalies(df_processed, metadata)
            return DLAnomalyDetectionResponse(
                filename=os.path.basename(file_path),
                **dl_anomalies
            )
        return await asyncio.to_thread(_compute)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/insights", response_model=InsightsResponse)
async def get_insights(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    if file_path in CACHE and "insights" in CACHE[file_path]:
        return InsightsResponse(filename=os.path.basename(file_path), insights=CACHE[file_path]["insights"])
    try:
        def _compute():
            df, df_processed, metadata = _get_preprocessed(file_path)
            patterns = detect_patterns(df_processed, metadata)
            anomalies = detect_anomalies(df_processed, metadata)
            dl_anomalies = detect_dl_anomalies(df_processed, metadata)
            problem = detect_problem_type(df, metadata)
            selected, _ = select_models(problem)
            
            unique_anomalies, consensus_anomalies = _calculate_unique_anomalies(anomalies, dl_anomalies)

            context = {
                "problem_type": problem["problem_type"],
                "models_used": selected,
                "n_rows": problem["n_rows"],
                "n_cols": problem["num_features"],
                "distribution": "unknown",
                "anomalies": unique_anomalies,
                "consensus_anomalies": consensus_anomalies,
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

            return generate_insights(context)
        insights = await asyncio.to_thread(_compute)
        CACHE.setdefault(file_path, {})["insights"] = insights
        return InsightsResponse(filename=os.path.basename(file_path), insights=insights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
