const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const extractText = require('../utils/extractText');
const parseResume = require('../utils/parseResume');

const removeFile = (filePath) => fs.unlink(filePath, () => {}); // ignore errors

// POST /api/resumes   (form-data, field name: "resume")
exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Please attach a resume file', 400);

  const fileType = path.extname(req.file.originalname).toLowerCase() === '.pdf' ? 'pdf' : 'docx';

  let rawText;
  try {
    rawText = await extractText(req.file.path, fileType);
  } catch (err) {
    removeFile(req.file.path); // don't keep unreadable files
    throw err;
  }

  const isFirst = (await Resume.countDocuments({ user: req.user._id })) === 0;

  const resume = await Resume.create({
    user: req.user._id,
    title: req.body.title || req.file.originalname.replace(/\.[^.]+$/, ''),
    originalFileName: req.file.originalname,
    filePath: req.file.path,
    fileType,
    rawText,
    isPrimary: isFirst, // the first upload becomes the default resume
  });

  // AI parsing. If it fails the upload is still saved and can be retried.
  try {
    resume.parsed = await parseResume(rawText);
    resume.parseStatus = 'parsed';
  } catch (err) {
    console.error('Parse failed:', err.message);
    resume.parseStatus = 'failed';
  }
  await resume.save();

  res.status(201).json({
    success: true,
    message: resume.parseStatus === 'parsed' ? 'Resume uploaded and parsed' : 'Resume saved, but parsing failed. You can retry.',
    resume,
  });
});

// GET /api/resumes   (list without the heavy rawText)
exports.getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id })
    .select('-rawText -filePath')
    .sort({ isPrimary: -1, createdAt: -1 });
  res.status(200).json({ success: true, count: resumes.length, resumes });
});

// GET /api/resumes/:id
exports.getResume = asyncHandler(async (req, res) => {
  // Filtering by user is what stops one user reading another user's resume
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id }).select('-filePath');
  if (!resume) throw new AppError('Resume not found', 404);
  res.status(200).json({ success: true, resume });
});

// POST /api/resumes/:id/reparse
exports.reparseResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw new AppError('Resume not found', 404);

  resume.parsed = await parseResume(resume.rawText);
  resume.parseStatus = 'parsed';
  await resume.save();

  res.status(200).json({ success: true, message: 'Resume re-parsed', resume });
});

// PATCH /api/resumes/:id/primary
exports.setPrimary = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw new AppError('Resume not found', 404);

  await Resume.updateMany({ user: req.user._id }, { isPrimary: false });
  resume.isPrimary = true;
  await resume.save();

  res.status(200).json({ success: true, message: 'Primary resume updated' });
});

// DELETE /api/resumes/:id
exports.deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!resume) throw new AppError('Resume not found', 404);

  removeFile(resume.filePath);
  res.status(200).json({ success: true, message: 'Resume deleted' });
});