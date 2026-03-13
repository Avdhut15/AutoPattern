import os
import pandas as pd
from typing import Optional

def load_dataset(file_path: str) -> Optional[pd.DataFrame]:
    """
    Loads a dataset from the specified file path into a Pandas DataFrame.
    Supports CSV, Excel, and JSON.
    """
    if not os.path.exists(file_path):
        return None
        
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == '.csv':
            try:
                return pd.read_csv(file_path, encoding='utf-8')
            except UnicodeDecodeError:
                return pd.read_csv(file_path, encoding='latin1')
        elif ext in ['.xls', '.xlsx']:
            return pd.read_excel(file_path)
        elif ext == '.json':
            return pd.read_json(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return None
