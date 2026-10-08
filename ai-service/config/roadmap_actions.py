"""
Roadmap Actions and Evidence Recommendations Configuration

Defines deterministic learning actions, student-appropriate projects, verifiable
evidence recommendations, and demonstrable capability goals for technical skills.
"""

from typing import Any, Dict, List, Optional
from services.evidence_service import _resolve_canonical_skill

ROADMAP_ACTION_LIBRARY: Dict[str, Dict[str, Any]] = {
    "Python": {
        "goal": "Build demonstrable programming proficiency in Python and software development practices.",
        "recommended_actions": [
            "Practice Python fundamentals",
            "Solve Python programming problems",
            "Build a small Python application",
            "Add the project to GitHub with meaningful commits",
        ],
        "suggested_project": "Build a command-line expense tracker with file persistence.",
        "suggested_evidence": [
            "Public GitHub project",
            "Coding-platform activity",
            "Assessment result",
        ],
    },
    "Machine Learning": {
        "goal": "Develop end-to-end machine learning modeling and evaluation skills.",
        "recommended_actions": [
            "Review supervised and unsupervised learning fundamentals",
            "Implement ML algorithms using Python",
            "Build an end-to-end ML project",
            "Document model evaluation and results",
        ],
        "suggested_project": "Build a machine-learning model that predicts house prices and document model evaluation.",
        "suggested_evidence": [
            "GitHub repository with trained ML pipeline",
            "Model evaluation metric report (MAE, RMSE, R2)",
            "Reproducible Jupyter notebook or inference script",
        ],
    },
    "Data Structures & Algorithms": {
        "goal": "Build demonstrable problem-solving ability in core data structures and algorithms.",
        "recommended_actions": [
            "Practice arrays, strings, stacks, queues and linked lists",
            "Solve progressively harder coding problems",
            "Track coding-platform progress",
            "Complete timed problem-solving assessments",
        ],
        "suggested_project": "Build a mini algorithm visualizer demonstrating sorting and searching algorithms.",
        "suggested_evidence": [
            "Coding-platform problem history",
            "Timed assessment result",
            "GitHub implementations of algorithms",
        ],
    },
    "SQL": {
        "goal": "Develop practical SQL skills sufficient to query and analyze relational datasets.",
        "recommended_actions": [
            "Practice SELECT, JOIN, GROUP BY and subqueries",
            "Solve SQL query problems",
            "Build a small relational database project",
            "Demonstrate queries through a GitHub project",
        ],
        "suggested_project": "Build a student analytics database with joins, aggregation and reporting queries.",
        "suggested_evidence": [
            "GitHub repository containing schema DDL and analytical SQL queries",
            "Database migration or seed script",
            "Coding-platform SQL problem verification badge",
        ],
    },
    "Docker": {
        "goal": "Demonstrate the ability to containerize and run an application.",
        "recommended_actions": [
            "Learn Docker images and containers",
            "Containerize an existing application",
            "Create a Dockerfile and docker-compose configuration",
            "Publish the containerized project to GitHub",
        ],
        "suggested_project": "Containerize an existing FastAPI application with Docker.",
        "suggested_evidence": [
            "GitHub repository containing Dockerfile",
            "Docker Compose configuration",
            "Containerized working application",
        ],
    },
    "Git": {
        "goal": "Demonstrate standard Git version control and collaborative branching workflows.",
        "recommended_actions": [
            "Practice branches, commits and merges",
            "Use meaningful commit messages",
            "Work with pull requests",
            "Maintain a public project repository",
        ],
        "suggested_project": "Create and maintain a public project using branches, pull requests and meaningful commits.",
        "suggested_evidence": [
            "GitHub repository commit history showing atomic commits",
            "Merged pull requests and branch workflow",
            "Structured README documentation",
        ],
    },
    "FastAPI": {
        "goal": "Build demonstrable proficiency in developing and documenting REST APIs with FastAPI.",
        "recommended_actions": [
            "Build REST endpoints with FastAPI",
            "Implement request validation",
            "Add API documentation",
            "Deploy/containerize a FastAPI application",
        ],
        "suggested_project": "Build a task management REST API with Pydantic validation and Swagger documentation.",
        "suggested_evidence": [
            "GitHub repository with FastAPI codebase",
            "Interactive Swagger/OpenAPI documentation screenshot or demo",
            "Automated endpoint test cases",
        ],
    },
    "Object-Oriented Programming": {
        "goal": "Demonstrate clean object-oriented architecture and design pattern principles.",
        "recommended_actions": [
            "Practice classes, inheritance, encapsulation and polymorphism",
            "Build a small object-oriented application",
            "Refactor an existing project using OOP principles",
        ],
        "suggested_project": "Build an object-oriented library management simulation with inheritance and encapsulation.",
        "suggested_evidence": [
            "GitHub repository demonstrating class hierarchies and unit tests",
            "UML class diagram",
            "Code refactoring commit history",
        ],
    },
    "Java": {
        "goal": "Develop demonstrable backend and object-oriented programming proficiency in Java.",
        "recommended_actions": [
            "Review Java core concepts and collection framework",
            "Implement object-oriented Java solutions",
            "Build a backend utility application using Java",
            "Write JUnit tests for core business logic",
        ],
        "suggested_project": "Build a console-based banking application with account management and transaction history.",
        "suggested_evidence": [
            "Public GitHub repository with Maven/Gradle build configuration",
            "Passing JUnit test suite",
            "Clear architectural documentation",
        ],
    },
    "System Design": {
        "goal": "Understand and apply scalable distributed system architecture principles.",
        "recommended_actions": [
            "Study client-server architecture, load balancing, and caching",
            "Design database sharding and replication schemes",
            "Diagram trade-offs between consistency and availability (CAP theorem)",
            "Document end-to-end system designs for common services",
        ],
        "suggested_project": "Create a comprehensive architectural design document and diagram for a URL shortener service.",
        "suggested_evidence": [
            "GitHub repository with architectural design documentation and diagrams",
            "Load testing and latency benchmarking analysis",
            "Proof-of-concept caching implementation",
        ],
    },
    "Statistics": {
        "goal": "Develop practical statistical inference and quantitative analysis capabilities.",
        "recommended_actions": [
            "Review descriptive statistics, probability distributions, and hypothesis testing",
            "Perform statistical tests (t-tests, ANOVA, chi-square) in Python",
            "Analyze dataset variance, confidence intervals, and p-values",
            "Summarize findings in an empirical report",
        ],
        "suggested_project": "Perform an A/B test analysis on conversion rates with hypothesis test verification.",
        "suggested_evidence": [
            "Jupyter notebook demonstrating statistical tests and interpretations",
            "Hypothesis testing summary report",
            "Data visualizations of probability distributions",
        ],
    },
    "Data Analysis": {
        "goal": "Build demonstrable capability in extracting actionable insights from complex datasets.",
        "recommended_actions": [
            "Clean and preprocess raw datasets with missing values",
            "Conduct exploratory data analysis (EDA)",
            "Identify statistical correlations and metric drivers",
            "Present data-backed business insights",
        ],
        "suggested_project": "Conduct an exploratory data analysis on a retail sales dataset to discover seasonal purchasing trends.",
        "suggested_evidence": [
            "Public GitHub repository with EDA notebook",
            "Cleaned dataset and preprocessing scripts",
            "Executive insight presentation slide deck or markdown report",
        ],
    },
    "Pandas": {
        "goal": "Master dataframe manipulation, data wrangling, and aggregation in Pandas.",
        "recommended_actions": [
            "Practice dataframe filtering, indexing, and grouping",
            "Clean messy datasets and handle missing values",
            "Merge, join, and reshape multi-table datasets",
            "Optimize dataframe memory usage and query speed",
        ],
        "suggested_project": "Build an automated data cleansing pipeline for customer transactions using Pandas.",
        "suggested_evidence": [
            "GitHub repository with reusable Pandas transformation functions",
            "Jupyter notebook demonstrating data wrangling workflows",
            "Automated unit tests validating data cleanliness",
        ],
    },
    "NumPy": {
        "goal": "Apply vectorized numerical computation and array operations in NumPy.",
        "recommended_actions": [
            "Practice multi-dimensional array slicing and broadcasting",
            "Implement vector and matrix mathematical operations",
            "Benchmark vectorized operations against vanilla Python loops",
            "Use NumPy to process numerical signals or image data",
        ],
        "suggested_project": "Implement numerical linear regression and matrix operations from scratch using NumPy.",
        "suggested_evidence": [
            "GitHub repository containing vectorized mathematical algorithms",
            "Benchmarking report showing performance gains from vectorization",
            "Unit test assertions verifying numerical accuracy",
        ],
    },
    "Data Visualization": {
        "goal": "Design clear, persuasive charts and dashboards to communicate findings.",
        "recommended_actions": [
            "Learn visual encoding principles and chart selection",
            "Create publication-quality charts using Matplotlib and Seaborn",
            "Build interactive charts using Plotly",
            "Document key findings directly alongside visualizations",
        ],
        "suggested_project": "Build an interactive climate trends dashboard using Plotly.",
        "suggested_evidence": [
            "Interactive visualization dashboard or web notebook",
            "GitHub repository with chart generation code",
            "Visual portfolio demonstrating varied chart typologies",
        ],
    },
    "Excel": {
        "goal": "Demonstrate business spreadsheet modeling, pivot tables, and formula proficiency.",
        "recommended_actions": [
            "Practice lookup formulas (XLOOKUP, INDEX/MATCH)",
            "Build dynamic pivot tables and summary aggregations",
            "Create executive charts with conditional formatting",
            "Automate repetitive tasks with basic macros or Power Query",
        ],
        "suggested_project": "Build a financial budget model with dynamic scenario analysis and pivot dashboards.",
        "suggested_evidence": [
            "Documented Excel workbook with advanced formulas and pivot summaries",
            "Video walkthrough or PDF report of the analytical model",
            "Structured dataset demonstrating Power Query cleaning",
        ],
    },
    "Power BI": {
        "goal": "Develop interactive business intelligence dashboards and DAX data models.",
        "recommended_actions": [
            "Connect and transform multi-source datasets in Power Query",
            "Design star-schema relational data models",
            "Write DAX measures for KPIs and time-intelligence metrics",
            "Publish and share interactive dashboards",
        ],
        "suggested_project": "Build an executive sales performance dashboard with drill-down KPIs and DAX measures.",
        "suggested_evidence": [
            "Power BI report file (.pbix) or published dashboard link",
            "DAX measure documentation repository",
            "Dashboard demonstration video or screenshot walkthrough",
        ],
    },
    "Node.js": {
        "goal": "Build asynchronous server-side applications and REST APIs using Node.js.",
        "recommended_actions": [
            "Master event loop, async/await, and Node.js core modules",
            "Build an Express.js HTTP server with routing and middleware",
            "Implement JWT authentication and secure header handling",
            "Write integration tests using Jest or Supertest",
        ],
        "suggested_project": "Build a real-time collaborative notes backend with authentication and database persistence.",
        "suggested_evidence": [
            "GitHub repository with structured Node.js/Express service",
            "Integration test suite with coverage report",
            "Postman API collection or OpenAPI documentation",
        ],
    },
    "REST APIs": {
        "goal": "Design, implement, and document standard RESTful web services.",
        "recommended_actions": [
            "Follow HTTP methods, status codes, and URI path conventions",
            "Implement CRUD endpoints with payload validation and error handling",
            "Add rate limiting, pagination, and sorting parameters",
            "Create OpenAPI/Swagger documentation",
        ],
        "suggested_project": "Design and build a bookstore REST API adhering strictly to RESTful conventions.",
        "suggested_evidence": [
            "GitHub repository with REST API implementation",
            "Interactive OpenAPI/Swagger documentation",
            "Automated API contract test suite",
        ],
    },
    "MongoDB": {
        "goal": "Design document-oriented databases and write aggregation pipelines in MongoDB.",
        "recommended_actions": [
            "Model document schemas, sub-documents, and references",
            "Write CRUD operations with indexing for query optimization",
            "Build multi-stage aggregation pipelines for analytics",
            "Integrate MongoDB with a backend application via an ODM",
        ],
        "suggested_project": "Build an e-commerce product catalog with category filtering and faceted search in MongoDB.",
        "suggested_evidence": [
            "GitHub repository containing MongoDB ODM models and aggregation queries",
            "Database seeding script with sample documents",
            "Query execution explain-plan demonstrating index utilization",
        ],
    },
}


def get_skill_roadmap_actions(skill_name: str) -> Dict[str, Any]:
    """
    Retrieves curated roadmap guidance for a skill, normalizing common aliases
    (e.g., 'DSA', 'OOP', 'ML') and falling back to a structured generic template.
    """
    canonical_name, _ = _resolve_canonical_skill(skill_name)

    if canonical_name in ROADMAP_ACTION_LIBRARY:
        return ROADMAP_ACTION_LIBRARY[canonical_name]

    # Case-insensitive match check
    for key, data in ROADMAP_ACTION_LIBRARY.items():
        if key.lower() == canonical_name.lower():
            return data

    # Generic fallback for unknown or niche skills
    return {
        "goal": f"Build demonstrable practical capability in {canonical_name}.",
        "recommended_actions": [
            f"Review the core concepts of {canonical_name}",
            "Complete practical exercises",
            f"Build a small project demonstrating {canonical_name}",
            "Publish and document the work",
            "Complete an assessment",
        ],
        "suggested_project": f"Build a practical demonstration project showcasing core {canonical_name} concepts.",
        "suggested_evidence": [
            f"Public GitHub repository demonstrating {canonical_name}",
            "Project documentation with setup instructions and execution logs",
            "Assessment or coding-platform problem verification",
        ],
    }
