const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    startDate: String,
    endDate: String,
    bullets: [String], // each achievement line; the AI rewrites these later
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    startDate: String,
    endDate: String,
    grade: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: String,
    techStack: [String],
    bullets: [String],
    link: String,
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'My Resume',
      trim: true,
    },

    originalFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },

    rawText: { type: String, default: '' }, // full text pulled from the file

    parsed: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
      links: [String],
      summary: String,
      skills: [String],
      experience: [experienceSchema],
      education: [educationSchema],
      projects: [projectSchema],
      certifications: [String],
    },

    parseStatus: {
      type: String,
      enum: ['pending', 'parsed', 'failed'],
      default: 'pending',
    },
    isPrimary: { type: Boolean, default: false }, // the user's default resume
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);