"""
Skills Dictionary Configuration

Structured canonical skills taxonomy mapped to recognized categories
and common textual aliases/variations found in resumes.
"""

SKILL_CATEGORIES = [
    "Programming Languages",
    "Web Development",
    "Databases",
    "Machine Learning",
    "Data Science",
    "Cloud",
    "DevOps",
    "Tools",
    "Computer Science Fundamentals",
]

# Each entry defines:
# - name: Canonical display name
# - category: One of SKILL_CATEGORIES
# - aliases: List of case-insensitive textual variations/synonyms (sorted by length descending during search)
SKILL_DEFINITIONS = [
    # 1. Programming Languages
    {
        "name": "Python",
        "category": "Programming Languages",
        "aliases": ["python 3.x", "python 3", "python3", "python 2", "python"],
    },
    {
        "name": "JavaScript",
        "category": "Programming Languages",
        "aliases": ["javascript", "ecmascript", "es6", "es6+", "js"],
    },
    {
        "name": "TypeScript",
        "category": "Programming Languages",
        "aliases": ["typescript", "ts"],
    },
    {
        "name": "Java",
        "category": "Programming Languages",
        "aliases": ["core java", "java 17", "java 11", "java 8", "java"],
    },
    {
        "name": "C++",
        "category": "Programming Languages",
        "aliases": ["c++", "cpp", "c/c++"],
    },
    {
        "name": "C#",
        "category": "Programming Languages",
        "aliases": ["c#", "csharp", "c-sharp"],
    },
    {
        "name": "C",
        "category": "Programming Languages",
        "aliases": ["c language", "c programming", "C"],
    },
    {
        "name": "Go",
        "category": "Programming Languages",
        "aliases": ["golang", "go language", "go lang"],
    },
    {
        "name": "Rust",
        "category": "Programming Languages",
        "aliases": ["rust lang", "rust"],
    },
    {
        "name": "Kotlin",
        "category": "Programming Languages",
        "aliases": ["kotlin"],
    },
    {
        "name": "Swift",
        "category": "Programming Languages",
        "aliases": ["swift"],
    },
    {
        "name": "PHP",
        "category": "Programming Languages",
        "aliases": ["php"],
    },
    {
        "name": "Ruby",
        "category": "Programming Languages",
        "aliases": ["ruby on rails", "ruby"],
    },
    {
        "name": "SQL",
        "category": "Programming Languages",
        "aliases": ["sql", "structured query language", "transact-sql", "t-sql", "pl/sql"],
    },

    # 2. Web Development
    {
        "name": "React",
        "category": "Web Development",
        "aliases": ["react.js", "reactjs", "react js", "react"],
    },
    {
        "name": "Next.js",
        "category": "Web Development",
        "aliases": ["next.js", "nextjs", "next js"],
    },
    {
        "name": "Vue.js",
        "category": "Web Development",
        "aliases": ["vue.js", "vuejs", "vue js", "vue"],
    },
    {
        "name": "Angular",
        "category": "Web Development",
        "aliases": ["angular.js", "angularjs", "angular"],
    },
    {
        "name": "Node.js",
        "category": "Web Development",
        "aliases": ["node.js", "nodejs", "node js", "node"],
    },
    {
        "name": "Express",
        "category": "Web Development",
        "aliases": ["express.js", "expressjs", "express js", "express"],
    },
    {
        "name": "FastAPI",
        "category": "Web Development",
        "aliases": ["fastapi", "fast api"],
    },
    {
        "name": "Django",
        "category": "Web Development",
        "aliases": ["django framework", "django rest framework", "django", "drf"],
    },
    {
        "name": "Flask",
        "category": "Web Development",
        "aliases": ["flask"],
    },
    {
        "name": "Spring Boot",
        "category": "Web Development",
        "aliases": ["spring boot", "springboot", "spring-boot", "spring framework"],
    },
    {
        "name": "HTML5",
        "category": "Web Development",
        "aliases": ["html5", "html"],
    },
    {
        "name": "CSS3",
        "category": "Web Development",
        "aliases": ["css3", "css"],
    },
    {
        "name": "TailwindCSS",
        "category": "Web Development",
        "aliases": ["tailwindcss", "tailwind css", "tailwind"],
    },
    {
        "name": "REST APIs",
        "category": "Web Development",
        "aliases": ["restful api", "restful apis", "rest apis", "rest api", "rest"],
    },
    {
        "name": "GraphQL",
        "category": "Web Development",
        "aliases": ["graphql", "graph ql"],
    },

    # 3. Databases
    {
        "name": "PostgreSQL",
        "category": "Databases",
        "aliases": ["postgresql", "postgres", "psql"],
    },
    {
        "name": "MongoDB",
        "category": "Databases",
        "aliases": ["mongodb", "mongo db", "mongo"],
    },
    {
        "name": "MySQL",
        "category": "Databases",
        "aliases": ["mysql"],
    },
    {
        "name": "Redis",
        "category": "Databases",
        "aliases": ["redis"],
    },
    {
        "name": "SQLite",
        "category": "Databases",
        "aliases": ["sqlite3", "sqlite"],
    },
    {
        "name": "Firebase",
        "category": "Databases",
        "aliases": ["firebase firestore", "firebase", "firestore"],
    },
    {
        "name": "Elasticsearch",
        "category": "Databases",
        "aliases": ["elasticsearch", "elastic search"],
    },

    # 4. Machine Learning
    {
        "name": "Machine Learning",
        "category": "Machine Learning",
        "aliases": ["machine learning", "ml algorithms", "ml models", "ml"],
    },
    {
        "name": "Deep Learning",
        "category": "Machine Learning",
        "aliases": ["deep learning", "neural networks", "ann", "cnn", "rnn"],
    },
    {
        "name": "Natural Language Processing",
        "category": "Machine Learning",
        "aliases": ["natural language processing", "nlp"],
    },
    {
        "name": "Computer Vision",
        "category": "Machine Learning",
        "aliases": ["computer vision", "opencv"],
    },
    {
        "name": "TensorFlow",
        "category": "Machine Learning",
        "aliases": ["tensorflow 2.0", "tensorflow", "tf"],
    },
    {
        "name": "PyTorch",
        "category": "Machine Learning",
        "aliases": ["pytorch", "torch"],
    },
    {
        "name": "Scikit-Learn",
        "category": "Machine Learning",
        "aliases": ["scikit-learn", "scikit learn", "sklearn"],
    },
    {
        "name": "Large Language Models",
        "category": "Machine Learning",
        "aliases": ["large language models", "llm", "llms", "generative ai", "genai", "langchain"],
    },

    # 5. Data Science
    {
        "name": "Data Science",
        "category": "Data Science",
        "aliases": ["data science"],
    },
    {
        "name": "Pandas",
        "category": "Data Science",
        "aliases": ["pandas"],
    },
    {
        "name": "NumPy",
        "category": "Data Science",
        "aliases": ["numpy"],
    },
    {
        "name": "Data Analysis",
        "category": "Data Science",
        "aliases": ["exploratory data analysis", "data analysis", "eda"],
    },
    {
        "name": "Data Visualization",
        "category": "Data Science",
        "aliases": ["data visualization", "matplotlib", "seaborn", "tableau"],
    },
    {
        "name": "Statistics",
        "category": "Data Science",
        "aliases": [
            "statistics",
            "statistical analysis",
            "probability & statistics",
            "probability and statistics",
            "inferential statistics",
        ],
    },
    {
        "name": "Power BI",
        "category": "Data Science",
        "aliases": ["power bi", "powerbi", "microsoft power bi"],
    },

    # 6. Cloud
    {
        "name": "AWS",
        "category": "Cloud",
        "aliases": ["amazon web services", "aws ec2", "aws s3", "aws lambda", "aws"],
    },
    {
        "name": "Google Cloud",
        "category": "Cloud",
        "aliases": ["google cloud platform", "google cloud", "gcp"],
    },
    {
        "name": "Azure",
        "category": "Cloud",
        "aliases": ["microsoft azure", "azure cloud", "azure"],
    },

    # 7. DevOps
    {
        "name": "Docker",
        "category": "DevOps",
        "aliases": ["docker compose", "docker container", "docker", "containerization"],
    },
    {
        "name": "Kubernetes",
        "category": "DevOps",
        "aliases": ["kubernetes", "k8s"],
    },
    {
        "name": "CI/CD",
        "category": "DevOps",
        "aliases": ["ci/cd", "continuous integration", "continuous deployment", "github actions", "gitlab ci", "jenkins"],
    },
    {
        "name": "Linux",
        "category": "DevOps",
        "aliases": ["linux", "ubuntu", "bash", "shell scripting"],
    },

    # 8. Tools
    {
        "name": "Git",
        "category": "Tools",
        "aliases": ["git version control", "git/github", "git", "github", "gitlab"],
    },
    {
        "name": "Postman",
        "category": "Tools",
        "aliases": ["postman"],
    },
    {
        "name": "VS Code",
        "category": "Tools",
        "aliases": ["vs code", "vscode", "visual studio code"],
    },
    {
        "name": "Jira",
        "category": "Tools",
        "aliases": ["jira"],
    },
    {
        "name": "Figma",
        "category": "Tools",
        "aliases": ["figma"],
    },
    {
        "name": "Excel",
        "category": "Tools",
        "aliases": ["excel", "microsoft excel", "ms excel", "advanced excel", "spreadsheets"],
    },

    # 9. Computer Science Fundamentals
    {
        "name": "Data Structures & Algorithms",
        "category": "Computer Science Fundamentals",
        "aliases": [
            "data structures & algorithms",
            "data structures and algorithms",
            "data structures",
            "algorithms",
            "dsa",
        ],
    },
    {
        "name": "Object-Oriented Programming",
        "category": "Computer Science Fundamentals",
        "aliases": [
            "object-oriented programming",
            "object oriented programming",
            "oops concepts",
            "oops",
            "oop",
        ],
    },
    {
        "name": "System Design",
        "category": "Computer Science Fundamentals",
        "aliases": ["system design", "distributed systems", "microservices architecture"],
    },
    {
        "name": "Operating Systems",
        "category": "Computer Science Fundamentals",
        "aliases": ["operating systems", "os concepts"],
    },
    {
        "name": "Computer Networks",
        "category": "Computer Science Fundamentals",
        "aliases": ["computer networks", "computer networking", "tcp/ip"],
    },
    {
        "name": "Database Management Systems",
        "category": "Computer Science Fundamentals",
        "aliases": ["database management systems", "dbms", "rdbms"],
    },
]


def get_skill_categories() -> list:
    """Returns the list of supported skill categories."""
    return list(SKILL_CATEGORIES)


def get_all_skills() -> list:
    """Returns all configured canonical skill definitions."""
    return SKILL_DEFINITIONS
