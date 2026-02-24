const express = require('express');
const router = express.Router();
const { saveAttendance, getAttendance } = require('../controllers/attendanceController');

router.post('/', saveAttendance);
router.get('/:date', getAttendance);

module.exports = router;
