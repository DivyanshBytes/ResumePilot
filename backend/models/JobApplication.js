const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },

    company: { type: String, required: [true, 'Company is required'], trim: true },
    jobTitle: { type: String, required: [true, 'Job title is required'], trim: true },
    jobUrl: { type: String, trim: true },
    location: { type: String, trim: true },
    jobDescription: { type: String, required: [true, 'Job description is required'] },

    extractedKeywords: {
      required: [String], 
      preferred: [String],
    },
    atsScore: {
      overall: { type: Number, min: 0, max: 100, default: 0 },
      keywordMatch: { type: Number, default: 0 },
      skillsMatch: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      matchedKeywords: [String],
      missingKeywords: [String],
    },

    tailoredResume: {
      summary: String,
      skills: [String],
      experience: [
        {
          company: String,
          role: String,
          bullets: [String],
          _id: false,
        },
      ],
      generatedAt: Date,
    },
    coverLetter: { type: String, default: '' },

    status: {
      type: String,
      enum: ['wishlist', 'applied', 'interview', 'offer', 'rejected'],
      default: 'wishlist',
    },
    position: { type: Number, default: 0 },
    appliedDate: Date,
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ user: 1, status: 1, position: 1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);