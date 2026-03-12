import os
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import uuid
import sys

# Add the parent directory to sys.path to access execution module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import UploadResponse, DatasetSummaryResponse, PatternAnalysisResponse, AnomalyDetectionResponse, DLAnomalyDetectionResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.utils import load_dataset
from execution.preprocessing import get_summary_stats, load_and_clean_data, preprocess_features
from execution.pattern_detection import detect_patterns
from execution.anomaly_detection import detect_anomalies
from execution.autoencoder_model import detect_dl_anomalies
from execution.insight_generator import generate_insights

class InsightsResponse(BaseModel):
    filename: str
    insights: List[str]

app = FastAPI(title="AutoPattern API", version="1.0.0")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".tmp")
if not os.path.exists(TMP_DIR):
    os.makedirs(TMP_DIR)

# Simple In-Memory Cache for processed results
CACHE: Dict[str, Dict[str, Any]] = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to AutoPattern API"}

@app.post("/upload_dataset", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.xls', '.json']:
        raise HTTPException(status_code=400, detail="Unsupported file format")
        
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(TMP_DIR, unique_filename)
    
    try:
        def write_file():
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        await asyncio.to_thread(write_file)
            
        return UploadResponse(
            filename=file.filename,
            message="File uploaded successfully",
            file_path=file_path,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset_summary", response_model=DatasetSummaryResponse)
async def get_dataset_summary(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if file_path in CACHE and "dataset_summary" in CACHE[file_path]:
        return DatasetSummaryResponse(filename=os.path.basename(file_path), **CACHE[file_path]["dataset_summary"])
        
    def _compute():
        df = load_dataset(file_path)
        if df is None:
            raise ValueError("Error loading dataset")
        return get_summary_stats(df)
        
    try:
        summary = await asyncio.to_thread(_compute)
        if file_path not in CACHE:
            CACHE[file_path] = {}
        CACHE[file_path]["dataset_summary"] = summary
        
        return DatasetSummaryResponse(
            filename=os.path.basename(file_path),
            **summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pattern_analysis", response_model=PatternAnalysisResponse)
async def get_pattern_analysis(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if file_path in CACHE and "pattern_analysis" in CACHE[file_path]:
        return PatternAnalysisResponse(filename=os.path.basename(file_path), **CACHE[file_path]["pattern_analysis"])
        
    def _compute():
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        return detect_patterns(df_processed, metadata)
        
    try:
        patterns = await asyncio.to_thread(_compute)
        if file_path not in CACHE:
            CACHE[file_path] = {}
        CACHE[file_path]["pattern_analysis"] = patterns
        
        return PatternAnalysisResponse(
            filename=os.path.basename(file_path),
            **patterns
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/anomaly_detection", response_model=AnomalyDetectionResponse)
async def get_anomaly_detection(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if file_path in CACHE and "anomaly_detection" in CACHE[file_path]:
        return AnomalyDetectionResponse(filename=os.path.basename(file_path), **CACHE[file_path]["anomaly_detection"])
        
    def _compute():
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        return detect_anomalies(df_processed, metadata)
        
    try:
        anomalies = await asyncio.to_thread(_compute)
        if file_path not in CACHE:
            CACHE[file_path] = {}
        CACHE[file_path]["anomaly_detection"] = anomalies
        
        return AnomalyDetectionResponse(
            filename=os.path.basename(file_path),
            **anomalies
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dl_anomaly_detection", response_model=DLAnomalyDetectionResponse)
async def get_dl_anomaly_detection(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if file_path in CACHE and "dl_anomaly_detection" in CACHE[file_path]:
        return DLAnomalyDetectionResponse(filename=os.path.basename(file_path), **CACHE[file_path]["dl_anomaly_detection"])
        
    def _compute():
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        return detect_dl_anomalies(df_processed, metadata)
        
    try:
        anomalies = await asyncio.to_thread(_compute)
        if file_path not in CACHE:
            CACHE[file_path] = {}
        CACHE[file_path]["dl_anomaly_detection"] = anomalies
        
        return DLAnomalyDetectionResponse(
            filename=os.path.basename(file_path),
            **anomalies
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualizations")
async def get_visualizations(file_path: str):
    """Returns data for all frontend charts, parallelized calculation"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if file_path in CACHE and "visualizations" in CACHE[file_path]:
        return CACHE[file_path]["visualizations"]
        
    def _preprocess():
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        return df_processed, metadata
        
    try:
        df_processed, metadata = await asyncio.to_thread(_preprocess)
        
        patterns, anomalies, dl_anomalies = await asyncio.gather(
            asyncio.to_thread(detect_patterns, df_processed, metadata),
            asyncio.to_thread(detect_anomalies, df_processed, metadata),
            asyncio.to_thread(detect_dl_anomalies, df_processed, metadata)
        )
        
        result = {
            "filename": os.path.basename(file_path),
            "patterns": patterns,
            "anomalies": anomalies,
            "dl_anomalies": dl_anomalies
        }
        
        if file_path not in CACHE:
            CACHE[file_path] = {}
        CACHE[file_path]["visualizations"] = result
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/insights", response_model=InsightsResponse)
async def get_insights(file_path: str):
    """Generates human-readable insights with parallel execution"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if file_path in CACHE and "insights" in CACHE[file_path]:
        return InsightsResponse(filename=os.path.basename(file_path), insights=CACHE[file_path]["insights"])
        
    def _preprocess():
        df = load_and_clean_data(file_path)
        return df, *preprocess_features(df)
        
    try:
        df, df_processed, metadata = await asyncio.to_thread(_preprocess)
        
        patterns, anomalies, dl_anomalies = await asyncio.gather(
            asyncio.to_thread(detect_patterns, df_processed, metadata),
            asyncio.to_thread(detect_anomalies, df_processed, metadata),
            asyncio.to_thread(detect_dl_anomalies, df_processed, metadata)
        )
        
        insights_list = await asyncio.to_thread(generate_insights, df, patterns, anomalies, dl_anomalies)
        
        if file_path not in CACHE:
            CACHE[file_path] = {}
        CACHE[file_path]["insights"] = insights_list
        
        return InsightsResponse(
            filename=os.path.basename(file_path),
            insights=insights_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
