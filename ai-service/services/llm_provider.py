"""
LLM Provider Interface

Defines the abstract provider interface for generating natural-language explanations
from deterministic candidate analysis without coupling the system to a specific provider.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Union

from models.llm import LLMExplanationResponse


class LLMProvider(ABC):
    """Abstract interface for LLM explanation generation providers."""

    @abstractmethod
    def generate_explanation(
        self,
        analysis: Union[Dict[str, Any], Any],
        candidate_context: Optional[str] = None,
        tone: Optional[str] = None,
    ) -> LLMExplanationResponse:
        """
        Translates structured candidate analysis into a natural-language explanation.
        
        Args:
            analysis: Deterministic candidate analysis from the orchestrator.
            candidate_context: Optional candidate background context.
            tone: Optional tone guidance (e.g. 'constructive', 'professional').
            
        Returns:
            LLMExplanationResponse containing overview, strengths, gaps, recommendations.
        """
        raise NotImplementedError
