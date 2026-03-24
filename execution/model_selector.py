"""
Hybrid model selector: rule-based candidates + optional LLM refinement.
"""
import json
import logging
from typing import Dict, Any, List, Tuple

from execution.local_llm import query_llm, parse_model_list

logger = logging.getLogger(__name__)

# ── System prompt for LLM model selection ────────────────────────────────────
_MODEL_SELECTION_SYSTEM = """You are a machine learning expert advisor.

Given a dataset description and a list of candidate models, suggest only the most appropriate models.

Rules:
- Avoid unnecessary clustering if the dataset has too few samples or features
- Suggest dimensionality reduction (PCA, t-SNE, UMAP) if the dataset is high-dimensional
- Suggest anomaly detection if the data is numerical and large enough
- Be selective, not exhaustive — remove models that won't add value
- If patterns are likely weak (e.g., random-looking data, very few rows), reduce clustering
- Always keep at least correlation analysis
- Return ONLY a JSON list of model names, nothing else

Valid model names:
clustering_kmeans, clustering_dbscan, clustering_gmm, clustering_hierarchical,
correlation, pca, tsne, umap,
anomaly_isolation_forest, anomaly_lof, anomaly_autoencoder"""


def _rule_based_selection(problem_metadata: Dict[str, Any]) -> List[str]:
    """
    Original rule-based model selection logic (unchanged).
    Returns candidate models based on dataset properties.
    """
    selected_models = []

    problem_type = problem_metadata.get("problem_type", "unsupervised")
    n_rows = problem_metadata.get("n_rows", 0)

    # IF unsupervised: KMeans, DBSCAN, Gaussian Mixture Model
    if problem_type == "unsupervised":
        selected_models.extend(["clustering_kmeans", "clustering_dbscan", "clustering_gmm"])
        if n_rows < 2000:
            selected_models.append("clustering_hierarchical")

    # IF supervised classification
    elif problem_type == "classification":
        selected_models.extend(["supervised_logistic_regression", "supervised_random_forest", "supervised_svm", "supervised_knn"])

    # IF regression
    elif problem_type == "regression":
        selected_models.extend(["supervised_linear_regression", "supervised_random_forest_regressor"])

    # Always include correlation for any type
    selected_models.append("correlation")

    # IF anomaly detection needed (numerical-heavy data)
    dominant_type = problem_metadata.get("dominant_type", "numerical")
    if dominant_type == "numerical":
        selected_models.extend(["anomaly_isolation_forest", "anomaly_lof"])
        if problem_metadata.get("num_features", 0) >= 3 and n_rows >= 100:
            selected_models.append("anomaly_autoencoder")

    # IF high dimensional: apply dimensionality reduction
    if problem_metadata.get("high_dimensional", False):
        selected_models.extend(["pca", "tsne", "umap"])
    elif problem_metadata.get("num_features", 0) >= 3:
        selected_models.extend(["pca", "tsne"])

    # Filter duplicates
    return list(set(selected_models))


def _llm_refine(candidate_models: List[str], problem_metadata: Dict[str, Any]) -> Tuple[List[str], str]:
    """
    Ask the LLM to refine the candidate model list.
    Returns (refined_models, reasoning_text).
    """
    prompt_data = {
        "problem_type": problem_metadata.get("problem_type", "unsupervised"),
        "num_features": problem_metadata.get("num_features", 0),
        "n_rows": problem_metadata.get("n_rows", 0),
        "dominant_type": problem_metadata.get("dominant_type", "numerical"),
        "high_dimensional": problem_metadata.get("high_dimensional", False),
        "is_time_series": problem_metadata.get("is_time_series", False),
        "feature_types": problem_metadata.get("feature_types", []),
        "candidate_models": candidate_models,
    }

    prompt = f"""Dataset description:
{json.dumps(prompt_data, indent=2)}

From the candidate models listed above, select only the most appropriate ones for this dataset.
Return a JSON array of model names. Example: ["clustering_kmeans", "correlation", "pca"]"""

    response = query_llm(prompt, system_prompt=_MODEL_SELECTION_SYSTEM)

    if not response:
        return candidate_models, ""

    # Try to parse a JSON array from the response
    refined = _extract_json_list(response)
    if refined:
        validated = parse_model_list_from_json(refined, candidate_models)
        if validated:
            reasoning = _extract_reasoning(response)
            return validated, reasoning

    # Fallback: use free-text matching
    validated = parse_model_list(response, candidate_models)
    reasoning = _extract_reasoning(response)
    return validated, reasoning


def _extract_json_list(response: str) -> List[str]:
    """Try to extract a JSON list from the LLM response."""
    import re
    # Find anything that looks like a JSON array
    match = re.search(r'\[.*?\]', response, re.DOTALL)
    if match:
        try:
            items = json.loads(match.group())
            if isinstance(items, list) and all(isinstance(i, str) for i in items):
                return items
        except json.JSONDecodeError:
            pass
    return []


def parse_model_list_from_json(llm_models: List[str], candidate_models: List[str]) -> List[str]:
    """Validate LLM-suggested models against candidates and allowed list."""
    from execution.local_llm import ALLOWED_MODELS, MODEL_ALIASES

    validated = []
    for m in llm_models:
        m_lower = m.lower().strip()
        # Direct match
        if m_lower in ALLOWED_MODELS and m_lower in candidate_models:
            validated.append(m_lower)
            continue
        # Alias match
        if m_lower in MODEL_ALIASES:
            internal = MODEL_ALIASES[m_lower]
            if internal in candidate_models:
                validated.append(internal)

    # Safety: never return empty
    if not validated:
        return candidate_models

    # Always keep correlation if it was in candidates
    if "correlation" in candidate_models and "correlation" not in validated:
        validated.append("correlation")

    return list(set(validated))


def _extract_reasoning(response: str) -> str:
    """Extract any reasoning text from LLM response (everything that's not the JSON array)."""
    import re
    # Remove JSON arrays from response to get reasoning text
    text = re.sub(r'\[.*?\]', '', response, flags=re.DOTALL).strip()
    # Clean up
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return ' '.join(lines)[:500] if lines else ""


def select_models(problem_metadata: Dict[str, Any]) -> Tuple[List[str], str]:
    """
    Hybrid model selection: rule-based candidates refined by local LLM.

    Returns:
        Tuple of (selected_model_names, llm_reasoning).
        If LLM is unavailable, reasoning is empty string.
    """
    # Step 1: Rule-based candidates
    candidates = _rule_based_selection(problem_metadata)

    # Step 2: LLM refinement
    try:
        refined, reasoning = _llm_refine(candidates, problem_metadata)
    except Exception as e:
        logger.warning("LLM refinement failed: %s — using rule-based selection", e)
        refined, reasoning = candidates, ""

    # Step 3: Safety — ensure at least some models are selected
    if not refined:
        refined = candidates
        reasoning = ""

    return refined, reasoning
