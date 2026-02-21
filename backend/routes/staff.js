const express = require('express');
const router = express.Router();
const {
    getStaff, getStaffMember, createStaff, updateStaff, deleteStaff,
    recordSalaryPayment, getSalaryHistory, getStaffStats, editSalaryPayment, deleteSalaryPayment
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/overview', authorize('admin', 'owner'), getStaffStats);

router.route('/')
    .get(authorize('admin', 'owner'), getStaff)
    .post(authorize('admin', 'owner'), createStaff);

router.route('/:id')
    .get(authorize('admin', 'owner', 'staff'), getStaffMember)
    .put(authorize('admin', 'owner'), updateStaff)
    .delete(authorize('admin', 'owner'), deleteStaff);

router.route('/:id/salaries')
    .get(authorize('admin', 'owner', 'staff'), getSalaryHistory)
    .post(authorize('admin', 'owner'), recordSalaryPayment);

router.route('/:id/salaries/:paymentId')
    .put(authorize('owner'), editSalaryPayment)
    .delete(authorize('owner'), deleteSalaryPayment);

module.exports = router;
