const express = require('express');
const router = express.Router();
const { downloadBackup } = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'owner'));

router.post('/download', downloadBackup);

module.exports = router;
