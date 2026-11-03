const Resume = require('../models/Resume');
const JobApplication = require('../models/JobApplication');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const analyzeJob = require('../utils/analyzeJob');
const { scoreResume } = require('../utils/atsScorer');
const tailorResume = require('../utils/tailorResume');
const writeCoverLetter = require('../utils/writeCoverLetter');

const runScore = (resume, keywords) =>
  scoreResume({
    rawText: resume.rawText,
    parsed: resume.toObject().parsed || {},
    required: keywords.required,
    preferred: keywords.preferred,
  });

// POST /api/applications
// body: { jobDescription, resumeId?, company?, jobTitle?, jobUrl?, location? }
exports.createApplication = asyncHandler(async (req, res) => {
  const jobDescription = (req.body.jobDescription || '').trim();
  if (jobDescription.length < 100) {
    throw new AppError('Please paste the full job description (at least 100 characters)', 400);
  }

  // Use the chosen resume, or fall back to the user's primary one.
  // Filtering by user keeps people away from each other's resumes.
  const resume = req.body.resumeId
    ? await Resume.findOne({ _id: req.body.resumeId, user: req.user._id })
    : await Resume.findOne({ user: req.user._id, isPrimary: true });

  if (!resume) throw new AppError('Resume not found. Please upload a resume first', 404);
  if (resume.parseStatus !== 'parsed') {
    throw new AppError('This resume has not been parsed yet. Re-parse it first', 400);
  }

  const analysis = await analyzeJob(jobDescription); // the AI call

  if (!analysis.required.length && !analysis.preferred.length) {
    throw new AppError('We could not find any skills in this posting. Please paste the full text of the job description', 422);
  }

  // The user can type company/title, otherwise we use what the AI detected
  const company = req.body.company?.trim() || analysis.company;
  const jobTitle = req.body.jobTitle?.trim() || analysis.jobTitle;
  if (!company || !jobTitle) {
    throw new AppError('We could not detect the company or job title. Please enter them', 400);
  }

  const extractedKeywords = { required: analysis.required, preferred: analysis.preferred };
  const atsScore = runScore(resume, extractedKeywords); // our algorithm, no AI

  const position = await JobApplication.countDocuments({ user: req.user._id, status: 'wishlist' });

  const application = await JobApplication.create({
    user: req.user._id,
    resume: resume._id,
    company,
    jobTitle,
    jobUrl: req.body.jobUrl,
    location: req.body.location?.trim() || analysis.location,
    jobDescription,
    extractedKeywords,
    atsScore,
    status: 'wishlist',
    position, // goes to the end of the Wishlist column
  });

  res.status(201).json({ success: true, message: 'Job analysed and scored', application });
});

// GET /api/applications?status=applied   (light list for the board)
exports.getApplications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const applications = await JobApplication.find(filter)
    .select('-jobDescription -coverLetter -tailoredResume')
    .populate('resume', 'title')
    .sort({ status: 1, position: 1, createdAt: -1 });

  res.status(200).json({ success: true, count: applications.length, applications });
});

// GET /api/applications/:id
exports.getApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id })
    .populate('resume', 'title');
  if (!application) throw new AppError('Application not found', 404);
  res.status(200).json({ success: true, application });
});

// POST /api/applications/:id/rescore   body: { resumeId? }
// Re-scores WITHOUT calling the AI: use after editing a resume, or to try another one
exports.rescoreApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw new AppError('Application not found', 404);

  const resume = await Resume.findOne({
    _id: req.body.resumeId || application.resume,
    user: req.user._id,
  });
  if (!resume) throw new AppError('Resume not found', 404);
  if (resume.parseStatus !== 'parsed') throw new AppError('This resume has not been parsed yet', 400);

  application.resume = resume._id;
  application.atsScore = runScore(resume, {
    required: application.extractedKeywords.required,
    preferred: application.extractedKeywords.preferred,
  });
  await application.save();

  res.status(200).json({ success: true, message: 'Score updated', application });
});

// DELETE /api/applications/:id
exports.deleteApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!application) throw new AppError('Application not found', 404);
  res.status(200).json({ success: true, message: 'Application deleted' });
});

// Loads the application and its resume, always scoped to the logged-in user
const loadOwned = async (req) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw new AppError('Application not found', 404);

  const resume = await Resume.findOne({ _id: application.resume, user: req.user._id });
  if (!resume) {
    throw new AppError('The resume linked to this application no longer exists. Rescore it with another resume first', 404);
  }
  if (resume.parseStatus !== 'parsed') {
    throw new AppError('This resume has not been parsed yet. Re-parse it first', 400);
  }
  return { application, resume };
};

// POST /api/applications/:id/tailor
exports.tailorApplication = asyncHandler(async (req, res) => {
  const { application, resume } = await loadOwned(req);

  const { tailored, report } = await tailorResume({
    parsed: resume.toObject().parsed || {},
    rawText: resume.rawText,
    required: application.extractedKeywords.required,
    preferred: application.extractedKeywords.preferred,
    jobTitle: application.jobTitle,
    company: application.company,
  });

  application.tailoredResume = { ...tailored, generatedAt: new Date() };
  await application.save();

  res.status(200).json({
    success: true,
    message: 'Resume tailored',
    tailoredResume: application.tailoredResume,
    report,
  });
});

// POST /api/applications/:id/cover-letter   body: { tone?: "professional" | "enthusiastic" | "concise" }
exports.generateCoverLetter = asyncHandler(async (req, res) => {
  const { application, resume } = await loadOwned(req);

  const tone = ['professional', 'enthusiastic', 'concise'].includes(req.body.tone)
    ? req.body.tone
    : 'professional';

  const { coverLetter, warnings, wordCount } = await writeCoverLetter({
    parsed: resume.toObject().parsed || {},
    rawText: resume.rawText,
    required: application.extractedKeywords.required,
    preferred: application.extractedKeywords.preferred,
    jobTitle: application.jobTitle,
    company: application.company,
    jobDescription: application.jobDescription,
    tone,
  });

  application.coverLetter = coverLetter;
  await application.save();

  res.status(200).json({ success: true, message: 'Cover letter generated', coverLetter, warnings, wordCount, tone });
});