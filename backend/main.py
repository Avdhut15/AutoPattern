import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import uuid
import sys

# Add the parent directory to sys.path to access execution module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import UploadResponse, DatasetSummaryResponse, PatternAnalysisResponse, AnomalyDetectionResponse, DLAnomalyDetectionResponse
from pydantic import BaseModel
from typing import List
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

@app.get("/")
def read_root():
    return {"message": "Welcome to AutoPattern API"}

@app.post("/upload_dataset", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.xls', '.json']:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, Excel, or JSON.")
        
    # Generate unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(TMP_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return UploadResponse(
            filename=file.filename,
            message="File uploaded successfully",
            file_path=file_path,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dataset_summary", response_model=DatasetSummaryResponse)
def get_dataset_summary(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    df = load_dataset(file_path)
    if df is None:
        raise HTTPException(status_code=500, detail="Error loading dataset")
        
    summary = get_summary_stats(df)
    
    return DatasetSummaryResponse(
        filename=os.path.basename(file_path),
        **summary
    )

@app.get("/pattern_analysis", response_model=PatternAnalysisResponse)
def get_pattern_analysis(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        
        patterns = detect_patterns(df_processed, metadata)
        
        return PatternAnalysisResponse(
            filename=os.path.basename(file_path),
            **patterns
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/anomaly_detection", response_model=AnomalyDetectionResponse)
def get_anomaly_detection(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        
        anomalies = detect_anomalies(df_processed, metadata)
        
        return AnomalyDetectionResponse(
            filename=os.path.basename(file_path),
            **anomalies
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dl_anomaly_detection", response_model=DLAnomalyDetectionResponse)
def get_dl_anomaly_detection(file_path: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        
        anomalies = detect_dl_anomalies(df_processed, metadata)
        
        return DLAnomalyDetectionResponse(
            filename=os.path.basename(file_path),
            **anomalies
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualizations")
def get_visualizations(file_path: str):
    """Returns data for all frontend charts"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        
        patterns = detect_patterns(df_processed, metadata)
        anomalies = detect_anomalies(df_processed, metadata)
        dl_anomalies = detect_dl_anomalies(df_processed, metadata)
        
        return {
            "filename": os.path.basename(file_path),
            "patterns": patterns,
            "anomalies": anomalies,
            "dl_anomalies": dl_anomalies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/insights", response_model=InsightsResponse)
def get_insights(file_path: str):
    """Generates human-readable insights"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        df = load_and_clean_data(file_path)
        df_processed, metadata = preprocess_features(df)
        
        patterns = detect_patterns(df_processed, metadata)
        anomalies = detect_anomalies(df_processed, metadata)
        dl_anomalies = detect_dl_anomalies(df_processed, metadata)
        
        insights_list = generate_insights(df, patterns, anomalies, dl_anomalies)
        
        return InsightsResponse(
            filename=os.path.basename(file_path),
            insights=insights_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
