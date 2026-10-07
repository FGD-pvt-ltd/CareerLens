/**
 * ProfiQ Skill Taxonomy
 * 
 * Reusable, canonical representation of industry technical and professional skills.
 * Provides deterministic mapping from common variations and aliases to canonical names.
 * Categories:
 * - programming
 * - frontend
 * - backend
 * - database
 * - cloud
 * - devops
 * - data
 * - machine-learning
 * - cybersecurity
 * - design
 * - soft-skill
 * - tools
 */

const SKILL_TAXONOMY = [
  // Programming Languages
  {
    canonicalName: 'JavaScript',
    aliases: ['js', 'javascript', 'ecmascript', 'java script'],
    category: 'programming',
  },
  {
    canonicalName: 'TypeScript',
    aliases: ['ts', 'typescript', 'type script'],
    category: 'programming',
  },
  {
    canonicalName: 'Python',
    aliases: ['py', 'python', 'python3', 'python 3'],
    category: 'programming',
  },
  {
    canonicalName: 'Java',
    aliases: ['java', 'core java', 'java 8', 'java 11', 'java 17', 'java 21'],
    category: 'programming',
  },
  {
    canonicalName: 'C++',
    aliases: ['cpp', 'c++', 'c/c++'],
    category: 'programming',
  },
  {
    canonicalName: 'C',
    aliases: ['c language', 'ansi c'],
    category: 'programming',
  },
  {
    canonicalName: 'C#',
    aliases: ['c#', 'csharp', 'c-sharp', '.net c#'],
    category: 'programming',
  },
  {
    canonicalName: 'Go',
    aliases: ['go', 'golang', 'go-lang'],
    category: 'programming',
  },
  {
    canonicalName: 'Rust',
    aliases: ['rust', 'rustlang'],
    category: 'programming',
  },
  {
    canonicalName: 'PHP',
    aliases: ['php', 'php7', 'php8'],
    category: 'programming',
  },
  {
    canonicalName: 'Data Structures & Algorithms',
    aliases: ['dsa', 'data structures', 'algorithms', 'data structures & algorithms', 'data structures and algorithms'],
    category: 'programming',
  },

  // Frontend
  {
    canonicalName: 'HTML',
    aliases: ['html', 'html5'],
    category: 'frontend',
  },
  {
    canonicalName: 'CSS',
    aliases: ['css', 'css3'],
    category: 'frontend',
  },
  {
    canonicalName: 'React',
    aliases: ['react', 'react.js', 'reactjs', 'react js'],
    category: 'frontend',
  },
  {
    canonicalName: 'Next.js',
    aliases: ['next.js', 'nextjs', 'next js', 'next'],
    category: 'frontend',
  },
  {
    canonicalName: 'Vue.js',
    aliases: ['vue', 'vue.js', 'vuejs', 'vue 3'],
    category: 'frontend',
  },
  {
    canonicalName: 'Angular',
    aliases: ['angular', 'angularjs', 'angular 2+'],
    category: 'frontend',
  },
  {
    canonicalName: 'Tailwind CSS',
    aliases: ['tailwind', 'tailwindcss', 'tailwind css', 'tailwind-css'],
    category: 'frontend',
  },
  {
    canonicalName: 'Redux',
    aliases: ['redux', 'redux toolkit', 'rtk'],
    category: 'frontend',
  },

  // Backend
  {
    canonicalName: 'Node.js',
    aliases: ['node', 'nodejs', 'node.js', 'node js'],
    category: 'backend',
  },
  {
    canonicalName: 'Express.js',
    aliases: ['express', 'expressjs', 'express.js', 'express js'],
    category: 'backend',
  },
  {
    canonicalName: 'Django',
    aliases: ['django', 'django rest framework', 'drf'],
    category: 'backend',
  },
  {
    canonicalName: 'Flask',
    aliases: ['flask'],
    category: 'backend',
  },
  {
    canonicalName: 'FastAPI',
    aliases: ['fastapi', 'fast api'],
    category: 'backend',
  },
  {
    canonicalName: 'Spring Boot',
    aliases: ['spring boot', 'springboot', 'spring framework'],
    category: 'backend',
  },
  {
    canonicalName: 'REST APIs',
    aliases: ['rest', 'rest api', 'rest apis', 'restful api', 'restful apis', 'web api', 'web apis'],
    category: 'backend',
  },
  {
    canonicalName: 'GraphQL',
    aliases: ['graphql', 'apollo graphql'],
    category: 'backend',
  },
  {
    canonicalName: 'System Design',
    aliases: ['system design', 'system design basics', 'distributed systems', 'microservices architecture'],
    category: 'backend',
  },

  // Database
  {
    canonicalName: 'SQL',
    aliases: ['sql', 'structured query language', 'relational database'],
    category: 'database',
  },
  {
    canonicalName: 'PostgreSQL',
    aliases: ['postgresql', 'postgres', 'pgsql'],
    category: 'database',
  },
  {
    canonicalName: 'MySQL',
    aliases: ['mysql'],
    category: 'database',
  },
  {
    canonicalName: 'MongoDB',
    aliases: ['mongodb', 'mongo', 'mongo db'],
    category: 'database',
  },
  {
    canonicalName: 'Redis',
    aliases: ['redis', 'redis cache'],
    category: 'database',
  },

  // Cloud & DevOps
  {
    canonicalName: 'Docker',
    aliases: ['docker', 'containerization', 'docker containers'],
    category: 'devops',
  },
  {
    canonicalName: 'Kubernetes',
    aliases: ['kubernetes', 'k8s'],
    category: 'devops',
  },
  {
    canonicalName: 'CI/CD',
    aliases: ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'github actions', 'jenkins'],
    category: 'devops',
  },
  {
    canonicalName: 'AWS',
    aliases: ['aws', 'amazon web services', 'aws cloud', 'ec2', 's3'],
    category: 'cloud',
  },
  {
    canonicalName: 'Azure',
    aliases: ['azure', 'microsoft azure'],
    category: 'cloud',
  },
  {
    canonicalName: 'GCP',
    aliases: ['gcp', 'google cloud', 'google cloud platform'],
    category: 'cloud',
  },

  // Data & Analytics
  {
    canonicalName: 'Pandas',
    aliases: ['pandas'],
    category: 'data',
  },
  {
    canonicalName: 'NumPy',
    aliases: ['numpy'],
    category: 'data',
  },
  {
    canonicalName: 'Power BI',
    aliases: ['power bi', 'powerbi', 'microsoft power bi'],
    category: 'data',
  },
  {
    canonicalName: 'Tableau',
    aliases: ['tableau'],
    category: 'data',
  },
  {
    canonicalName: 'Excel',
    aliases: ['excel', 'ms excel', 'microsoft excel', 'advanced excel', 'spreadsheets'],
    category: 'data',
  },
  {
    canonicalName: 'Data Visualization',
    aliases: ['data visualization', 'data viz', 'matplotlib', 'seaborn'],
    category: 'data',
  },
  {
    canonicalName: 'Statistics',
    aliases: ['statistics', 'statistical analysis', 'probability & statistics', 'applied statistics'],
    category: 'data',
  },

  // Machine Learning & AI
  {
    canonicalName: 'Machine Learning',
    aliases: ['machine learning', 'ml', 'machine learning algorithms'],
    category: 'machine-learning',
  },
  {
    canonicalName: 'Deep Learning',
    aliases: ['deep learning', 'dl', 'neural networks'],
    category: 'machine-learning',
  },
  {
    canonicalName: 'PyTorch',
    aliases: ['pytorch', 'torch'],
    category: 'machine-learning',
  },
  {
    canonicalName: 'TensorFlow',
    aliases: ['tensorflow', 'tf'],
    category: 'machine-learning',
  },
  {
    canonicalName: 'Scikit-learn',
    aliases: ['scikit-learn', 'scikit learn', 'sklearn'],
    category: 'machine-learning',
  },
  {
    canonicalName: 'Natural Language Processing',
    aliases: ['natural language processing', 'nlp'],
    category: 'machine-learning',
  },

  // Design
  {
    canonicalName: 'Figma',
    aliases: ['figma', 'figma design'],
    category: 'design',
  },
  {
    canonicalName: 'UI Design',
    aliases: ['ui design', 'user interface design', 'visual design'],
    category: 'design',
  },
  {
    canonicalName: 'UX Research',
    aliases: ['ux research', 'user research', 'user experience research', 'usability testing'],
    category: 'design',
  },
  {
    canonicalName: 'Wireframing',
    aliases: ['wireframing', 'wireframes', 'low-fi wireframes'],
    category: 'design',
  },
  {
    canonicalName: 'Prototyping',
    aliases: ['prototyping', 'interactive prototyping', 'mockups'],
    category: 'design',
  },
  {
    canonicalName: 'Design Systems',
    aliases: ['design systems', 'component libraries', 'design tokens'],
    category: 'design',
  },

  // Cybersecurity
  {
    canonicalName: 'Network Security',
    aliases: ['network security', 'networking fundamentals', 'tcp/ip', 'wireshark'],
    category: 'cybersecurity',
  },
  {
    canonicalName: 'Vulnerability Assessment',
    aliases: ['vulnerability assessment', 'vulnerability scanning', 'penetration testing', 'nmap'],
    category: 'cybersecurity',
  },
  {
    canonicalName: 'Incident Response',
    aliases: ['incident response', 'threat detection', 'security incident handling'],
    category: 'cybersecurity',
  },
  {
    canonicalName: 'Cryptography',
    aliases: ['cryptography', 'encryption', 'pki', 'ssl/tls'],
    category: 'cybersecurity',
  },
  {
    canonicalName: 'SIEM',
    aliases: ['siem', 'splunk', 'security information and event management'],
    category: 'cybersecurity',
  },

  // Tools & Fundamentals
  {
    canonicalName: 'Git',
    aliases: ['git', 'github', 'gitlab', 'version control', 'git & github'],
    category: 'tools',
  },
  {
    canonicalName: 'Linux',
    aliases: ['linux', 'linux os', 'ubuntu', 'bash', 'shell scripting'],
    category: 'tools',
  },
  {
    canonicalName: 'Problem Solving',
    aliases: ['problem solving', 'analytical thinking'],
    category: 'soft-skill',
  },
  {
    canonicalName: 'Communication',
    aliases: ['communication', 'verbal communication', 'technical writing'],
    category: 'soft-skill',
  },
  {
    canonicalName: 'Teamwork',
    aliases: ['teamwork', 'collaboration', 'cross-functional collaboration'],
    category: 'soft-skill',
  },
];

module.exports = {
  SKILL_TAXONOMY,
};
