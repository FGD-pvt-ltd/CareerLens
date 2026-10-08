"""
LLM Explanation Models

Defines data models for requesting and delivering natural-language employability
explanations derived from deterministic candidate analyses without external dependencies.
"""

from typing import Any, Dict, List, Optional, Union

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


if HAS_PYDANTIC:

    class LLMExplanationRequest(BaseModel):
        """Request payload for generating natural language explanations from structured analysis."""
        analysis: Union[Dict[str, Any], Any] = Field(
            ...,
            description="Structured candidate analysis output from the analysis orchestrator",
        )
        candidate_context: Optional[str] = Field(
            default=None,
            description="Optional candidate background context (e.g. university, target timeline)",
        )
        tone: Optional[str] = Field(
            default="constructive",
            description="Tone for the explanation: constructive, professional, or encouraging",
        )

    class LLMExplanationResponse(BaseModel):
        """Natural-language explanation response derived from deterministic analysis."""
        overview: str = Field(
            ...,
            description="High-level narrative summarizing current role readiness",
        )
        strengths: List[str] = Field(
            default_factory=list,
            description="Key areas strongly or partially supported by available evidence",
        )
        priority_gaps: List[str] = Field(
            default_factory=list,
            description="Priority skill requirements needing additional evidence support",
        )
        recommendations: List[str] = Field(
            default_factory=list,
            description="Actionable project and practice suggestions drawn from the roadmap",
        )
        explanation: str = Field(
            ...,
            description="Comprehensive, evidence-based narrative synthesis",
        )
        disclaimer: str = Field(
            ...,
            description="Standard disclaimer clarifying evidence-based readiness vs hiring guarantees",
        )
        provider_used: Optional[str] = Field(
            default="fallback",
            description="Identifier of the LLM provider used to generate the explanation (gemini or fallback)",
        )

else:

    class LLMExplanationRequest:
        def __init__(
            self,
            analysis: Union[Dict[str, Any], Any],
            candidate_context: Optional[str] = None,
            tone: Optional[str] = "constructive",
            **kwargs,
        ):
            self.analysis = analysis
            self.candidate_context = candidate_context
            self.tone = tone

    class LLMExplanationResponse:
        def __init__(
            self,
            overview: str,
            strengths: Optional[List[str]] = None,
            priority_gaps: Optional[List[str]] = None,
            recommendations: Optional[List[str]] = None,
            explanation: str = "",
            disclaimer: str = "",
            provider_used: str = "fallback",
            **kwargs,
        ):
            self.overview = overview
            self.strengths = list(strengths) if strengths is not None else []
            self.priority_gaps = list(priority_gaps) if priority_gaps is not None else []
            self.recommendations = list(recommendations) if recommendations is not None else []
            self.explanation = explanation
            self.disclaimer = disclaimer
            self.provider_used = provider_used

        def model_dump(self) -> dict:
            return {
                "overview": self.overview,
                "strengths": self.strengths,
                "priority_gaps": self.priority_gaps,
                "recommendations": self.recommendations,
                "explanation": self.explanation,
                "disclaimer": self.disclaimer,
                "provider_used": self.provider_used,
            }
