const { canon, containsTerm, normalizeText } = require('./skillAliases');

const WEIGHTS = { keyword: 0.5, skills: 0.35, formatting: 0.15 };
const TYPE_WEIGHT = { required: 2, preferred: 1 }; // must-haves matter twice as much

// Turn the AI's two lists into one deduplicated list of { display, key, type }
const buildKeywords = (required = [], preferred = []) => {
  const seen = new Set();
  const out = [];
  const add = (list, type) => {
    for (const raw of list) {
      const display = String(raw || '').trim();
      const key = canon(display);
      if (!display || !key || seen.has(key)) continue; // a skill in both lists stays "required"
      seen.add(key);
      out.push({ display, key, type });
    }
  };
  add(required, 'required');
  add(preferred, 'preferred');
  return out;
};

// Which keywords appear in this text? Returns a Set of keys.
const findHits = (keywords, text) => {
  const hits = new Set();
  for (const k of keywords) if (containsTerm(text, k.key)) hits.add(k.key);
  return hits;
};

// Weighted percentage of keywords found (0-100)
const coverage = (keywords, hits) => {
  const total = keywords.reduce((s, k) => s + TYPE_WEIGHT[k.type], 0);
  if (!total) return 0;
  const got = keywords.reduce((s, k) => s + (hits.has(k.key) ? TYPE_WEIGHT[k.type] : 0), 0);
  return Math.round((got / total) * 100);
};

// 8 machine-readability checks worth 100 points in total
const checkFormatting = (parsed, rawText) => {
  const issues = [];
  let score = 0;

  const words = rawText.split(/\s+/).filter(Boolean).length;
  const skillCount = (parsed.skills || []).length;
  const hasWork = (parsed.experience || []).length > 0 || (parsed.projects || []).length > 0;
  const bullets = [...(parsed.experience || []), ...(parsed.projects || [])]
    .reduce((n, item) => n + (item.bullets?.length || 0), 0);

  // Contact details (25)
  if (parsed.email || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(rawText)) score += 15;
  else issues.push('Add a professional email address.');

  if (parsed.phone || /\+?\d[\d\s().-]{8,}\d/.test(rawText)) score += 10;
  else issues.push('Add a phone number so recruiters can reach you.');

  // Skills section (20)
  if (skillCount >= 5) score += 20;
  else if (skillCount > 0) {
    score += 10;
    issues.push('List more skills in a dedicated Skills section (aim for 8 or more).');
  } else issues.push('Add a dedicated Skills section. ATS software looks for it first.');

  // Experience or projects (20)
  if (hasWork) score += 20;
  else issues.push('Add work experience or projects under clear headings.');

  // Education (10)
  if ((parsed.education || []).length > 0) score += 10;
  else issues.push('Add an Education section.');

  // Bullet points (10)
  if (bullets >= 4) score += 10;
  else issues.push('Describe your work with bullet points (at least 4 across experience and projects).');

  // Length (10)
  if (words >= 300 && words <= 900) score += 10;
  else if (words >= 150 && words <= 1200) {
    score += 5;
    issues.push(words < 300 ? 'Your resume is quite short. Add more detail about your achievements.' : 'Your resume is long. Aim for one to two pages.');
  } else {
    issues.push(words < 150 ? 'Your resume text is very short.' : 'Your resume is far too long. Trim it to one or two pages.');
  }

  // Profile links (5)
  if ((parsed.links || []).length > 0) score += 5;
  else issues.push('Add your LinkedIn or GitHub link.');

  return { score, issues };
};

const scoreResume = ({ rawText, parsed = {}, required = [], preferred = [] }) => {
  const keywords = buildKeywords(required, preferred);

  const fullText = normalizeText(rawText);
  const skillsText = normalizeText(
    [...(parsed.skills || []), ...(parsed.projects || []).flatMap((p) => p.techStack || [])].join(' | ')
  );

  const anywhereHits = findHits(keywords, fullText);   // keyword appears anywhere
  const skillsHits = findHits(keywords, skillsText);   // keyword is listed as a skill

  const keywordMatch = coverage(keywords, anywhereHits);
  const skillsMatch = coverage(keywords, skillsHits);
  const formatting = checkFormatting(parsed, rawText);

  const overall = Math.round(
    keywordMatch * WEIGHTS.keyword + skillsMatch * WEIGHTS.skills + formatting.score * WEIGHTS.formatting
  );

  const matched = keywords.filter((k) => anywhereHits.has(k.key));
  const missing = keywords.filter((k) => !anywhereHits.has(k.key));
  const missingRequired = missing.filter((k) => k.type === 'required');

  // ---- Human-readable advice ----
  const suggestions = [];
  if (missingRequired.length) {
    suggestions.push(
      `Required skills not found in your resume: ${missingRequired.slice(0, 6).map((k) => k.display).join(', ')}. If you genuinely have them, add them to your Skills section and show them in your experience or projects.`
    );
  }
  const onlyInText = matched.filter((k) => !skillsHits.has(k.key));
  if (onlyInText.length && keywordMatch - skillsMatch > 15) {
    suggestions.push(
      `These appear in your experience but not in your Skills section: ${onlyInText.slice(0, 5).map((k) => k.display).join(', ')}. Listing them there helps ATS filters.`
    );
  }
  suggestions.push(...formatting.issues);
  if (overall >= 80 && !missingRequired.length) suggestions.unshift('Strong match. Tailor your bullet points to the job, then apply.');

  return {
    overall,
    keywordMatch,
    skillsMatch,
    formatting: formatting.score,
    matchedKeywords: matched.map((k) => k.display),
    missingKeywords: missing.map((k) => k.display),
    suggestions: suggestions.slice(0, 7),
  };
};

module.exports = { scoreResume };