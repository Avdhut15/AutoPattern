"""
Local LLM wrapper using Ollama (llama3 / mistral fallback).
Provides query_llm() for other modules. Gracefully degrades if Ollama is unavailable.
"""
import subprocess
import hashlib
import json
import re
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────
PRIMARY_MODEL = "llama3"
FALLBACK_MODEL = "mistral"
TIMEOUT_SECONDS = 60
MAX_CACHE_SIZE = 50

# All models the system is allowed to use — LLM cannot introduce new ones
ALLOWED_MODELS = {
    "clustering_kmeans", "clustering_dbscan", "clustering_gmm", "clustering_hierarchical",
    "correlation",
    "pca", "tsne", "umap",
    "anomaly_isolation_forest", "anomaly_lof", "anomaly_autoencoder",
    "supervised_logistic_regression", "supervised_random_forest",
    "supervised_svm", "supervised_knn",
    "supervised_linear_regression", "supervised_random_forest_regressor",
}

# Human-readable ↔ internal name mapping (LLM may use either)
MODEL_ALIASES: Dict[str, str] = {
    "kmeans": "clustering_kmeans",
    "k-means": "clustering_kmeans",
    "dbscan": "clustering_dbscan",
    "gmm": "clustering_gmm",
    "gaussian mixture": "clustering_gmm",
    "hierarchical": "clustering_hierarchical",
    "hierarchical clustering": "clustering_hierarchical",
    "correlation": "correlation",
    "correlation matrix": "correlation",
    "pca": "pca",
    "t-sne": "tsne",
    "tsne": "tsne",
    "umap": "umap",
    "isolation forest": "anomaly_isolation_forest",
    "isolation_forest": "anomaly_isolation_forest",
    "lof": "anomaly_lof",
    "local outlier factor": "anomaly_lof",
    "autoencoder": "anomaly_autoencoder",
    "deep learning autoencoder": "anomaly_autoencoder",
    "logistic regression": "supervised_logistic_regression",
    "random forest": "supervised_random_forest",
    "svm": "supervised_svm",
    "knn": "supervised_knn",
    "linear regression": "supervised_linear_regression",
    "random forest regressor": "supervised_random_forest_regressor",
}

# ── In-memory cache ──────────────────────────────────────────────────────────
_cache: Dict[str, str] = {}


def _cache_key(prompt: str, system_prompt: str) -> str:
    """Generate a stable cache key from prompt content."""
    combined = f"{system_prompt}||{prompt}"
    return hashlib.md5(combined.encode()).hexdigest()


def _call_ollama(prompt: str, model: str) -> Optional[str]:
    """Call Ollama CLI and return stdout text. Returns None on any failure."""
    try:
        result = subprocess.run(
            ["ollama", "run", model],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        logger.warning("Ollama %s returned code %d", model, result.returncode)
        return None
    except FileNotFoundError:
        logger.warning("Ollama is not installed or not on PATH")
        return None
    except subprocess.TimeoutExpired:
        logger.warning("Ollama %s timed out after %ds", model, TIMEOUT_SECONDS)
        return None
    except Exception as e:
        logger.warning("Ollama %s error: %s", model, e)
        return None


def query_llm(prompt: str, system_prompt: str = "", model: str = None) -> Optional[str]:
    """
    Send a prompt to the local LLM via Ollama.

    Args:
        prompt: The user prompt.
        system_prompt: Optional system instructions prepended to the prompt.
        model: Override model name. Defaults to PRIMARY_MODEL with FALLBACK_MODEL.

    Returns:
        LLM response text, or None if unavailable.
    """
    # Check cache
    key = _cache_key(prompt, system_prompt)
    if key in _cache:
        return _cache[key]

    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

    # Try primary model
    models_to_try = [model] if model else [PRIMARY_MODEL, FALLBACK_MODEL]
    response = None
    for m in models_to_try:
        response = _call_ollama(full_prompt, m)
        if response:
            break

    # Cache successful response
    if response:
        if len(_cache) >= MAX_CACHE_SIZE:
            # Evict oldest entry
            oldest_key = next(iter(_cache))
            del _cache[oldest_key]
        _cache[key] = response

    return response


def parse_model_list(response: str, candidate_models: List[str]) -> List[str]:
    """
    Extract model names from LLM free-text response.
    Only returns models that exist in both the response AND the candidate list.
    Validates against ALLOWED_MODELS whitelist.
    """
    if not response:
        return candidate_models  # fallback to original

    response_lower = response.lower()
    matched = set()

    # Check each candidate model against the response
    for model in candidate_models:
        # Direct match
        if model.lower() in response_lower:
            matched.add(model)
            continue
        # Check aliases
        for alias, internal in MODEL_ALIASES.items():
            if internal == model and alias in response_lower:
                matched.add(model)
                break

    # Safety: if LLM removed everything, return originals
    if not matched:
        logger.warning("LLM removed all models — returning original candidates")
        return candidate_models

    # Final whitelist validation
    validated = [m for m in matched if m in ALLOWED_MODELS]
    return validated if validated else candidate_models


def is_available() -> bool:
    """Check if Ollama is installed and at least one model is accessible."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True, text=True, timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


def clear_cache():
    """Clear the LLM response cache."""
    _cache.clear()
