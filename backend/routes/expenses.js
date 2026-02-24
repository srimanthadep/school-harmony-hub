const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

const adminOrOwner = [protect, authorize('admin', 'owner')];
const ownerOnly = [protect, authorize('owner')];

router.get('/', adminOrOwner, getExpenses);
router.post('/', adminOrOwner, createExpense);
router.put('/:id', ownerOnly, updateExpense);
router.delete('/:id', ownerOnly, deleteExpense);

module.exports = router;
