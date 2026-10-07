# ProfiQ — Scoring Methodology & Evaluation Logic

ProfiQ evaluates candidates beyond basic keyword matching by cross-referencing claimed skills with authentic development artifacts.

## Core Scoring Formula

The overall **Employability Readiness Score ($R$)** is computed as:

$$R = (S \times W_s) + (E \times W_e)$$

Where:
- $S$: **Skill Match Score (0–100)**: Alignment and depth of candidate skills matching target role requirements.
- $W_s$: Skill Weight (Default: `0.60` or 60%)
- $E$: **Evidence Verification Score (0–100)**: Authenticity and depth of proof (GitHub repositories, commits, project complexity).
- $W_e$: Evidence Weight (Default: `0.40` or 40%)

---

## 1. Skill Match Score ($S$)
- Direct matching against standardized industry role benchmarks.
- Critical skills carry greater mathematical weight than optional skills:
  - Critical skill: $1.0\times$ weight
  - Recommended skill: $0.7\times$ weight
  - Optional skill: $0.4\times$ weight

---

## 2. Evidence Verification Score ($E$)
- Claims with zero supporting evidence receive a confidence penalty.
- Evidence confidence factors:
  - Public repository with verified commits & matching tech stack: **High Confidence (0.85 - 1.0)**
  - Course completion certificates or listed school projects: **Moderate Confidence (0.50 - 0.70)**
  - Unbacked resume claim: **Low Confidence (0.10 - 0.30)**
