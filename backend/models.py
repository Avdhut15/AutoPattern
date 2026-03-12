from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class UploadResponse(BaseModel):
    filename: str
    message: str
    file_path: str
    status: str

class DatasetSummaryResponse(BaseModel):
    filename: str
    num_rows: int
    num_cols: int
    columns: List[str]
    missing_values: Dict[str, int]
    numerical_columns: List[str]
    categorical_columns: List[str]
    summary_stats: Dict[str, Any]

class PatternAnalysisResponse(BaseModel):
    filename: str
    clustering: Dict[str, Any]
    correlation: Dict[str, Any]
    pca: Dict[str, Any]

class AnomalyDetectionResponse(BaseModel):
    filename: str
    anomaly_scores: List[float]
    anomaly_labels: List[int]
    outliers_count: int

class DLAnomalyDetectionResponse(BaseModel):
    filename: str
    latent_vectors: List[List[float]]
    reconstruction_errors: List[float]
    anomaly_labels: List[int]
    outliers_count: int
