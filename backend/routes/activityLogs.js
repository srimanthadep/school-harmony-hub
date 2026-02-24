const express = require('express');
const router = express.Router();
const { getActivityLogs, exportActivityLogs } = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'owner'));

router.get('/export', exportActivityLogs);
router.get('/', getActivityLogs);

module.exports = router;
