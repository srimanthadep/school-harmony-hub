const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Admin
exports.getExpenses = async (req, res) => {
    try {
        const { type, academicYear } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (academicYear) filter.academicYear = academicYear;

        const expenses = await Expense.find(filter).sort({ date: -1 });
        res.json({ success: true, expenses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Admin
exports.createExpense = async (req, res) => {
    try {
        const expense = await Expense.create({ ...req.body, recordedBy: req.user._id });
        res.status(201).json({ success: true, message: 'Expense recorded successfully', expense });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Admin
exports.updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        res.json({ success: true, message: 'Expense updated', expense });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Admin
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        res.json({ success: true, message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
