const { askJSON } = require('./ai');

const SYSTEM = `You are a precise resume parser. You convert resume text into structured JSON.
Rules:
- Use ONLY information present in the resume text. Never invent or guess.
- If a field is missing, use an empty string or empty array.
- Keep bullet points close to the original wording.
- Return ONLY valid JSON, with no explanation and no markdown.`;

const SCHEMA = `{
  "fullName": "",
  "email": "",
  "phone": "",
  "location": "",
  "links": [""],
  "summary": "",
  "skills": [""],
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "bullets": [""] }],
  "education": [{ "institution": "", "degree": "", "startDate": "", "endDate": "", "grade": "" }],
  "projects": [{ "name": "", "techStack": [""], "bullets": [""], "link": "" }],
  "certifications": [""]
}`;

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const arr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const list = (v) => (Array.isArray(v) ? v : []);

// Never trust AI output blindly: force every field into the type our schema expects
const normalize = (d = {}) => ({
  fullName: str(d.fullName),
  email: str(d.email),
  phone: str(d.phone),
  location: str(d.location),
  links: arr(d.links),
  summary: str(d.summary),
  skills: arr(d.skills),
  experience: list(d.experience).map((e) => ({
    company: str(e.company), role: str(e.role),
    startDate: str(e.startDate), endDate: str(e.endDate), bullets: arr(e.bullets),
  })),
  education: list(d.education).map((e) => ({
    institution: str(e.institution), degree: str(e.degree),
    startDate: str(e.startDate), endDate: str(e.endDate), grade: str(e.grade),
  })),
  projects: list(d.projects).map((p) => ({
    name: str(p.name), techStack: arr(p.techStack), bullets: arr(p.bullets), link: str(p.link),
  })),
  certifications: arr(d.certifications),
});

const parseResume = async (rawText) => {
  const result = await askJSON({
    system: SYSTEM,
    prompt: `Parse this resume into JSON matching exactly this shape:\n${SCHEMA}\n\nRESUME TEXT:\n"""\n${rawText.slice(0, 12000)}\n"""`,
    maxTokens: 6000,
  });
  return normalize(result);
};

module.exports = parseResume;