"""
Hybrid insight generator: rule-based insights + optional LLM-enhanced insights.
"""
import json
import logging
from typing import Dict, Any, List

from execution.local_llm import query_llm

logger = logging.getLogger(__name__)

# ── System prompt for LLM insight generation ─────────────────────────────────
_INSIGHT_SYSTEM = """You are an expert data analyst.

Generate concise, dataset-specific insights based on the analysis results provided.

Rules:
- Do NOT give generic explanations — use actual values from the data
- If clustering is weak or clusters are imbalanced, say so explicitly
- If no strong patterns exist, mention it honestly
- Explain what the results mean in practical terms
- Each insight should be 1-2 sentences max
- Return exactly 3 to 5 insights as a JSON array of strings
- Do NOT repeat information already covered by the basic statistics"""


def _rule_based_insights(context: Dict[str, Any]) -> List[str]:
    """
    Original deterministic rule-based insight generation (preserved unchanged).
    """
    insights = []

    problem_type = context.get("problem_type", "unknown")
    models_used = context.get("models_used", [])
    num_clusters = context.get("num_clusters", 0)
    cluster_sizes = context.get("cluster_sizes", [])
    correlation = context.get("correlation", {})
    anomalies = context.get("anomalies", 0)
    distribution = context.get("distribution", "unknown")
    n_rows = context.get("n_rows", 0)
    n_cols = context.get("n_cols", 0)

    # 1. Dataset Overview
    insights.append(f"The dataset contains {n_rows:,} rows and {n_cols} columns, classified as a {problem_type} problem.")

    # 2. Correlation Insights
    if correlation:
        strong_pairs = []
        for pair, val in correlation.items():
            if abs(val) > 0.7:
                strong_pairs.append((pair, val))

        if strong_pairs:
            strong_pairs.sort(key=lambda x: abs(x[1]), reverse=True)
            top_pair, top_val = strong_pairs[0]
            direction = "positive" if top_val > 0 else "negative"
            feats = top_pair.split("-")
            if len(feats) == 2:
                insights.append(f"There is a strong {direction} correlation ({top_val:.2f}) between {feats[0]} and {feats[1]}.")
            else:
                insights.append(f"Strong {direction} correlation detected: {top_pair} ({top_val:.2f}).")

            if len(strong_pairs) > 1:
                insights.append(f"A total of {len(strong_pairs)} highly correlated feature pairs were found, suggesting potential redundancy.")

    # 3. Clustering Insights
    if num_clusters > 1:
        insights.append(f"The dataset forms {num_clusters} distinct clusters, indicating natural groupings.")
        if cluster_sizes:
            largest = max(cluster_sizes)
            smallest = min(cluster_sizes)
            if largest > smallest * 5:
                insights.append(f"The clusters are highly imbalanced, with the largest group containing {largest} points and the smallest containing {smallest} points.")
            else:
                insights.append(f"The clusters are relatively balanced in size.")

    # 4. Anomaly Insights
    if anomalies > 0:
        pct = (anomalies / max(n_rows, 1)) * 100
        insights.append(f"A total of {anomalies} anomalies ({pct:.1f}%) were detected, suggesting unusual data patterns or outliers.")
    else:
        if any(m.startswith("anomaly_") for m in models_used):
            insights.append("No significant anomalies were detected within the normal boundaries of the data.")

    # 5. Distribution Insights
    if distribution and distribution != "unknown":
        direction = distribution.replace("_", " ")
        insights.append(f"Data distributions exhibit {direction} behavior, which may impact model performance if left unscaled.")

    # 6. Model Selection Info
    insights.append(f"Analysis was performed using the following selected models: {', '.join(models_used)}.")

    return insights


def _llm_insights(context: Dict[str, Any]) -> List[str]:
    """
    Ask the LLM to generate dataset-specific insights based on analysis results.
    Returns list of insight strings, or empty list on failure.
    """
    # Build a concise summary for the LLM
    prompt_data = {
        "problem_type": context.get("problem_type", "unknown"),
        "n_rows": context.get("n_rows", 0),
        "n_cols": context.get("n_cols", 0),
        "models_used": context.get("models_used", []),
        "num_clusters": context.get("num_clusters", 0),
        "cluster_sizes": context.get("cluster_sizes", []),
        "anomalies_detected": context.get("anomalies", 0),
        "distribution": context.get("distribution", "unknown"),
    }

    # Add top correlations (limit to avoid huge prompts)
    correlation = context.get("correlation", {})
    if correlation:
        top_corr = sorted(correlation.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
        prompt_data["top_correlations"] = {k: round(v, 3) for k, v in top_corr}

    prompt = f"""Here are the analysis results for a dataset:

{json.dumps(prompt_data, indent=2)}

Generate 3-5 specific, actionable insights about this dataset based on these results.
Return ONLY a JSON array of strings. Example: ["Insight 1", "Insight 2", "Insight 3"]"""

    response = query_llm(prompt, system_prompt=_INSIGHT_SYSTEM)

    if not response:
        return []

    # Try to parse JSON array
    return _extract_insights_from_response(response)


def _extract_insights_from_response(response: str) -> List[str]:
    """Extract insight strings from LLM response."""
    import re

    # Try to find a JSON array
    match = re.search(r'\[.*?\]', response, re.DOTALL)
    if match:
        try:
            items = json.loads(match.group())
            if isinstance(items, list):
                return [str(i).strip() for i in items if isinstance(i, str) and len(i.strip()) > 10]
        except json.JSONDecodeError:
            pass

    # Fallback: extract numbered or bulleted lines
    lines = response.strip().split('\n')
    insights = []
    for line in lines:
        line = line.strip()
        # Remove numbering like "1.", "- ", "* "
        cleaned = re.sub(r'^[\d]+[.\)]\s*', '', line)
        cleaned = re.sub(r'^[-*]\s*', '', cleaned)
        cleaned = cleaned.strip().strip('"').strip("'")
        if len(cleaned) > 15 and not cleaned.startswith('{') and not cleaned.startswith('['):
            insights.append(cleaned)

    return insights[:5]


def _deduplicate_insights(rule_insights: List[str], llm_insights: List[str]) -> List[str]:
    """Merge rule-based and LLM insights, removing near-duplicates."""
    combined = list(rule_insights)
    existing_lower = {i.lower()[:50] for i in combined}

    for insight in llm_insights:
        # Skip if too similar to an existing insight
        prefix = insight.lower()[:50]
        if prefix not in existing_lower:
            combined.append(insight)
            existing_lower.add(prefix)

    # Cap at 8 total
    return combined[:8]


def generate_insights(context: Dict[str, Any]) -> List[str]:
    """
    Hybrid insight generation: rule-based + LLM-enhanced.
    Falls back to pure rule-based if LLM is unavailable.
    """
    # Step 1: Rule-based insights (always runs)
    rule_insights = _rule_based_insights(context)

    # Step 2: LLM-enhanced insights
    try:
        llm_insights = _llm_insights(context)
    except Exception as e:
        logger.warning("LLM insight generation failed: %s", e)
        llm_insights = []

    # Step 3: Merge and deduplicate
    if llm_insights:
        return _deduplicate_insights(rule_insights, llm_insights)

    return rule_insights
