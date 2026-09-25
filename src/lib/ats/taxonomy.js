/**
 * Comprehensive Skill Taxonomy and Tech Synonyms.
 * Deterministic mapping for ATS keyword and skill analysis without AI.
 */

export const CATEGORIES = {
  frontend: [
    'react', 'next.js', 'vue', 'angular', 'svelte', 'html', 'html5', 'css', 'css3',
    'javascript', 'typescript', 'tailwind css', 'bootstrap', 'sass', 'redux', 'zustand',
    'mobx', 'webpack', 'vite', 'responsive design', 'web performance', 'dom manipulation'
  ],
  backend: [
    'node.js', 'express', 'fastify', 'nest.js', 'python', 'fastapi', 'flask', 'django',
    'java', 'spring boot', 'go', 'golang', 'rust', 'c#', '.net', 'c++', 'ruby',
    'ruby on rails', 'php', 'laravel', 'rest api', 'graphql', 'grpc', 'websockets',
    'microservices', 'system design'
  ],
  database: [
    'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'cassandra', 'elasticsearch',
    'dynamodb', 'oracle', 'firebase', 'supabase', 'sql', 'nosql', 'database replication',
    'database partitioning', 'sharding', 'indexing'
  ],
  cloud_devops: [
    'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes',
    'terraform', 'ci/cd', 'github actions', 'gitlab ci', 'jenkins', 'nginx', 'linux',
    'bash', 'shell scripting', 'prometheus', 'grafana', 'cloudflare', 'serverless',
    'load balancing'
  ],
  ai_data: [
    'machine learning', 'deep learning', 'artificial intelligence', 'pytorch', 'tensorflow',
    'pandas', 'numpy', 'scikit-learn', 'hugging face', 'natural language processing',
    'nlp', 'computer vision', 'large language models', 'llm', 'generative ai', 'rag',
    'vector databases', 'chromadb', 'pinecone', 'langchain', 'llamaindex'
  ],
  testing_qa: [
    'unit testing', 'integration testing', 'jest', 'vitest', 'pytest', 'cypress',
    'playwright', 'selenium', 'tdd', 'test-driven development', 'load testing'
  ],
  tools_methods: [
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'agile', 'scrum', 'kanban',
    'object-oriented programming', 'oop', 'data structures', 'algorithms', 'dsa'
  ]
};

export const SYNONYMS = {
  'react': ['react', 'react.js', 'reactjs', 'react js'],
  'next.js': ['next.js', 'nextjs', 'next js'],
  'vue': ['vue', 'vue.js', 'vuejs', 'vue js'],
  'angular': ['angular', 'angular.js', 'angularjs', 'angular 2+'],
  'node.js': ['node.js', 'nodejs', 'node js', 'node'],
  'express': ['express', 'express.js', 'expressjs'],
  'nest.js': ['nest.js', 'nestjs', 'nest js'],
  'javascript': ['javascript', 'js', 'ecmascript', 'es6', 'es6+', 'es2015'],
  'typescript': ['typescript', 'ts'],
  'python': ['python', 'python3', 'py'],
  'fastapi': ['fastapi', 'fast-api', 'fast api'],
  'django': ['django', 'django rest framework', 'drf'],
  'flask': ['flask'],
  'golang': ['golang', 'go programming', 'go lang'],
  'c++': ['c++', 'cpp'],
  'c#': ['c#', 'csharp', 'c-sharp'],
  '.net': ['.net', 'dotnet', '.net core', 'asp.net'],
  'postgresql': ['postgresql', 'postgres', 'psql', 'postgre sql'],
  'mysql': ['mysql', 'my-sql'],
  'mongodb': ['mongodb', 'mongo', 'mongo-db'],
  'redis': ['redis'],
  'aws': ['aws', 'amazon web services'],
  'azure': ['azure', 'microsoft azure'],
  'google cloud': ['google cloud', 'gcp', 'google cloud platform'],
  'docker': ['docker', 'containerization'],
  'kubernetes': ['kubernetes', 'k8s'],
  'ci/cd': ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'],
  'github actions': ['github actions', 'gh actions'],
  'rest api': ['rest api', 'rest apis', 'restful api', 'restful apis', 'rest architecture', 'rest web services'],
  'graphql': ['graphql', 'graph-ql'],
  'websockets': ['websockets', 'websocket', 'ws'],
  'microservices': ['microservices', 'microservice architecture', 'micro-services'],
  'system design': ['system design', 'distributed systems', 'system architecture'],
  'git': ['git', 'version control', 'vcs'],
  'tailwind css': ['tailwind css', 'tailwind', 'tailwindcss'],
  'html': ['html', 'html5'],
  'css': ['css', 'css3'],
  'sql': ['sql', 'structured query language'],
  'nosql': ['nosql', 'no-sql'],
  'machine learning': ['machine learning', 'ml'],
  'deep learning': ['deep learning', 'dl'],
  'artificial intelligence': ['artificial intelligence', 'ai'],
  'natural language processing': ['natural language processing', 'nlp'],
  'computer vision': ['computer vision', 'cv'],
  'large language models': ['large language models', 'llm', 'llms'],
  'rag': ['rag', 'retrieval augmented generation', 'retrieval-augmented generation'],
  'data structures': ['data structures', 'dsa', 'data structures and algorithms']
};

export const SKILL_TO_CATEGORY = {};
for (const [category, skills] of Object.entries(CATEGORIES)) {
  for (const skill of skills) {
    SKILL_TO_CATEGORY[skill.toLowerCase()] = category;
  }
}

export const ALIAS_TO_CANONICAL = {};
for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
  const canonLower = canonical.toLowerCase();
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL[alias.toLowerCase()] = canonLower;
  }
}

export function getCanonical(term) {
  if (!term) return null;
  const clean = term.trim().toLowerCase();
  if (ALIAS_TO_CANONICAL[clean]) {
    return ALIAS_TO_CANONICAL[clean];
  }
  if (SKILL_TO_CATEGORY[clean]) {
    return clean;
  }
  return null;
}

export function getCategory(canonicalSkill) {
  if (!canonicalSkill) return 'general';
  return SKILL_TO_CATEGORY[canonicalSkill.toLowerCase()] || 'general';
}

export function areRelated(skillA, skillB) {
  const catA = getCategory(skillA);
  const catB = getCategory(skillB);
  return catA !== 'general' && catA === catB;
}
