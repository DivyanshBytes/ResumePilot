const { normalizeText, containsTerm } = require('./skillAliases');

const MAX_ITEMS = 8;   // how many experience/project entries we send to the AI
const MAX_BULLETS = 6; // bullets rewritten per entry
const TYPE_WEIGHT = { required: 2, preferred: 1 };

// Flatten experience + projects into comparable "items"
const collectItems = (parsed) => {
  const items = [];

  (parsed.experience || []).forEach((e, i) => {
    items.push({
      id: `exp-${i}`,
      title: [e.role, e.company].filter(Boolean).join(' at '),
      bullets: e.bullets || [],
      source: [e.role, e.company, ...(e.bullets || [])].join(' '),
    });
  });

  (parsed.projects || []).forEach((p, i) => {
    items.push({
      id: `proj-${i}`,
      title: p.name || 'Project',
      bullets: p.bullets || [],
      source: [p.name, ...(p.techStack || []), ...(p.bullets || [])].join(' '),
    });
  });

  return items.filter((item) => item.bullets.length > 0);
};

// RETRIEVE: which job keywords does each item genuinely contain?
// Items are ranked by relevance; irrelevant ones are dropped and stay untouched.
const rankItems = (items, keywords, limit = MAX_ITEMS) =>
  items
    .map((item) => {
      const text = normalizeText(item.source);
      const allowed = keywords.filter((k) => containsTerm(text, k.key));
      const relevance = allowed.reduce((sum, k) => sum + TYPE_WEIGHT[k.type], 0);
      return { ...item, allowed, relevance };
    })
    .filter((item) => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);

// supported = job keywords found somewhere in the resume. gaps = not found anywhere.
const splitKeywords = (rawText, keywords) => {
  const text = normalizeText(rawText);
  return {
    supported: keywords.filter((k) => containsTerm(text, k.key)),
    gaps: keywords.filter((k) => !containsTerm(text, k.key)),
  };
};

module.exports = { MAX_BULLETS, collectItems, rankItems, splitKeywords };