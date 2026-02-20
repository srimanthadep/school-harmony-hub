const express = require('express');
const router = express.Router();
const {
    getDashboard, getPendingFees, getClasswiseFees, getSalaryReport, getMonthlyReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'owner'));

router.get('/dashboard', getDashboard);
router.get('/pending-fees', getPendingFees);
router.get('/classwise-fees', getClasswiseFees);
router.get('/salary', getSalaryReport);
router.get('/monthly', getMonthlyReport);

module.exports = router;
