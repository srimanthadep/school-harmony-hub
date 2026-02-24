const express = require('express');
const router = express.Router();
const { saveAttendance, getAttendance, getAttendanceRange } = require('../controllers/attendanceController');

router.post('/', saveAttendance);
router.get('/range', getAttendanceRange);
router.get('/:date', getAttendance);

module.exports = router;
