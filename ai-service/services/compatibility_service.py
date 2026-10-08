"""
Compatibility Service Adapter

Adapts the unified candidate profile payload from the Node.js/Express backend
into the existing ProfiQ deterministic analysis pipeline without changing any
core scoring, matching, or evidence aggregation formulas.
"""

from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from config.settings import is_gemini_configured
from config.skills_dictionary import SKILL_DEFINITIONS
from models.analysis import AnalysisResponse
from models.compatibility import (
    BackendAnalyzeRequest,
    BackendAnalyzeResponse,
    CompatibilityAnalysisData,
    CompatibilityMetadata,
)
from models.evidence import EvidenceItem, EvidenceStrength, EvidenceType
from services.analysis_service import analyze_candidate
from services.evidence_service import _resolve_canonical_skill
from services.github_service import (
    _COMPILED_SKILL_PATTERNS,
    determine_repo_evidence_metrics,
)
from services.llm_service import generate_candidate_explanation
from services.skill_extractor import is_negated_mention


def extract_resume_text(profile: Dict[str, Any]) -> str:
    """
    Extracts text from profile.resume.resumeText or profile.resume.cvText,
    preferring resumeText when both are available.
    
    If resume text is absent, synthesizes a readable textual representation
    from structured profile sections (skills, experience, projects) to ensure
    the candidate's explicit claims are evaluated gracefully.
    """
    resume_section = profile.get("resume") or {}
    resume_text = (resume_section.get("resumeText") or "").strip()
    if resume_text:
        return resume_text

    cv_text = (resume_section.get("cvText") or "").strip()
    if cv_text:
        return cv_text

    # Synthesize fallback text from structured profile data
    text_blocks: List[str] = []

    # Claimed skills
    skills = profile.get("skills") or []
    if skills:
        skill_names = []
        for s in skills:
            if isinstance(s, str) and s.strip():
                skill_names.append(s.strip())
            elif isinstance(s, dict) and s.get("name"):
                skill_names.append(str(s["name"]).strip())
        if skill_names:
            text_blocks.append(f"Technical Skills: {', '.join(skill_names)}")

    # Work experience
    experience = profile.get("experience") or []
    for exp in experience:
        if isinstance(exp, dict):
            role = exp.get("role") or ""
            org = exp.get("organization") or ""
            desc = exp.get("description") or ""
            techs = exp.get("technologies") or []
            tech_phrase = f" Technologies: {', '.join(techs)}" if techs else ""
            text_blocks.append(f"Experience: {role} at {org}. {desc}{tech_phrase}")

    # Projects
    projects = profile.get("projects") or []
    for proj in projects:
        if isinstance(proj, dict):
            name = proj.get("name") or ""
            desc = proj.get("description") or ""
            techs = proj.get("technologies") or []
            tech_phrase = f" Technologies: {', '.join(techs)}" if techs else ""
            text_blocks.append(f"Project: {name}. {desc}{tech_phrase}")

    if text_blocks:
        return "\n".join(text_blocks)

    # Minimal fallback placeholder for candidate with no uploaded resume and no profile claims
    return "Candidate Profile"


def _extract_skills_from_string(text: str) -> List[str]:
    """Scans freeform text for known canonical skills, excluding negated mentions."""
    if not text or not text.strip():
        return []
    found: List[str] = []
    seen: Set[str] = set()
    for canonical, _, pattern in _COMPILED_SKILL_PATTERNS:
        if canonical.lower() not in seen:
            for match in pattern.finditer(text):
                if not is_negated_mention(text, match.start(), match.end()):
                    found.append(canonical)
                    seen.add(canonical.lower())
                    break
    return found


def convert_profile_to_evidence(profile: Dict[str, Any]) -> List[EvidenceItem]:
    """
    Converts candidate profile sections into standard EvidenceItem instances.
    
    Supported evidence mappings:
    - profile.projects → project evidence
    - profile.github.repositories → github_repository evidence
    - profile.codingProfiles → coding_platform evidence
    - profile.certifications → certification evidence
    - profile.college.relevantCoursework → coursework evidence
    - profile.academicAchievements → other/academic evidence
    - profile.experience → other/experience evidence
    
    Strictly follows existing evidence strength, confidence caps, and non-invention rules.
    """
    evidence_items: List[EvidenceItem] = []

    # 1. Projects → EvidenceType.PROJECT
    for proj in profile.get("projects") or []:
        if not isinstance(proj, dict):
            continue
        name = proj.get("name") or "Project"
        desc = proj.get("description") or ""
        techs = proj.get("technologies") or []
        github_url = proj.get("githubUrl")
        live_url = proj.get("liveUrl") or proj.get("demoUrl")
        ref_url = github_url or live_url

        # Canonicalize related skills
        related: List[str] = []
        seen_skills: Set[str] = set()
        for t in techs:
            canon, _ = _resolve_canonical_skill(str(t))
            if canon.lower() not in seen_skills:
                related.append(canon)
                seen_skills.add(canon.lower())

        # Also scan description if no techs explicitly listed
        if not related and desc:
            for canon in _extract_skills_from_string(desc):
                if canon.lower() not in seen_skills:
                    related.append(canon)
                    seen_skills.add(canon.lower())

        # Determine evidence strength & confidence
        if ref_url:
            strength = EvidenceStrength.MODERATE
            confidence = 0.70
        else:
            strength = EvidenceStrength.WEAK
            confidence = 0.55

        evidence_items.append(
            EvidenceItem(
                evidence_type=EvidenceType.PROJECT,
                title=name,
                description=desc or f"Practical project demonstrating {', '.join(related) if related else name}",
                source="portfolio_project",
                url=ref_url,
                related_skills=related,
                evidence_strength=strength,
                confidence=confidence,
                metadata={
                    "role": proj.get("role"),
                    "teamSize": proj.get("teamSize"),
                    "category": proj.get("category"),
                },
            )
        )

    # 2. GitHub Repositories → EvidenceType.GITHUB_REPOSITORY
    github_section = profile.get("github") or {}
    repositories = github_section.get("repositories") or []
    for repo in repositories:
        if not isinstance(repo, dict):
            continue
        name = repo.get("name") or repo.get("fullName") or "repository"
        desc = repo.get("description") or ""
        url = repo.get("url") or repo.get("homepage")
        primary_lang = repo.get("primaryLanguage") or repo.get("language") or ""
        topics = repo.get("topics") or []
        languages = repo.get("languages") or []
        stars = int(repo.get("stars") or repo.get("stargazers_count") or 0)
        forks = int(repo.get("forks") or repo.get("forks_count") or 0)
        is_fork = bool(repo.get("fork", False))

        # Collect and canonicalize skills demonstrated
        repo_skills: List[str] = []
        seen_repo_skills: Set[str] = set()

        if primary_lang:
            canon_lang, _ = _resolve_canonical_skill(primary_lang)
            repo_skills.append(canon_lang)
            seen_repo_skills.add(canon_lang.lower())

        for l in languages:
            canon, _ = _resolve_canonical_skill(str(l))
            if canon.lower() not in seen_repo_skills:
                repo_skills.append(canon)
                seen_repo_skills.add(canon.lower())

        for t in topics:
            norm_topic = str(t).replace("-", " ").strip()
            canon, cat = _resolve_canonical_skill(norm_topic)
            if (cat != "General Technical Skills" or norm_topic.lower() in [s["name"].lower() for s in SKILL_DEFINITIONS]) and canon.lower() not in seen_repo_skills:
                repo_skills.append(canon)
                seen_repo_skills.add(canon.lower())

        if desc:
            for canon in _extract_skills_from_string(desc):
                if canon.lower() not in seen_repo_skills:
                    repo_skills.append(canon)
                    seen_repo_skills.add(canon.lower())

        # Reuse existing determine_repo_evidence_metrics function
        metrics_repo = {
            "fork": is_fork,
            "stargazers_count": stars,
            "forks_count": forks,
            "language": primary_lang,
        }
        strength, confidence = determine_repo_evidence_metrics(metrics_repo, len(repo_skills))

        evidence_items.append(
            EvidenceItem(
                evidence_type=EvidenceType.GITHUB_REPOSITORY,
                title=name,
                description=desc or f"Public GitHub repository {name} in {primary_lang or 'software'}",
                source="GitHub",
                url=url,
                related_skills=repo_skills,
                evidence_strength=strength,
                confidence=confidence,
                metadata={
                    "is_fork": is_fork,
                    "stars": stars,
                    "forks": forks,
                    "primary_language": primary_lang,
                },
            )
        )

    # 3. Coding Profiles → EvidenceType.CODING_PLATFORM
    coding_profiles = profile.get("codingProfiles") or []
    for cp in coding_profiles:
        if not isinstance(cp, dict):
            continue
        platform = cp.get("platform") or "Coding Platform"
        username = cp.get("username")
        url = cp.get("profileUrl")
        stats = cp.get("stats") or {}
        solved = stats.get("problemsSolved")
        rating = stats.get("rating")
        languages = cp.get("languages") or []

        # Only create evidence from data actually supplied
        if solved is None and rating is None and not languages and not username:
            continue

        related = ["Data Structures", "Algorithms", "Problem Solving"]
        for lang in languages:
            c_lang, _ = _resolve_canonical_skill(str(lang))
            if c_lang not in related:
                related.append(c_lang)

        # Conservative confidence calculation based on verifiable metrics
        if (solved is not None and solved >= 150) or (rating is not None and rating >= 1800):
            strength = EvidenceStrength.STRONG
            confidence = 0.80
        elif (solved is not None and solved >= 50) or (rating is not None and rating >= 1500):
            strength = EvidenceStrength.MODERATE
            confidence = 0.70
        elif solved is not None and solved >= 10:
            strength = EvidenceStrength.MODERATE
            confidence = 0.60
        elif solved is not None and solved > 0:
            strength = EvidenceStrength.WEAK
            confidence = 0.50
        elif username or url:
            # Platform profile supplied but 0/unreported problem activity
            strength = EvidenceStrength.WEAK
            confidence = 0.40
        else:
            continue

        evidence_items.append(
            EvidenceItem(
                evidence_type=EvidenceType.CODING_PLATFORM,
                title=f"{platform} Profile ({username or 'Active'})",
                description=f"Problem solving activity on {platform} with {solved if solved is not None else 0} problems solved",
                source=platform,
                url=url,
                related_skills=related,
                evidence_strength=strength,
                confidence=confidence,
                metadata={
                    "problems_solved": solved,
                    "rating": rating,
                    "platform": platform,
                },
            )
        )

    # 4. Certifications → EvidenceType.CERTIFICATION
    certifications = profile.get("certifications") or []
    for cert in certifications:
        if not isinstance(cert, dict):
            continue
        name = cert.get("name") or ""
        if not name.strip():
            continue
        org = cert.get("issuingOrganization") or cert.get("issuer") or "Certification Authority"
        cred_url = cert.get("credentialUrl")
        cred_id = cert.get("credentialId")

        # Resolve skills from certification title
        related = _extract_skills_from_string(name)
        if not related:
            canon_cert, _ = _resolve_canonical_skill(name)
            related = [canon_cert]

        # Enforce existing certification cap: max confidence 0.60, never strong alone
        if cred_url or cred_id:
            strength = EvidenceStrength.MODERATE
            confidence = 0.60
        else:
            strength = EvidenceStrength.WEAK
            confidence = 0.55

        evidence_items.append(
            EvidenceItem(
                evidence_type=EvidenceType.CERTIFICATION,
                title=name,
                description=f"Professional credential issued by {org}",
                source=org,
                url=cred_url,
                related_skills=related,
                evidence_strength=strength,
                confidence=min(0.60, confidence),
                metadata={"credential_id": cred_id, "issuer": org},
            )
        )

    # 5. Coursework → EvidenceType.COURSEWORK
    college = profile.get("college") or {}
    coursework = college.get("relevantCoursework") or []
    college_name = college.get("collegeName") or college.get("university") or "Academic Institution"
    for course in coursework:
        course_name = course if isinstance(course, str) else (course.get("name") if isinstance(course, dict) else "")
        if not course_name or not str(course_name).strip():
            continue
        course_str = str(course_name).strip()
        related = _extract_skills_from_string(course_str)
        if not related:
            canon_c, _ = _resolve_canonical_skill(course_str)
            related = [canon_c]

        evidence_items.append(
            EvidenceItem(
                evidence_type=EvidenceType.COURSEWORK,
                title=f"Coursework: {course_str}",
                description=f"Academic coursework completed at {college_name}: {course_str}",
                source=college_name,
                url=None,
                related_skills=related,
                evidence_strength=EvidenceStrength.WEAK,
                confidence=0.50,
                metadata={"institution": college_name},
            )
        )

    # 6. Academic Achievements → EvidenceType.OTHER
    academic_achievements = profile.get("academicAchievements") or []
    for ach in academic_achievements:
        if not isinstance(ach, dict):
            continue
        title = ach.get("title") or ""
        if not title.strip():
            continue
        desc = ach.get("description") or ""
        org = ach.get("organization") or "Academic Institution"
        related = _extract_skills_from_string(f"{title} {desc}")
        if not related:
            canon_ach, _ = _resolve_canonical_skill(title)
            related = [canon_ach]

        evidence_items.append(
            EvidenceItem(
                evidence_type=EvidenceType.OTHER,
                title=title,
                description=desc or f"Academic achievement at {org}",
                source=org,
                url=ach.get("credentialUrl"),
                related_skills=related,
                evidence_strength=EvidenceStrength.WEAK,
                confidence=0.50,
                metadata={"category": "academic"},
            )
        )

    # 7. Experience → EvidenceType.OTHER
    experience = profile.get("experience") or []
    for exp in experience:
        if not isinstance(exp, dict):
            continue
        role = exp.get("role") or ""
        org = exp.get("organization") or ""
        desc = exp.get("description") or ""
        techs = exp.get("technologies") or []
        if not (role or org or desc or techs):
            continue

        related = []
        seen_exp_skills = set()
        for t in techs:
            c, _ = _resolve_canonical_skill(str(t))
            if c.lower() not in seen_exp_skills:
                related.append(c)
                seen_exp_skills.add(c.lower())
        for c in _extract_skills_from_string(desc):
            if c.lower() not in seen_exp_skills:
                related.append(c)
                seen_exp_skills.add(c.lower())

        if not related:
            continue

        if techs and desc:
            strength = EvidenceStrength.MODERATE
            confidence = 0.65
        else:
            strength = EvidenceStrength.WEAK
            confidence = 0.50

        evidence_items.append(
            EvidenceItem(
                evidence_type=EvidenceType.OTHER,
                title=f"{role or 'Role'} at {org or 'Organization'}",
                description=desc or f"Professional experience at {org}",
                source=org or "Work Experience",
                url=None,
                related_skills=related,
                evidence_strength=strength,
                confidence=confidence,
                metadata={"role": role, "organization": org},
            )
        )

    return evidence_items


def calculate_score_breakdown(
    analysis: AnalysisResponse, evidence_items: List[EvidenceItem]
) -> Dict[str, int]:
    """
    Computes explainable score breakdowns aligned with backend expectation:
    - skillConfidence: average confidence across role-required skills (0-100)
    - projectEvidence: average confidence from project artifacts (0-100)
    - codingRigor: average confidence from coding platform and repo artifacts (0-100)
    - academicRigor: average confidence from coursework, certs, and academic proof (0-100)
    """
    # 1. Skill Confidence (match-level alignment)
    if analysis.skill_matches:
        avg_conf = sum(m.candidate_confidence for m in analysis.skill_matches) / len(analysis.skill_matches)
        skill_score = round(avg_conf * 100)
    else:
        skill_score = analysis.readiness_score

    # 2. Project Evidence
    proj_items = [e for e in evidence_items if e.evidence_type == EvidenceType.PROJECT]
    if proj_items:
        proj_score = round(sum(e.confidence for e in proj_items) / len(proj_items) * 100)
    else:
        proj_score = min(skill_score, 45) if analysis.readiness_score > 0 else 0

    # 3. Coding Rigor (coding platform or GitHub repositories)
    code_items = [
        e for e in evidence_items
        if e.evidence_type in (EvidenceType.CODING_PLATFORM, EvidenceType.GITHUB_REPOSITORY)
    ]
    if code_items:
        coding_score = round(sum(e.confidence for e in code_items) / len(code_items) * 100)
    else:
        coding_score = min(skill_score, 45) if analysis.readiness_score > 0 else 0

    # 4. Academic Rigor (coursework, certifications, other achievements)
    acad_items = [
        e for e in evidence_items
        if e.evidence_type in (EvidenceType.COURSEWORK, EvidenceType.CERTIFICATION, EvidenceType.OTHER)
    ]
    if acad_items:
        acad_score = round(sum(e.confidence for e in acad_items) / len(acad_items) * 100)
    else:
        acad_score = min(skill_score, 45) if analysis.readiness_score > 0 else 0

    return {
        "skillConfidence": max(0, min(100, skill_score)),
        "projectEvidence": max(0, min(100, proj_score)),
        "codingRigor": max(0, min(100, coding_score)),
        "academicRigor": max(0, min(100, acad_score)),
    }


def format_compatibility_skills(analysis: AnalysisResponse) -> List[str]:
    """
    Returns canonical claimed skills as a clean list of strings.
    Preserves all claimed skills regardless of evidence status.
    """
    claimed = [
        s.skill_name for s in analysis.aggregated_skills if s.claimed_in_resume
    ]
    if not claimed:
        claimed = [s.skill_name for s in analysis.aggregated_skills]
    return claimed


def format_compatibility_strengths(analysis: AnalysisResponse) -> List[str]:
    """
    Extracts human-readable summaries of strongly supported skills/evidence.
    """
    strengths: List[str] = []

    # Priority 1: Strong matches from role requirements
    for m in analysis.skill_matches:
        if getattr(m, "match_status", "") == "strong_match":
            strengths.append(
                f"Strong evidence in {m.skill_name}: supported by verifiable implementation artifacts (confidence {m.candidate_confidence:.2f})."
            )

    # Priority 2: Other strongly supported aggregated skills
    for s in analysis.aggregated_skills:
        if s.evidence_status == "strongly_supported" and not any(s.skill_name in st for st in strengths):
            strengths.append(
                f"Verified capability in {s.skill_name}: supported by multiple independent evidence artifacts."
            )

    if not strengths:
        strengths.append(
            "Foundational skills present; adding public code repositories and practical project demos will demonstrate verified capability."
        )

    return strengths


def format_compatibility_gaps(analysis: AnalysisResponse, target_role: str) -> List[str]:
    """
    Generates human-readable descriptions of skill gaps using evidence-aware wording.
    Never states a candidate lacks a skill, only that evidence is currently insufficient.
    """
    gaps: List[str] = []
    for gap in analysis.skill_gaps:
        gaps.append(
            f"{gap.skill_name} ({gap.gap_severity} priority): Insufficient practical implementation evidence demonstrated for {target_role} expectations (confidence {gap.candidate_confidence:.2f} vs 0.70 target). Practical project artifacts recommended."
        )

    if not gaps:
        gaps.append(
            f"No critical skill gaps identified for {target_role}. All core requirements meet or exceed evidence thresholds."
        )

    return gaps


def format_compatibility_roadmap(analysis: AnalysisResponse) -> List[Dict[str, Any]]:
    """
    Maps existing deterministic roadmap items to the legacy backend schema,
    preserving priority, ordering, recommended actions, and evidence targets.
    """
    roadmap: List[Dict[str, Any]] = []
    for it in analysis.roadmap.roadmap_items:
        title = it.suggested_project or it.goal or f"Build project for {it.skill_name}"
        duration = it.estimated_effort or "1-2 weeks"
        status_label = "Next" if it.priority == 1 else "Planned"

        roadmap.append({
            "step": str(it.priority),
            "title": title,
            "duration": duration,
            "status": status_label,
            "skill": it.skill_name,
            "priority": it.priority,
            "goal": it.goal,
            "recommendedActions": it.recommended_actions,
            "suggestedEvidence": it.suggested_evidence,
        })

    return roadmap


def adapt_backend_analysis(request: BackendAnalyzeRequest) -> BackendAnalyzeResponse:
    """
    Executes the compatibility pipeline:
    1. Extracts candidateId and targetRole.roleName.
    2. Extracts resume text (or synthesized profile claims).
    3. Converts profile sections into EvidenceItem instances.
    4. Executes existing analyze_candidate orchestrator.
    5. Optionally enriches natural-language explanations with Gemini/fallback LLM.
    6. Constructs legacy-compatible response strictly preserving deterministic scores.
    """
    candidate_id = request.candidateId
    target_role_name = request.targetRole.roleName
    profile = request.profile or {}

    # Extract resume text and external evidence
    resume_text = extract_resume_text(profile)
    evidence_items = convert_profile_to_evidence(profile)

    # Execute deterministic analysis pipeline
    analysis = analyze_candidate(
        resume_text=resume_text,
        target_role=target_role_name,
        evidence_items=evidence_items,
    )

    # Optional Gemini / Fallback LLM natural language explanation
    model_name = "profiq-gemini-2.5-flash" if is_gemini_configured() else "profiq-deterministic-pipeline"
    try:
        llm_exp = generate_candidate_explanation(analysis)
        if llm_exp and getattr(llm_exp, "provider", "") == "gemini":
            model_name = "gemini-2.5-flash"
    except Exception:
        # LLM failure must never break deterministic response
        model_name = "profiq-deterministic-pipeline"

    # Assemble legacy-compatible fields
    score_breakdown = calculate_score_breakdown(analysis, evidence_items)
    skills = format_compatibility_skills(analysis)
    strengths = format_compatibility_strengths(analysis)
    gaps = format_compatibility_gaps(analysis, target_role_name)
    roadmap = format_compatibility_roadmap(analysis)

    raw_explanations = getattr(analysis, "evidence_explanations", [])
    evidence_explanations = [
        e.model_dump() if hasattr(e, "model_dump") else dict(e)
        for e in raw_explanations
    ]

    data = CompatibilityAnalysisData(
        candidateId=candidate_id,
        readinessScore=analysis.readiness_score,
        scoreBreakdown=score_breakdown,
        skills=skills,
        strengths=strengths,
        gaps=gaps,
        roadmap=roadmap,
        evidence_explanations=evidence_explanations,
        evidenceExplanations=evidence_explanations,
    )

    metadata = CompatibilityMetadata(
        serviceVersion="1.0.0",
        model=model_name,
        analyzedAt=datetime.now(timezone.utc).isoformat(),
        evidence_explanations=evidence_explanations,
    )

    return BackendAnalyzeResponse(
        success=True,
        data=data,
        metadata=metadata,
        evidence_explanations=evidence_explanations,
    )
