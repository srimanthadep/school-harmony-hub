const express = require('express');
const router = express.Router();
const {
    getStaff, getStaffMember, createStaff, updateStaff, deleteStaff,
    recordSalaryPayment, getSalaryHistory, getStaffStats
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/overview', authorize('admin'), getStaffStats);
router.route('/')
    .get(authorize('admin'), getStaff)
    .post(authorize('admin'), createStaff);

router.route('/:id')
    .get(authorize('admin', 'staff'), getStaffMember)
    .put(authorize('admin'), updateStaff)
    .delete(authorize('admin'), deleteStaff);

router.route('/:id/salaries')
    .get(authorize('admin', 'staff'), getSalaryHistory)
    .post(authorize('admin'), recordSalaryPayment);

module.exports = router;
