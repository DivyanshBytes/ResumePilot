const Resume = require('../models/Resume');
const JobApplication = require('../models/JobApplication');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { buildResumeData } = require('../utils/resumeData');
const { resumePdf, coverLetterPdf } = require('../utils/exportPdf');
const { resumeDocx, coverLetterDocx } = require('../utils/exportDocx');

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// "Acme Labs, Inc." -> "Acme_Labs_Inc" (safe for filenames)
const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'Document';

const getFormat = (req) => {
  const format = String(req.query.format || 'pdf').toLowerCase();
  if (!MIME[format]) throw new AppError('Format must be "pdf" or "docx"', 400);
  return format;
};

const load = async (req) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw new AppError('Application not found', 404);

  const resume = await Resume.findOne({ _id: application.resume, user: req.user._id });
  if (!resume) throw new AppError('The resume linked to this application no longer exists', 404);
  if (resume.parseStatus !== 'parsed') throw new AppError('This resume has not been parsed yet', 400);

  return { application, resume };
};

const send = (res, { buffer, format, filename, extraHeaders = {} }) => {
  res.set({
    'Content-Type': MIME[format],
    'Content-Disposition': `attachment; filename="${filename}.${format}"`,
    'Content-Length': buffer.length,
    ...extraHeaders,
  });
  res.status(200).send(buffer);
};

// GET /api/applications/:id/export/resume?format=pdf|docx
exports.exportResume = asyncHandler(async (req, res) => {
  const format = getFormat(req);
  const { application, resume } = await load(req);
  const data = buildResumeData(application, resume, req.user.name);

  const buffer = format === 'pdf' ? await resumePdf(data) : await resumeDocx(data);

  send(res, {
    buffer,
    format,
    filename: `${safe(data.name)}_${safe(application.company)}_Resume`,
    extraHeaders: { 'X-Resume-Version': data.version }, // "tailored" or "original"
  });
});

// GET /api/applications/:id/export/cover-letter?format=pdf|docx
exports.exportCoverLetter = asyncHandler(async (req, res) => {
  const format = getFormat(req);
  const { application, resume } = await load(req);

  if (!application.coverLetter?.trim()) {
    throw new AppError('Generate a cover letter first', 400);
  }

  const data = buildResumeData(application, resume, req.user.name);
  const dateText = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const buffer = format === 'pdf'
    ? await coverLetterPdf(data, application.coverLetter, dateText)
    : await coverLetterDocx(data, application.coverLetter, dateText);

  send(res, {
    buffer,
    format,
    filename: `${safe(data.name)}_${safe(application.company)}_CoverLetter`,
  });
});