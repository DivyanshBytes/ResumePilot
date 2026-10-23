const express = require('express');
const upload = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  uploadResume, getResumes, getResume, reparseResume, setPrimary, deleteResume,
} = require('../controllers/resumeController');

const router = express.Router();

router.use(protect); // every resume route requires login

router.route('/').post(upload.single('resume'), uploadResume).get(getResumes);
router.route('/:id').get(getResume).delete(deleteResume);
router.post('/:id/reparse', reparseResume);
router.patch('/:id/primary', setPrimary);

module.exports = router;