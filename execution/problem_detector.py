import pandas as pd
from typing import Dict, Any, List

def detect_problem_type(df: pd.DataFrame, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Automatically detects the dataset type and characterizes the machine learning problem.
    """
    n_rows = len(df)
    n_cols = len(df.columns)
    
    num_cols = metadata.get("numerical_features", [])
    cat_cols = metadata.get("categorical_features", [])
    date_cols = metadata.get("datetime_features", [])
    
    # Simple heuristic to find a target column
    potential_targets = [col for col in df.columns if col.lower() in ['target', 'label', 'class', 'outcome', 'y']]
    has_target = len(potential_targets) > 0
    
    problem_type = "unsupervised"
    if has_target:
        target_col = potential_targets[0]
        # Decide between classification and regression
        if pd.api.types.is_numeric_dtype(df[target_col]) and df[target_col].nunique() > 20:
            problem_type = "regression"
        else:
            problem_type = "classification"
    
    # Check if high dimensional
    num_features = n_cols - (1 if has_target else 0)
    high_dimensional = num_features >= 10
    
    # Check if time-series
    is_time_series = len(date_cols) > 0
    
    # Determine dominant feature type
    if len(cat_cols) > len(num_cols):
        dominant_type = "categorical"
    else:
        dominant_type = "numerical"
        
    return {
        "problem_type": problem_type,
        "has_target": has_target,
        "target_column": potential_targets[0] if has_target else None,
        "num_features": num_features,
        "n_rows": n_rows,
        "feature_types": ["numerical" if len(num_cols) > 0 else "", "categorical" if len(cat_cols) > 0 else ""],
        "dominant_type": dominant_type,
        "high_dimensional": high_dimensional,
        "is_time_series": is_time_series
    }
