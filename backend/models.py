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
    anomaly_scores: List[float] = []
    anomaly_labels: List[int] = []
    outliers_count: int = 0
    lof_scores: Optional[List[float]] = []
    lof_labels: Optional[List[int]] = []
    lof_outliers_count: Optional[int] = 0
    zscore_scores: Optional[List[float]] = []
    zscore_labels: Optional[List[int]] = []
    zscore_outliers_count: Optional[int] = 0
    ocsvm_scores: Optional[List[float]] = []
    ocsvm_labels: Optional[List[int]] = []
    ocsvm_outliers_count: Optional[int] = 0
    elliptic_scores: Optional[List[float]] = []
    elliptic_labels: Optional[List[int]] = []
    elliptic_outliers_count: Optional[int] = 0

class DLAnomalyDetectionResponse(BaseModel):
    filename: str
    latent_vectors: List[List[float]]
    reconstruction_errors: List[float]
    anomaly_labels: List[int]
    outliers_count: int
