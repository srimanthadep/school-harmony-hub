const express = require('express');
const router = express.Router();
const { saveStaffAttendance, getStaffAttendance, getStaffAttendanceRange } = require('../controllers/staffAttendanceController');

router.post('/', saveStaffAttendance);
router.get('/range', getStaffAttendanceRange);
router.get('/:date', getStaffAttendance);

module.exports = router;
