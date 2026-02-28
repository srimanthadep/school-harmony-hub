const express = require('express');
const router = express.Router();
const { saveAttendance, getAttendance, getAttendanceRange } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Fix #6: All attendance endpoints require authentication
router.use(protect);

// Write endpoints restricted to admin/owner
router.post('/', authorize('admin', 'owner'), saveAttendance);

// Read endpoints also require auth (teacher/staff should not read without login)
router.get('/range', authorize('admin', 'owner'), getAttendanceRange);
router.get('/:date', authorize('admin', 'owner'), getAttendance);

module.exports = router;
