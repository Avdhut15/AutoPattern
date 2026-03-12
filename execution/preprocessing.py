import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import Dict, Any, Tuple

def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """
    Loads data and handles missing values.
    """
    ext = file_path.split('.')[-1].lower()
    if ext == 'csv':
        df = pd.read_csv(file_path)
    elif ext in ['xls', 'xlsx']:
        df = pd.read_excel(file_path)
    elif ext == 'json':
        df = pd.read_json(file_path)
    else:
        raise ValueError("Unsupported format")
        
    # Handle missing values
    # For numeric columns, fill with mean
    num_cols = df.select_dtypes(include=[np.number]).columns
    df[num_cols] = df[num_cols].fillna(df[num_cols].mean())
    
    # For categorical columns, fill with mode
    cat_cols = df.select_dtypes(include=['object', 'category']).columns
    for col in cat_cols:
        if not df[col].mode().empty:
            df[col] = df[col].fillna(df[col].mode()[0])
        else:
            df[col] = df[col].fillna("Unknown")
            
    return df

def preprocess_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
    """
    Normalizes numeric columns and encodes categorical features.
    Returns processed dataframe and preprocessing metadata.
    """
    df_processed = df.copy()
    metadata = {
        'numerical_features': [],
        'categorical_features': [],
        'encoders': {}
    }
    
    # Process numeric columns
    num_cols = df_processed.select_dtypes(include=[np.number]).columns.tolist()
    metadata['numerical_features'] = num_cols
    
    if num_cols:
        scaler = StandardScaler()
        df_processed[num_cols] = scaler.fit_transform(df_processed[num_cols])
        
    # Process categorical columns
    cat_cols = df_processed.select_dtypes(include=['object', 'category']).columns.tolist()
    metadata['categorical_features'] = cat_cols
    
    for col in cat_cols:
        le = LabelEncoder()
        df_processed[col] = le.fit_transform(df_processed[col].astype(str))
        metadata['encoders'][col] = le
        
    return df_processed, metadata

def get_summary_stats(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Returns basic descriptive statistics for the dataset.
    """
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
    
    # Calculate missing values
    missing_vals = df.isnull().sum().to_dict()
    missing_vals = {k: int(v) for k, v in missing_vals.items() if v > 0}
    
    # Get basic stats for numerical columns
    stats = {}
    if num_cols:
        desc = df[num_cols].describe().to_dict()
        # Convert numpy types to python native types for JSON serialization
        for col, col_stats in desc.items():
            stats[col] = {k: float(v) if pd.notnull(v) else None for k, v in col_stats.items()}
            
    # For categorical features, get unique counts
    for col in cat_cols:
        stats[col] = {
            'unique_values': int(df[col].nunique()),
            'top_value': str(df[col].mode()[0]) if not df[col].mode().empty else None
        }
        
    return {
        'num_rows': int(len(df)),
        'num_cols': int(len(df.columns)),
        'columns': df.columns.tolist(),
        'missing_values': missing_vals,
        'numerical_columns': num_cols,
        'categorical_columns': cat_cols,
        'summary_stats': stats
    }
