/**
 * Predefined benchmark Job Roles catalog for ProfiQ.
 * 
 * Contains structured role definitions for 10 core industry tracks:
 * 1. Software Engineer
 * 2. Frontend Developer
 * 3. Backend Developer
 * 4. Full Stack Developer
 * 5. Data Analyst
 * 6. Data Scientist
 * 7. Machine Learning Engineer
 * 8. DevOps Engineer
 * 9. UI/UX Designer
 * 10. Cybersecurity Analyst
 * 
 * Importance enum: 'core' | 'important' | 'optional'
 * ExpectedLevel enum: 'beginner' | 'intermediate' | 'advanced'
 */

const SEED_JOB_ROLES = [
  {
    name: 'Software Engineer',
    slug: 'software-engineer',
    category: 'Engineering',
    description: 'Generalist software engineering role emphasizing data structures, algorithmic efficiency, clean software architecture, and collaborative version control.',
    requiredSkills: [
      { skillName: 'Data Structures & Algorithms', category: 'programming', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Java', category: 'programming', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Git', category: 'tools', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'System Design', category: 'backend', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'SQL', category: 'database', importance: 'important', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'Linux', category: 'tools', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Docker', category: 'devops', importance: 'important', expectedLevel: 'beginner' },
      { skillName: 'CI/CD', category: 'devops', importance: 'optional', expectedLevel: 'beginner' },
    ],
    responsibilities: [
      'Write modular, well-tested, maintainable production software',
      'Optimize runtime complexities and solve complex computational challenges',
      'Collaborate through pull requests, code reviews, and version control',
      'Interface with relational and non-relational database layers',
    ],
    commonTechnologies: ['Java', 'C++', 'Python', 'Git', 'Linux', 'SQL'],
    relevantCertifications: [
      'Oracle Certified Professional: Java SE',
      'AWS Certified Cloud Practitioner',
    ],
    relevantCoursework: [
      'Data Structures and Algorithms',
      'Operating Systems',
      'Database Management Systems',
      'Object-Oriented Programming',
    ],
    experienceExpectations: [
      'Solid algorithmic foundations demonstrated via coding assessments or repositories',
      '1-2 software engineering projects displaying clean design patterns',
    ],
    active: true,
  },

  {
    name: 'Frontend Developer',
    slug: 'frontend-developer',
    category: 'Engineering',
    description: 'Client-side web specialist dedicated to building interactive, responsive, and performant user interfaces with modern JavaScript frameworks.',
    requiredSkills: [
      { skillName: 'HTML', category: 'frontend', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'CSS', category: 'frontend', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'JavaScript', category: 'programming', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'React', category: 'frontend', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Git', category: 'tools', importance: 'important', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'TypeScript', category: 'programming', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Next.js', category: 'frontend', importance: 'important', expectedLevel: 'beginner' },
      { skillName: 'Tailwind CSS', category: 'frontend', importance: 'optional', expectedLevel: 'intermediate' },
      { skillName: 'Redux', category: 'frontend', importance: 'optional', expectedLevel: 'intermediate' },
    ],
    responsibilities: [
      'Develop pixel-perfect, accessible, and responsive user interfaces',
      'Manage client-side application state and lifecycle efficiently',
      'Integrate REST APIs and asynchronous data fetching',
      'Ensure cross-browser compatibility and frontend performance',
    ],
    commonTechnologies: ['HTML5', 'CSS3', 'JavaScript', 'React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    relevantCertifications: [
      'Meta Front-End Developer Professional Certificate',
    ],
    relevantCoursework: [
      'Web Development Fundamentals',
      'Human-Computer Interaction',
      'User Interface Engineering',
    ],
    experienceExpectations: [
      'Portfolio or GitHub repositories demonstrating responsive web applications',
      'Experience handling component architecture, state management, and API handling',
    ],
    active: true,
  },

  {
    name: 'Backend Developer',
    slug: 'backend-developer',
    category: 'Engineering',
    description: 'Server-side architect focused on scalable RESTful microservices, database schemas, secure authentication, and robust infrastructure integration.',
    requiredSkills: [
      { skillName: 'Node.js', category: 'backend', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Express.js', category: 'backend', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'REST APIs', category: 'backend', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'MongoDB', category: 'database', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'SQL', category: 'database', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Git', category: 'tools', importance: 'core', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'Redis', category: 'database', importance: 'important', expectedLevel: 'beginner' },
      { skillName: 'Docker', category: 'devops', importance: 'important', expectedLevel: 'beginner' },
      { skillName: 'System Design', category: 'backend', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'AWS', category: 'cloud', importance: 'optional', expectedLevel: 'beginner' },
    ],
    responsibilities: [
      'Design, implement, and maintain high-performance REST APIs',
      'Structure relational and document-oriented database models with indices',
      'Implement authentication, authorization (JWT), and rate-limiting safeguards',
      'Debug concurrency, latency, and throughput bottlenecks',
    ],
    commonTechnologies: ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Git'],
    relevantCertifications: [
      'OpenJS Node.js Application Developer (JSNAD)',
      'AWS Certified Developer - Associate',
    ],
    relevantCoursework: [
      'Database Management Systems',
      'Distributed Systems',
      'Computer Networks & Protocols',
      'Backend Systems Engineering',
    ],
    experienceExpectations: [
      'Experience designing CRUD endpoints with validation and error handling',
      'Familiarity with query optimization, schema indexing, and security best practices',
    ],
    active: true,
  },

  {
    name: 'Full Stack Developer',
    slug: 'full-stack-developer',
    category: 'Engineering',
    description: 'End-to-end web developer proficient in crafting fluid UI experiences as well as architecting resilient server-side services and databases.',
    requiredSkills: [
      { skillName: 'JavaScript', category: 'programming', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'React', category: 'frontend', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Node.js', category: 'backend', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Express.js', category: 'backend', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'REST APIs', category: 'backend', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'MongoDB', category: 'database', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Git', category: 'tools', importance: 'core', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'TypeScript', category: 'programming', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'PostgreSQL', category: 'database', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Docker', category: 'devops', importance: 'optional', expectedLevel: 'beginner' },
      { skillName: 'Next.js', category: 'frontend', importance: 'optional', expectedLevel: 'beginner' },
    ],
    responsibilities: [
      'Architect and ship features from frontend user interfaces to backend databases',
      'Manage end-to-end data flow between React components and Express controllers',
      'Write clean APIs, validate incoming inputs, and maintain persistent data integrity',
      'Deploy and maintain integrated web applications',
    ],
    commonTechnologies: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Git'],
    relevantCertifications: [
      'Full Stack Web Development Certificate',
      'AWS Certified Cloud Practitioner',
    ],
    relevantCoursework: [
      'Full Stack Web Engineering',
      'Software Engineering Principles',
      'Database Management Systems',
    ],
    experienceExpectations: [
      'Full-stack project deployed with live database persistence and client UI',
      'Demonstrated understanding of CORS, auth tokens, and client-server coordination',
    ],
    active: true,
  },

  {
    name: 'Data Analyst',
    slug: 'data-analyst',
    category: 'Data & Analytics',
    description: 'Analytical practitioner transforming raw business and operational data into clear visualizations, actionable reports, and statistical insights.',
    requiredSkills: [
      { skillName: 'SQL', category: 'database', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Excel', category: 'data', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Python', category: 'programming', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Data Visualization', category: 'data', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Statistics', category: 'data', importance: 'important', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'Power BI', category: 'data', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Tableau', category: 'data', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Pandas', category: 'data', importance: 'important', expectedLevel: 'intermediate' },
    ],
    responsibilities: [
      'Query and aggregate large datasets using complex multi-table SQL queries',
      'Build automated executive dashboards and reporting pipelines',
      'Perform exploratory analysis to identify operational trends and anomalies',
      'Communicate data-backed recommendations to cross-functional stakeholders',
    ],
    commonTechnologies: ['SQL', 'Python', 'Pandas', 'Excel', 'Power BI', 'Tableau'],
    relevantCertifications: [
      'Google Data Analytics Professional Certificate',
      'Microsoft Certified: Power BI Data Analyst Associate',
    ],
    relevantCoursework: [
      'Applied Statistics',
      'Business Intelligence & Reporting',
      'Database Querying & Management',
    ],
    experienceExpectations: [
      'Demonstrated analytical case studies querying datasets and visualizing findings',
      'Competence with aggregations, window functions, and business metrics',
    ],
    active: true,
  },

  {
    name: 'Data Scientist',
    slug: 'data-scientist',
    category: 'Data & Analytics',
    description: 'Quantitative specialist combining advanced statistical modeling, exploratory data analysis, and machine learning to build predictive solutions.',
    requiredSkills: [
      { skillName: 'Python', category: 'programming', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'SQL', category: 'database', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Statistics', category: 'data', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Pandas', category: 'data', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'NumPy', category: 'data', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Scikit-learn', category: 'machine-learning', importance: 'core', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'Machine Learning', category: 'machine-learning', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Data Visualization', category: 'data', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Deep Learning', category: 'machine-learning', importance: 'optional', expectedLevel: 'beginner' },
    ],
    responsibilities: [
      'Conduct rigorous exploratory data analysis and hypothesis testing',
      'Engineer predictive features and handle class imbalance or data leakage',
      'Train, cross-validate, and benchmark machine learning models',
      'Translate quantitative findings into strategic actionable insights',
    ],
    commonTechnologies: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Jupyter', 'Matplotlib'],
    relevantCertifications: [
      'IBM Data Science Professional Certificate',
    ],
    relevantCoursework: [
      'Linear Algebra & Calculus',
      'Probability & Mathematical Statistics',
      'Statistical Machine Learning',
      'Data Mining',
    ],
    experienceExpectations: [
      'Jupyter notebooks or projects showcasing end-to-end data cleaning, EDA, and model validation',
      'Understanding of precision, recall, ROC-AUC, and regression metrics',
    ],
    active: true,
  },

  {
    name: 'Machine Learning Engineer',
    slug: 'machine-learning-engineer',
    category: 'Data & Analytics',
    description: 'Engineer focused on productionizing ML and deep learning models, building automated retraining pipelines, and serving high-throughput inference APIs.',
    requiredSkills: [
      { skillName: 'Python', category: 'programming', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Machine Learning', category: 'machine-learning', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'PyTorch', category: 'machine-learning', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Scikit-learn', category: 'machine-learning', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Data Structures & Algorithms', category: 'programming', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Git', category: 'tools', importance: 'core', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'Docker', category: 'devops', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'FastAPI', category: 'backend', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Deep Learning', category: 'machine-learning', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'TensorFlow', category: 'machine-learning', importance: 'optional', expectedLevel: 'intermediate' },
    ],
    responsibilities: [
      'Design, train, and fine-tune machine learning and deep learning models',
      'Wrap models in low-latency FastAPI inference microservices',
      'Containerize ML workloads with Docker and manage versioned artifacts',
      'Monitor inference performance, model drift, and latency',
    ],
    commonTechnologies: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'Docker', 'Scikit-learn', 'Git'],
    relevantCertifications: [
      'AWS Certified Machine Learning - Specialty',
      'TensorFlow Developer Certificate',
    ],
    relevantCoursework: [
      'Deep Learning & Neural Networks',
      'Machine Learning Systems Design',
      'High Performance Computing',
    ],
    experienceExpectations: [
      'Demonstrated model training and deployment via inference API endpoints',
      'Understanding of tensor manipulation, gradient optimization, and model serialization',
    ],
    active: true,
  },

  {
    name: 'DevOps Engineer',
    slug: 'devops-engineer',
    category: 'Infrastructure',
    description: 'Infrastructure and automation specialist managing CI/CD pipelines, container orchestration, cloud environments, and site reliability.',
    requiredSkills: [
      { skillName: 'Linux', category: 'tools', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Docker', category: 'devops', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'CI/CD', category: 'devops', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Git', category: 'tools', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'AWS', category: 'cloud', importance: 'core', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'Kubernetes', category: 'devops', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Python', category: 'programming', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'System Design', category: 'backend', importance: 'important', expectedLevel: 'intermediate' },
    ],
    responsibilities: [
      'Build and maintain reliable continuous integration and deployment workflows',
      'Containerize multi-tier services and configure networking and volumes',
      'Provision and manage cloud infrastructure using infrastructure-as-code principles',
      'Monitor system availability, logs, alerting, and automated failover',
    ],
    commonTechnologies: ['Docker', 'Kubernetes', 'GitHub Actions', 'Linux', 'AWS', 'Bash', 'Git'],
    relevantCertifications: [
      'AWS Certified Solutions Architect - Associate',
      'Certified Kubernetes Administrator (CKA)',
    ],
    relevantCoursework: [
      'Cloud Computing & Distributed Systems',
      'Operating Systems & Scripting',
      'Computer Networking & Security',
    ],
    experienceExpectations: [
      'Automated deployment pipelines built using GitHub Actions or Jenkins',
      'Hands-on experience with Dockerfiles, compose files, and Linux server management',
    ],
    active: true,
  },

  {
    name: 'UI/UX Designer',
    slug: 'ui-ux-designer',
    category: 'Design',
    description: 'Product designer crafting intuitive user journeys, wireframes, component design systems, and interactive prototypes backed by usability research.',
    requiredSkills: [
      { skillName: 'Figma', category: 'design', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'UI Design', category: 'design', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'UX Research', category: 'design', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Wireframing', category: 'design', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Prototyping', category: 'design', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Design Systems', category: 'design', importance: 'important', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'HTML', category: 'frontend', importance: 'optional', expectedLevel: 'beginner' },
      { skillName: 'CSS', category: 'frontend', importance: 'optional', expectedLevel: 'beginner' },
      { skillName: 'Problem Solving', category: 'soft-skill', importance: 'important', expectedLevel: 'intermediate' },
    ],
    responsibilities: [
      'Translate user requirements and business goals into user journeys and wireframes',
      'Build interactive prototypes in Figma for user testing and stakeholder review',
      'Maintain modular component libraries with consistent typography and color palettes',
      'Conduct usability evaluations to refine interface affordances',
    ],
    commonTechnologies: ['Figma', 'FigJam', 'Miro', 'Design Systems'],
    relevantCertifications: [
      'Google UX Design Professional Certificate',
    ],
    relevantCoursework: [
      'Human-Computer Interaction (HCI)',
      'Interaction & Visual Design',
      'Cognitive Ergonomics & Usability',
    ],
    experienceExpectations: [
      'Design portfolio with end-to-end case studies detailing research, wireframes, and final UI',
      'Understanding of component auto-layout, interactive variants, and accessibility standards',
    ],
    active: true,
  },

  {
    name: 'Cybersecurity Analyst',
    slug: 'cybersecurity-analyst',
    category: 'Security',
    description: 'Security practitioner responsible for vulnerability assessment, threat monitoring, incident triage, network defense, and system auditing.',
    requiredSkills: [
      { skillName: 'Network Security', category: 'cybersecurity', importance: 'core', expectedLevel: 'advanced' },
      { skillName: 'Linux', category: 'tools', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Vulnerability Assessment', category: 'cybersecurity', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Incident Response', category: 'cybersecurity', importance: 'core', expectedLevel: 'intermediate' },
      { skillName: 'Cryptography', category: 'cybersecurity', importance: 'important', expectedLevel: 'intermediate' },
    ],
    preferredSkills: [
      { skillName: 'Python', category: 'programming', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'SIEM', category: 'cybersecurity', importance: 'important', expectedLevel: 'intermediate' },
      { skillName: 'Git', category: 'tools', importance: 'optional', expectedLevel: 'beginner' },
    ],
    responsibilities: [
      'Monitor networks and host systems for malicious traffic and intrusion attempts',
      'Conduct vulnerability scans, document risk findings, and recommend mitigations',
      'Analyze security logs and configure defensive firewall and access rules',
      'Maintain incident response documentation and security compliance controls',
    ],
    commonTechnologies: ['Wireshark', 'Nmap', 'Linux', 'Splunk', 'Python', 'OpenSSL'],
    relevantCertifications: [
      'CompTIA Security+',
      'Certified Ethical Hacker (CEH)',
      'Cisco Certified CyberOps Associate',
    ],
    relevantCoursework: [
      'Computer Networking & Protocols',
      'Information Security Fundamentals',
      'Applied Cryptography',
      'Operating System Security',
    ],
    experienceExpectations: [
      'Practical understanding of TCP/IP packet capture, port scanning, and authentication flaws',
      'Familiarity with OWASP Top 10 web vulnerabilities and defense-in-depth strategies',
    ],
    active: true,
  },
];

module.exports = {
  SEED_JOB_ROLES,
};
