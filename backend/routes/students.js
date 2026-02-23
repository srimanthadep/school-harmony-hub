const express = require('express');
const router = express.Router();
const {
    getStudents, getStudent, createStudent, updateStudent, deleteStudent,
    recordPayment, getPaymentHistory, getStudentStats, editPayment, deletePayment, promoteStudents, bulkImportStudents, bulkDeleteStudents
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// Stats
router.get('/stats/overview', authorize('admin', 'owner'), getStudentStats);

// Promote & Import
router.post('/promote', authorize('admin', 'owner'), promoteStudents);
router.post('/import', authorize('admin', 'owner'), upload.single('file'), bulkImportStudents);
router.post('/bulk-delete', authorize('admin', 'owner'), bulkDeleteStudents);

// Student list / creation
router.route('/')
    .get(authorize('admin', 'owner'), getStudents)
    .post(authorize('admin', 'owner'), createStudent);

// Individual student
router.route('/:id')
    .get(authorize('admin', 'owner', 'student'), getStudent)
    .put(authorize('admin', 'owner'), updateStudent)
    .delete(authorize('admin', 'owner'), deleteStudent);

// Payments
router.route('/:id/payments')
    .get(authorize('admin', 'owner', 'student'), getPaymentHistory)
    .post(authorize('admin', 'owner'), recordPayment);

// Edit or Delete a specific payment — OWNER ONLY (admin explicitly blocked in controller)
router.route('/:id/payments/:paymentId')
    .put(authorize('owner'), editPayment)
    .delete(authorize('owner'), deletePayment);

module.exports = router;
