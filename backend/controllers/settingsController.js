const Settings = require('../models/Settings');
const FeeStructure = require('../models/FeeStructure');
const BookFeeStructure = require('../models/BookFeeStructure');
const Student = require('../models/Student');

// @desc    Get settings
// @route   GET /api/settings
// @access  Admin
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Admin
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(req.body);
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }
        res.json({ success: true, message: 'Settings updated', settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get fee structures
// @route   GET /api/settings/fee-structures
// @access  Admin
exports.getFeeStructures = async (req, res) => {
    try {
        const structures = await FeeStructure.find().sort({ class: 1 });
        res.json({ success: true, structures });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update/Create fee structure for a class
// @route   POST /api/settings/fee-structures
// @access  Admin
exports.upsertFeeStructure = async (req, res) => {
    try {
        const data = { ...req.body };

        if (!data.class || !data.academicYear) {
            return res.status(400).json({ success: false, message: 'class and academicYear are required' });
        }

        // Manually compute totalFee since findOneAndUpdate bypasses pre-save hooks
        data.totalFee = ['tuitionFee', 'admissionFee', 'examFee', 'libraryFee', 'sportsFee', 'transportFee', 'miscFee']
            .reduce((sum, key) => sum + Number(data[key] || 0), 0);

        const fee = await FeeStructure.findOneAndUpdate(
            { class: data.class, academicYear: data.academicYear },
            data,
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        // Cascade: update totalFee on all active students of this class and academic year
        const updateResult = await Student.updateMany(
            { class: data.class, academicYear: data.academicYear, isActive: true },
            { $set: { totalFee: data.totalFee } }
        );

        res.json({
            success: true,
            message: `Fee structure saved. Updated totalFee for ${updateResult.modifiedCount} student(s) in ${data.class}.`,
            fee,
            studentsUpdated: updateResult.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get book fee structures
// @route   GET /api/settings/book-fee-structures
// @access  Admin
exports.getBookFeeStructures = async (req, res) => {
    try {
        const structures = await BookFeeStructure.find().sort({ class: 1 });
        res.json({ success: true, structures });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update/Create book fee structure for a class
// @route   POST /api/settings/book-fee-structures
// @access  Admin
exports.upsertBookFeeStructure = async (req, res) => {
    try {
        const data = { ...req.body };

        // Manually compute totalFee since findOneAndUpdate bypasses pre-save hooks
        data.totalFee = ['readingBookFee', 'textBooksFee', 'practiceWorkBookFee', 'funWithDotBookFee', 'dairyFee', 'idCardFee', 'coversFee', 'noteBooksFee', 'miscFee']
            .reduce((sum, key) => sum + Number(data[key] || 0), 0);

        let fee = await BookFeeStructure.findOneAndUpdate(
            { class: data.class },
            data,
            { new: true, upsert: true, runValidators: true }
        );

        // Update totalBookFee in all existing students of this class
        const updateResult = await Student.updateMany(
            { class: data.class, isActive: true },
            { $set: { totalBookFee: data.totalFee } }
        );

        res.json({
            success: true,
            message: `Book's Fee structure saved. Updated totalBookFee for ${updateResult.modifiedCount} student(s) in ${data.class}.`,
            fee,
            studentsUpdated: updateResult.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
