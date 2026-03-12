import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, Any, List

class SimpleAutoencoder(nn.Module):
    def __init__(self, input_dim: int, latent_dim: int = 2):
        super(SimpleAutoencoder, self).__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, max(input_dim // 2, latent_dim)),
            nn.ReLU(),
            nn.Linear(max(input_dim // 2, latent_dim), latent_dim)
        )
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, max(input_dim // 2, latent_dim)),
            nn.ReLU(),
            nn.Linear(max(input_dim // 2, latent_dim), input_dim)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return encoded, decoded

def run_dl_anomaly_detection(df_scaled: pd.DataFrame, num_features: List[str], epochs: int = 50, batch_size: int = 32, threshold_percentile: float = 90.0) -> Dict[str, Any]:
    """
    Trains a simple autoencoder and detects anomalies using reconstruction error.
    """
    if not num_features or df_scaled[num_features].empty:
        return {"latent_vectors": [], "reconstruction_errors": [], "anomaly_labels": [], "outliers_count": 0}
        
    X_numpy = df_scaled[num_features].values
    X_tensor = torch.FloatTensor(X_numpy)
    
    # DataLoader for training
    dataset = TensorDataset(X_tensor, X_tensor)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    input_dim = len(num_features)
    latent_dim = max(2, input_dim // 2)
    
    model = SimpleAutoencoder(input_dim, latent_dim)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    
    # Train the autoencoder
    model.train()
    for epoch in range(epochs):
        for data, _ in dataloader:
            optimizer.zero_grad()
            _, decoded = model(data)
            loss = criterion(decoded, data)
            loss.backward()
            optimizer.step()
            
    # Evaluation for anomaly detection
    model.eval()
    with torch.no_grad():
        encoded, decoded = model(X_tensor)
        
        # Calculate reconstruction error per sample
        mse = nn.MSELoss(reduction='none')
        reconstruction_errors = mse(decoded, X_tensor).mean(dim=1).numpy()
        
    # Determine anomaly threshold (e.g., top 10% highest errors are anomalies)
    threshold = np.percentile(reconstruction_errors, threshold_percentile)
    anomaly_labels = [1 if error > threshold else 0 for error in reconstruction_errors]
    
    return {
        "latent_vectors": encoded.numpy().tolist(),
        "reconstruction_errors": reconstruction_errors.tolist(),
        "anomaly_labels": anomaly_labels,
        "outliers_count": sum(anomaly_labels)
    }

def detect_dl_anomalies(df_processed: pd.DataFrame, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrates the deep learning anomaly detection execution.
    """
    num_features = metadata.get('numerical_features', [])
    return run_dl_anomaly_detection(df_processed, num_features)
