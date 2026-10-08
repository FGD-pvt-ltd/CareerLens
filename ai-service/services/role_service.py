"""
Role Requirements Service

Resolves target job roles and common aliases to canonical requirement profiles,
canonicalizes expected skills, and attaches controlled importance levels and weights.
"""

from typing import List

from config.role_requirements import (
    IMPORTANCE_WEIGHTS,
    find_canonical_role_name,
    get_role_definition,
    get_supported_roles,
)
from models.role import RoleRequirementsResponse, SkillRequirementItem
from services.evidence_service import _resolve_canonical_skill


def resolve_role_requirements(input_role: str) -> RoleRequirementsResponse:
    """
    Deterministically resolves a target job role (or alias) and returns its canonical
    skill requirements with importance weights and descriptions.
    
    Args:
        input_role: Target job title string (e.g. "AI Engineer", "SDE", "Data Scientist")
        
    Returns:
        RoleRequirementsResponse detailing required skills and importance counts.
        
    Raises:
        ValueError: If input_role is blank or not recognized in the supported taxonomy.
    """
    if not input_role or not isinstance(input_role, str) or not input_role.strip():
        raise ValueError("Target role cannot be empty or contain only whitespace.")

    cleaned_role = input_role.strip()
    matched_role = find_canonical_role_name(cleaned_role)

    if not matched_role:
        supported = ", ".join(get_supported_roles())
        raise ValueError(
            f"Role '{cleaned_role}' is not recognized. Supported roles: {supported}."
        )

    role_data = get_role_definition(matched_role)
    if not role_data:
        raise ValueError(f"Definition configuration missing for role '{matched_role}'.")

    skill_items: List[SkillRequirementItem] = []
    high_count = 0
    medium_count = 0
    low_count = 0

    for req in role_data.get("requirements", []):
        raw_skill = req["skill"]
        canonical_name, category = _resolve_canonical_skill(raw_skill)
        importance = req["importance"]
        weight = IMPORTANCE_WEIGHTS.get(importance, 0.6)
        description = req["description"]

        if importance == "high":
            high_count += 1
        elif importance == "medium":
            medium_count += 1
        elif importance == "low":
            low_count += 1

        item = SkillRequirementItem(
            skill_name=canonical_name,
            category=category,
            importance=importance,
            importance_weight=weight,
            description=description,
        )
        skill_items.append(item)

    return RoleRequirementsResponse(
        role=cleaned_role,
        matched_role=matched_role,
        total_required_skills=len(skill_items),
        high_priority_skills=high_count,
        medium_priority_skills=medium_count,
        low_priority_skills=low_count,
        skills_required=skill_items,
    )
