const Resume = require('../models/Resume');
const JobApplication = require('../models/JobApplication');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const analyzeJob = require('../utils/analyzeJob');
const { scoreResume } = require('../utils/atsScorer');
const tailorResume = require('../utils/tailorResume');
const writeCoverLetter = require('../utils/writeCoverLetter');
const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];

const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Rewrites positions as 0,1,2... for the given ids (in that order)
const resequence = (userId, ids) =>
  ids.length
    ? JobApplication.bulkWrite(
        ids.map((id, index) => ({
          updateOne: { filter: { _id: id, user: userId }, update: { $set: { position: index } } },
        }))
      )
    : null;

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
    statusHistory: [{ status: 'wishlist', at: new Date() }],
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

// GET /api/applications/board   -> { board: { wishlist: [...], applied: [...], ... } }
exports.getBoard = asyncHandler(async (req, res) => {
  const applications = await JobApplication.find({ user: req.user._id })
    .select('company jobTitle location jobUrl status position appliedDate createdAt atsScore.overall')
    .sort({ position: 1, createdAt: -1 });

  const board = Object.fromEntries(STATUSES.map((s) => [s, []]));
  applications.forEach((a) => board[a.status].push(a));

  res.status(200).json({ success: true, total: applications.length, board });
});

// PATCH /api/applications/:id/move   body: { status, position? }
exports.moveApplication = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${STATUSES.join(', ')}`, 400);
  }

  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw new AppError('Application not found', 404);

  const fromStatus = application.status;

  // Cards already in the target column, without the one being moved
  const targetCards = await JobApplication.find({
    user: req.user._id,
    status,
    _id: { $ne: application._id },
  })
    .sort({ position: 1, createdAt: -1 })
    .select('_id');

  // Where to drop it: clamp to a valid index, default = end of the column
  let index = Number.isInteger(req.body.position) ? req.body.position : targetCards.length;
  index = Math.max(0, Math.min(index, targetCards.length));

  // Record the stage change
  if (fromStatus !== status) {
    application.status = status;
    application.statusHistory.push({ status, at: new Date() });
    if (status === 'applied' && !application.appliedDate) application.appliedDate = new Date();
    await application.save();
  }

  // Rebuild the target column's order with the card at its new index
  const ids = targetCards.map((c) => c._id);
  ids.splice(index, 0, application._id);
  await resequence(req.user._id, ids);

  // Close the gap in the column the card left
  if (fromStatus !== status) {
    const sourceCards = await JobApplication.find({ user: req.user._id, status: fromStatus })
      .sort({ position: 1, createdAt: -1 })
      .select('_id');
    await resequence(req.user._id, sourceCards.map((c) => c._id));
  }

  res.status(200).json({
    success: true,
    message: 'Application moved',
    application: {
      _id: application._id,
      status,
      position: index,
      appliedDate: application.appliedDate,
    },
  });
});

// PATCH /api/applications/:id   body: any of company, jobTitle, jobUrl, location, notes, appliedDate
exports.updateApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw new AppError('Application not found', 404);

  // Whitelist: nobody can change user, resume, scores or status through this route
  for (const field of ['company', 'jobTitle']) {
    if (req.body[field] !== undefined) {
      const value = String(req.body[field]).trim();
      if (!value) throw new AppError(`${field} cannot be empty`, 400);
      application[field] = value;
    }
  }
  for (const field of ['jobUrl', 'location', 'notes']) {
    if (req.body[field] !== undefined) application[field] = String(req.body[field]).trim();
  }
  if (req.body.appliedDate !== undefined) {
    if (!req.body.appliedDate) {
      application.appliedDate = undefined; // empty value clears the date
    } else {
      const date = parseDate(req.body.appliedDate);
      if (!date) throw new AppError('appliedDate is not a valid date', 400);
      application.appliedDate = date;
    }
  }

  await application.save();
  res.status(200).json({ success: true, message: 'Application updated', application });
});

// GET /api/applications/stats
exports.getStats = asyncHandler(async (req, res) => {
  const applications = await JobApplication.find({ user: req.user._id })
    .select('status statusHistory atsScore.overall atsScore.missingKeywords createdAt');

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const gapCounts = new Map();
  let scoreSum = 0;
  let applied = 0;
  let interviewed = 0;
  let offers = 0;
  let appliedScoreSum = 0;
  let interviewedScoreSum = 0;

  for (const a of applications) {
    const score = a.atsScore?.overall || 0;
    byStatus[a.status] += 1;
    scoreSum += score;

    // Every stage this card has ever been in (current stage included)
    const seen = new Set((a.statusHistory || []).map((h) => h.status));
    seen.add(a.status);

    const wasApplied = ['applied', 'interview', 'offer', 'rejected'].some((s) => seen.has(s));
    const gotInterview = seen.has('interview') || seen.has('offer');

    if (wasApplied) { applied += 1; appliedScoreSum += score; }
    if (gotInterview) { interviewed += 1; interviewedScoreSum += score; }
    if (seen.has('offer')) offers += 1;

    for (const keyword of a.atsScore?.missingKeywords || []) {
      const key = keyword.toLowerCase();
      const entry = gapCounts.get(key) || { keyword, count: 0 };
      entry.count += 1;
      gapCounts.set(key, entry);
    }
  }

  const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);
  const avg = (sum, count) => (count ? Math.round(sum / count) : 0);

  // Applications added per week, last 8 weeks (oldest first, for a chart)
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weekly = Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * DAY + 0; // end of week i
    const start = end - 7 * DAY;
    return {
      weekStart: new Date(start).toISOString().slice(0, 10),
      count: applications.filter((a) => {
        const t = new Date(a.createdAt).getTime();
        return t > start && t <= end;
      }).length,
    };
  });
  // Include anything created in the last moments in the final bucket
  weekly[7].count += applications.filter((a) => new Date(a.createdAt).getTime() > now).length;

  res.status(200).json({
    success: true,
    stats: {
      total: applications.length,
      byStatus,
      applied,
      interviewed,
      offers,
      interviewRate: pct(interviewed, applied), // % of applications that reached an interview
      offerRate: pct(offers, applied),
      avgScore: avg(scoreSum, applications.length),
      avgScoreApplied: avg(appliedScoreSum, applied),
      avgScoreInterviewed: avg(interviewedScoreSum, interviewed),
      topGaps: [...gapCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8),
      weekly,
    },
  });
});