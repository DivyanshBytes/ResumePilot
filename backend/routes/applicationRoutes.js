const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middlewares/authMiddleware');
const {
  createApplication, getApplications, getApplication, rescoreApplication, deleteApplication,
  tailorApplication, generateCoverLetter,
  getBoard, moveApplication, updateApplication, getStats,
} = require('../controllers/applicationController');
const { exportResume, exportCoverLetter } = require('../controllers/exportController');
const router = express.Router();

// Each analysis, tailoring or cover letter costs an AI call, so protect the free quota
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please wait a few minutes and try again' },
});

router.use(protect);

// IMPORTANT: fixed paths (/board, /stats) must come BEFORE '/:id'.
// Otherwise Express treats the word "board" as an id and fails.
router.get('/board', getBoard);
router.get('/stats', getStats);

router.route('/').post(aiLimiter, createApplication).get(getApplications);
router.route('/:id').get(getApplication).patch(updateApplication).delete(deleteApplication);

router.patch('/:id/move', moveApplication);
router.post('/:id/rescore', rescoreApplication);
router.post('/:id/tailor', aiLimiter, tailorApplication);
router.post('/:id/cover-letter', aiLimiter, generateCoverLetter);
router.get('/:id/export/resume', exportResume);
router.get('/:id/export/cover-letter', exportCoverLetter);

module.exports = router;