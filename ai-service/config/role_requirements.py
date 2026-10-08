"""
Role Requirements Configuration

Defines canonical industry job roles, expected skills, controlled importance levels,
and textual aliases for deterministic role resolution.
"""

from typing import Any, Dict, List, Optional

IMPORTANCE_WEIGHTS: Dict[str, float] = {
    "high": 1.0,
    "medium": 0.6,
    "low": 0.3,
}

ROLE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "AI Engineer": {
        "title": "AI Engineer",
        "description": "Develops, deploys, and optimizes artificial intelligence and machine learning models in production systems.",
        "aliases": [
            "ai engineer",
            "ai/ml engineer",
            "ai ml engineer",
            "machine learning engineer",
            "ml engineer",
            "artificial intelligence engineer",
        ],
        "requirements": [
            {
                "skill": "Python",
                "importance": "high",
                "description": "Core programming language commonly required for AI engineering.",
            },
            {
                "skill": "Machine Learning",
                "importance": "high",
                "description": "Foundational understanding of supervised, unsupervised, and deep learning paradigms.",
            },
            {
                "skill": "Data Structures & Algorithms",
                "importance": "medium",
                "description": "Essential for writing performant and scalable data pipeline algorithms.",
            },
            {
                "skill": "SQL",
                "importance": "medium",
                "description": "Critical for querying and preparing training datasets from relational databases.",
            },
            {
                "skill": "Git",
                "importance": "medium",
                "description": "Source code version control and collaborative development workflow.",
            },
            {
                "skill": "Docker",
                "importance": "medium",
                "description": "Containerization for deploying models and consistent execution environments.",
            },
            {
                "skill": "FastAPI",
                "importance": "low",
                "description": "High-performance ASGI framework for serving model inference REST APIs.",
            },
        ],
    },
    "Software Engineer": {
        "title": "Software Engineer",
        "description": "Designs, implements, and maintains robust, scalable software systems across the technology stack.",
        "aliases": [
            "software engineer",
            "sde",
            "sde 1",
            "sde-1",
            "sde i",
            "software developer",
            "swe",
            "software development engineer",
        ],
        "requirements": [
            {
                "skill": "Data Structures & Algorithms",
                "importance": "high",
                "description": "Core computer science foundation for writing optimal algorithms and problem solving.",
            },
            {
                "skill": "Object-Oriented Programming",
                "importance": "high",
                "description": "Fundamental paradigm for scalable code architecture and modular system design.",
            },
            {
                "skill": "Python",
                "importance": "medium",
                "description": "Versatile language widely used in automation, backend services, and scripting.",
            },
            {
                "skill": "Java",
                "importance": "medium",
                "description": "Enterprise application and backend development language.",
            },
            {
                "skill": "SQL",
                "importance": "medium",
                "description": "Database query language essential for relational data persistence and retrieval.",
            },
            {
                "skill": "Git",
                "importance": "medium",
                "description": "Distributed version control standard for team software development.",
            },
            {
                "skill": "System Design",
                "importance": "low",
                "description": "Architectural design principles for building reliable, distributed applications.",
            },
        ],
    },
    "Data Scientist": {
        "title": "Data Scientist",
        "description": "Applies statistical analysis, machine learning, and data modeling to uncover insights and solve complex business problems.",
        "aliases": [
            "data scientist",
            "ds",
            "applied scientist",
            "data science specialist",
        ],
        "requirements": [
            {
                "skill": "Python",
                "importance": "high",
                "description": "Primary programming language for data manipulation, modeling, and statistical analysis.",
            },
            {
                "skill": "Machine Learning",
                "importance": "high",
                "description": "Predictive modeling, regression, classification, and clustering techniques.",
            },
            {
                "skill": "Statistics",
                "importance": "high",
                "description": "Hypothesis testing, probability distributions, and rigorous quantitative inference.",
            },
            {
                "skill": "SQL",
                "importance": "high",
                "description": "Essential for extracting, filtering, and aggregating enterprise data.",
            },
            {
                "skill": "Data Analysis",
                "importance": "medium",
                "description": "Exploratory data analysis to discover patterns, trends, and anomalies.",
            },
            {
                "skill": "Pandas",
                "importance": "medium",
                "description": "Dataframe manipulation library for data cleansing and feature preparation.",
            },
            {
                "skill": "NumPy",
                "importance": "medium",
                "description": "Scientific computing package providing n-dimensional arrays and mathematical functions.",
            },
            {
                "skill": "Data Visualization",
                "importance": "medium",
                "description": "Communicating quantitative findings through effective visual representations.",
            },
        ],
    },
    "Data Analyst": {
        "title": "Data Analyst",
        "description": "Transforms raw data into actionable business intelligence, reports, and executive dashboards.",
        "aliases": [
            "data analyst",
            "business data analyst",
            "bi analyst",
            "business intelligence analyst",
        ],
        "requirements": [
            {
                "skill": "SQL",
                "importance": "high",
                "description": "Core skill for querying databases, writing joins, and aggregating business metrics.",
            },
            {
                "skill": "Excel",
                "importance": "high",
                "description": "Standard tool for spreadsheet modeling, pivot tables, and financial/business reporting.",
            },
            {
                "skill": "Data Analysis",
                "importance": "high",
                "description": "Interpreting business datasets to identify KPI drivers and operational insights.",
            },
            {
                "skill": "Statistics",
                "importance": "high",
                "description": "Descriptive statistics, variance analysis, and sampling for accurate metric reporting.",
            },
            {
                "skill": "Python",
                "importance": "medium",
                "description": "Automating reporting pipelines and performing advanced analytical processing.",
            },
            {
                "skill": "Data Visualization",
                "importance": "medium",
                "description": "Designing clear, intuitive visual charts for stakeholder presentations.",
            },
            {
                "skill": "Power BI",
                "importance": "medium",
                "description": "Business intelligence dashboard creation and DAX data modeling.",
            },
        ],
    },
    "Backend Developer": {
        "title": "Backend Developer",
        "description": "Builds and optimizes server-side logic, API architectures, and database management systems.",
        "aliases": [
            "backend developer",
            "backend engineer",
            "server-side developer",
            "back-end developer",
            "back-end engineer",
        ],
        "requirements": [
            {
                "skill": "Node.js",
                "importance": "high",
                "description": "Asynchronous JavaScript runtime for high-throughput server applications.",
            },
            {
                "skill": "REST APIs",
                "importance": "high",
                "description": "Standard architectural pattern for designing scalable HTTP web services.",
            },
            {
                "skill": "SQL",
                "importance": "high",
                "description": "Relational database design, query optimization, and schema migrations.",
            },
            {
                "skill": "MongoDB",
                "importance": "medium",
                "description": "Document-oriented NoSQL database for flexible data storage models.",
            },
            {
                "skill": "Git",
                "importance": "medium",
                "description": "Branching strategies and version control for team code review workflows.",
            },
            {
                "skill": "Docker",
                "importance": "medium",
                "description": "Packaging services into isolated containers for seamless cloud deployment.",
            },
            {
                "skill": "System Design",
                "importance": "medium",
                "description": "Structuring distributed systems, caching layers, and load balancing.",
            },
        ],
    },
}


# Precompute normalized alias lookup table
_ROLE_ALIAS_LOOKUP: Dict[str, str] = {}
for canonical_title, role_data in ROLE_DEFINITIONS.items():
    _ROLE_ALIAS_LOOKUP[canonical_title.lower()] = canonical_title
    for alias in role_data.get("aliases", []):
        _ROLE_ALIAS_LOOKUP[alias.lower()] = canonical_title


def find_canonical_role_name(input_role: str) -> Optional[str]:
    """
    Deterministically resolves an input role string (or alias) to its canonical role name.
    Returns None if the role is not recognized.
    """
    if not input_role or not isinstance(input_role, str):
        return None

    cleaned = input_role.strip().lower()
    # Normalize multiple whitespace characters
    cleaned = " ".join(cleaned.split())

    return _ROLE_ALIAS_LOOKUP.get(cleaned)


def get_supported_roles() -> List[str]:
    """Returns the list of all canonical supported role names."""
    return list(ROLE_DEFINITIONS.keys())


def get_role_definition(canonical_name: str) -> Optional[Dict[str, Any]]:
    """Retrieves the full specification for a canonical role name."""
    return ROLE_DEFINITIONS.get(canonical_name)
