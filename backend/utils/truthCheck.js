const { normalizeText, containsTerm } = require('./skillAliases');

// "40%", "2,000", "3.5" -> "40", "2000", "3.5"
const numbersIn = (text) =>
  (String(text || '').match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/,/g, ''));

// Checks that AI-written text adds no new numbers and no new job skills.
//  numberSource  = text the numbers are allowed to come from
//  keywordSource = text the job skills are allowed to come from
const checkText = ({ newText, numberSource, keywordSource, keywords }) => {
  const known = new Set(numbersIn(numberSource));
  const badNumbers = [...new Set(numbersIn(newText))].filter((n) => !known.has(n));

  const written = normalizeText(newText);
  const allowed = normalizeText(keywordSource);
  const badSkills = keywords
    .filter((k) => containsTerm(written, k.key) && !containsTerm(allowed, k.key))
    .map((k) => k.display);

  return { ok: !badNumbers.length && !badSkills.length, badNumbers, badSkills };
};

const describe = (check) => {
  const parts = [];
  if (check.badNumbers.length) parts.push(`numbers not in your resume (${check.badNumbers.join(', ')})`);
  if (check.badSkills.length) parts.push(`skills not in your resume (${check.badSkills.join(', ')})`);
  return parts.join('; ');
};

module.exports = { checkText, describe };