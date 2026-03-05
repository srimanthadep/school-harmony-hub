const express = require('express');
const router = express.Router();
const { downloadBackup, testBackupEmail } = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'owner'));

router.post('/download', downloadBackup);
router.post('/test-email', testBackupEmail);

module.exports = router;
