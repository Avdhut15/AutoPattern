import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from typing import Dict, Any, List

# Limit PyTorch threads to avoid contention during parallel execution
torch.set_num_threads(2)

MAX_TRAIN_ROWS = 3000
MAX_OUTPUT_POINTS = 2000

class SimpleAutoencoder(nn.Module):
    def __init__(self, input_dim: int, latent_dim: int = 2):
        super().__init__()
        hidden = max(input_dim // 2, latent_dim)
        self.encoder = nn.Sequential(nn.Linear(input_dim, hidden), nn.ReLU(), nn.Linear(hidden, latent_dim))
        self.decoder = nn.Sequential(nn.Linear(latent_dim, hidden), nn.ReLU(), nn.Linear(hidden, input_dim))

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return encoded, decoded


def run_dl_anomaly_detection(
    df_scaled: pd.DataFrame,
    num_features: List[str],
    epochs: int = 15,
    batch_size: int = 32,
    threshold_percentile: float = 90.0,
) -> Dict[str, Any]:
    if not num_features or df_scaled[num_features].empty:
        return {"latent_vectors": [], "reconstruction_errors": [], "anomaly_labels": [], "outliers_count": 0}

    X_numpy = df_scaled[num_features].values

    # Sample training rows if dataset is large
    if len(X_numpy) > MAX_TRAIN_ROWS:
        rng = np.random.default_rng(42)
        train_idx = rng.choice(len(X_numpy), MAX_TRAIN_ROWS, replace=False)
        X_train = X_numpy[train_idx]
    else:
        X_train = X_numpy

    X_tensor_full = torch.FloatTensor(X_numpy)
    X_tensor_train = torch.FloatTensor(X_train)
    dataset = TensorDataset(X_tensor_train, X_tensor_train)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    input_dim = len(num_features)
    latent_dim = max(2, input_dim // 2)
    model = SimpleAutoencoder(input_dim, latent_dim)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)

    # Train with early stopping
    best_loss = float("inf")
    patience_counter = 0
    patience = 3

    model.train()
    for epoch in range(epochs):
        epoch_loss = 0.0
        for data, _ in dataloader:
            optimizer.zero_grad()
            _, decoded = model(data)
            loss = criterion(decoded, data)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        avg_loss = epoch_loss / max(len(dataloader), 1)
        if best_loss - avg_loss > 1e-4:
            best_loss = avg_loss
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                break

    model.eval()
    with torch.no_grad():
        encoded, decoded = model(X_tensor_full)
        mse = nn.MSELoss(reduction="none")
        reconstruction_errors = mse(decoded, X_tensor_full).mean(dim=1).numpy()

    threshold = np.percentile(reconstruction_errors, threshold_percentile)
    anomaly_labels = [1 if e > threshold else 0 for e in reconstruction_errors]

    # Sample output for large datasets
    if len(anomaly_labels) > MAX_OUTPUT_POINTS:
        rng = np.random.default_rng(42)
        out_idx = sorted(rng.choice(len(anomaly_labels), MAX_OUTPUT_POINTS, replace=False).tolist())
        out_errors = [float(reconstruction_errors[i]) for i in out_idx]
        out_labels = [anomaly_labels[i] for i in out_idx]
        out_latent = encoded.numpy()[out_idx].tolist()
    else:
        out_errors = reconstruction_errors.tolist()
        out_labels = anomaly_labels
        out_latent = encoded.numpy().tolist()

    return {
        "latent_vectors": out_latent,
        "reconstruction_errors": out_errors,
        "anomaly_labels": out_labels,
        "outliers_count": int(sum(anomaly_labels)),
    }


def detect_dl_anomalies(df_processed: pd.DataFrame, metadata: Dict[str, Any]) -> Dict[str, Any]:
    num_features = metadata.get("numerical_features", [])
    return run_dl_anomaly_detection(df_processed, num_features)
