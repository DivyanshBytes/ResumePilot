const clean = (list) => (Array.isArray(list) ? list : []).map((s) => String(s || '').trim()).filter(Boolean);

// Builds one neutral structure that the PDF and DOCX writers both consume.
// Uses the tailored version when it exists, otherwise your original parsed resume.
const buildResumeData = (application, resume, fallbackName) => {
  const parsed = resume.toObject().parsed || {};
  const app = application.toObject();
  const tailored = app.tailoredResume;
  const useTailored = Boolean(tailored && tailored.generatedAt);
  const src = useTailored ? tailored : parsed;

  const name = parsed.fullName || fallbackName || 'Your Name';

  return {
    version: useTailored ? 'tailored' : 'original',
    name,
    contact: clean([parsed.email, parsed.phone, parsed.location, ...(parsed.links || []).slice(0, 3)]),
    summary: String(src.summary || '').trim(),
    skills: clean(src.skills),
    experience: (src.experience || []).map((e) => ({
      title: [e.role, e.company].filter(Boolean).join(', '),
      dates: [e.startDate, e.endDate].filter(Boolean).join(' - '),
      bullets: clean(e.bullets),
    })),
    projects: (src.projects || []).map((p) => ({
      title: p.name + (clean(p.techStack).length ? ` | ${clean(p.techStack).join(', ')}` : ''),
      dates: '',
      bullets: clean(p.bullets),
    })),
    // Education and certifications are never rewritten, so they always come from the original
    education: (parsed.education || []).map((e) => ({
      title: [e.degree, e.institution].filter(Boolean).join(', '),
      dates: [e.startDate, e.endDate].filter(Boolean).join(' - '),
      detail: e.grade ? `Grade: ${e.grade}` : '',
    })),
    certifications: clean(parsed.certifications),
  };
};

module.exports = { buildResumeData };