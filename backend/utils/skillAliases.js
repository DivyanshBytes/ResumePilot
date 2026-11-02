// Lowercase, treat hyphens/underscores as spaces, tidy whitespace.
// Applied to BOTH job keywords and resume text so they compare fairly.
const normalizeText = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[,;:]+$/, '')
    .trim();

// canonical name -> other ways people write it. Grow this list over time.
const ALIASES = {
  javascript: ['js', 'es6', 'ecmascript'],
  typescript: ['ts'],
  'node.js': ['node', 'nodejs', 'node js'],
  'express.js': ['express', 'expressjs', 'express js'],
  react: ['react.js', 'reactjs', 'react js'],
  'react native': [],
  'next.js': ['next', 'nextjs'],
  'vue.js': ['vue', 'vuejs'],
  angular: ['angularjs', 'angular.js'],
  mongodb: ['mongo', 'mongo db'],
  mongoose: [],
  postgresql: ['postgres', 'psql'],
  mysql: [],
  sql: [],
  nosql: ['no sql'],
  redis: [],
  html: ['html5'],
  css: ['css3'],
  'tailwind css': ['tailwind', 'tailwindcss'],
  redux: ['redux toolkit'],
  'rest api': ['rest', 'restful', 'restful api', 'restful apis', 'rest apis', 'restful web services'],
  graphql: [],
  jwt: ['json web token', 'json web tokens'],
  'socket.io': ['socketio', 'websockets', 'web sockets'],
  git: [],
  github: [],
  docker: [],
  kubernetes: ['k8s'],
  aws: ['amazon web services'],
  gcp: ['google cloud', 'google cloud platform'],
  azure: ['microsoft azure'],
  'ci/cd': ['cicd', 'ci cd', 'continuous integration', 'continuous deployment', 'continuous delivery'],
  jest: [],
  'unit testing': ['unit tests', 'unit test'],
  agile: ['agile methodology', 'agile methodologies'],
  microservices: ['microservice', 'micro services'],
  'responsive design': ['responsive web design', 'responsive ui'],
  'object oriented programming': ['oop', 'oops', 'object oriented'],
  'data structures and algorithms': ['dsa', 'data structures & algorithms'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'natural language processing': ['nlp'],
  python: [],
  java: [],
  'c++': ['cpp'],
  'c#': ['csharp', 'c sharp'],
  '.net': ['dotnet', 'asp.net', '.net core'],
};

const VARIANTS = {}; // canonical key -> normalized variants
const REVERSE = {};  // any spelling -> canonical key

for (const [canonical, list] of Object.entries(ALIASES)) {
  const key = normalizeText(canonical);
  VARIANTS[key] = list.map(normalizeText);
  REVERSE[key] = key;
  VARIANTS[key].forEach((v) => (REVERSE[v] = key));
}

// "JS", "javascript", "JavaScript " -> "javascript"
const canon = (term) => {
  const n = normalizeText(term);
  return REVERSE[n] || n;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regexCache = new Map();

// Whole-term match, so "java" does NOT match inside "javascript",
// and terms like "c++" and "node.js" still work (plain \b breaks on those).
const termRegex = (term) => {
  if (!regexCache.has(term)) {
    regexCache.set(term, new RegExp(`(?<![a-z0-9])${escapeRegex(term)}(?![a-z0-9])`, 'i'));
  }
  return regexCache.get(term);
};

// Does this (already normalized) text contain the skill or any of its aliases?
const containsTerm = (text, key) => {
  const spellings = [key, ...(VARIANTS[key] || [])];
  // Multi-word phrases: also accept the singular/plural form ("unit test" / "unit tests")
  if (key.includes(' ')) spellings.push(key.endsWith('s') ? key.slice(0, -1) : `${key}s`);
  return spellings.some((s) => termRegex(s).test(text));
};

module.exports = { normalizeText, canon, containsTerm };