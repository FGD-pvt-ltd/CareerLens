"""
LLM Explanation Service

Coordinates natural-language explanation generation using Gemini or fallback providers
with automatic, safe fallback to deterministic explanation synthesis.
"""

import copy
from typing import Any, Dict, Optional, Union

from config.settings import is_gemini_configured
from models.llm import LLMExplanationResponse
from services.fallback_llm import DeterministicFallbackLLM
from services.gemini_provider import GeminiProvider
from services.llm_provider import LLMProvider

_FALLBACK_PROVIDER = DeterministicFallbackLLM()


def get_default_provider() -> LLMProvider:
    """
    Selects the default LLM provider based on configuration:
    - If GEMINI_API_KEY is configured, returns GeminiProvider.
    - Otherwise, returns DeterministicFallbackLLM.
    """
    if is_gemini_configured():
        return GeminiProvider()
    return _FALLBACK_PROVIDER


def generate_candidate_explanation(
    analysis: Union[Dict[str, Any], Any],
    provider: Optional[LLMProvider] = None,
    candidate_context: Optional[str] = None,
    tone: Optional[str] = None,
) -> LLMExplanationResponse:
    """
    Generates a natural-language explanation from structured candidate analysis.
    
    Guarantees:
    - Never mutates the original analysis object.
    - Automatically uses GeminiProvider if GEMINI_API_KEY is configured and no provider given.
    - Gracefully catches all Gemini API/network/parsing errors and falls back to deterministic provider.
    - Output is strictly grounded and never claims absolute mastery.
    
    Args:
        analysis: Structured candidate analysis from orchestrator or API.
        provider: Optional custom LLMProvider implementation.
        candidate_context: Optional candidate background context.
        tone: Optional tone guidance.
        
    Returns:
        LLMExplanationResponse containing overview, strengths, gaps, and recommendations.
    """
    # Create an isolated copy to prevent external providers from modifying original analysis
    try:
        safe_analysis = copy.deepcopy(analysis)
    except Exception:
        safe_analysis = analysis

    if provider is not None:
        active_provider = provider
    else:
        active_provider = get_default_provider()

    try:
        response = active_provider.generate_explanation(
            analysis=safe_analysis,
            candidate_context=candidate_context,
            tone=tone,
        )
        if isinstance(response, LLMExplanationResponse):
            return response
        elif isinstance(response, dict):
            return LLMExplanationResponse(**response)
        # If response structure is unexpected, fallback cleanly
        return _FALLBACK_PROVIDER.generate_explanation(
            analysis=safe_analysis,
            candidate_context=candidate_context,
            tone=tone,
        )
    except Exception:
        # Gracefully handle any provider failure by delegating to deterministic fallback
        return _FALLBACK_PROVIDER.generate_explanation(
            analysis=safe_analysis,
            candidate_context=candidate_context,
            tone=tone,
        )
