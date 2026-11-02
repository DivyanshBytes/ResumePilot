const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middlewares/authMiddleware');
const {
  createApplication, getApplications, getApplication, rescoreApplication, deleteApplication,
} = require('../controllers/applicationController');

const router = express.Router();

// Each new application costs one AI call, so protect the free quota
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many analyses. Please wait a few minutes and try again' },
});

router.use(protect);

router.route('/').post(aiLimiter, createApplication).get(getApplications);
router.route('/:id').get(getApplication).delete(deleteApplication);
router.post('/:id/rescore', rescoreApplication);

module.exports = router;