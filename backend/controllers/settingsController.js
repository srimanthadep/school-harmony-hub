const Settings = require('../models/Settings');
const FeeStructure = require('../models/FeeStructure');

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
        const fee = await FeeStructure.findOneAndUpdate(
            { class: req.body.class, academicYear: req.body.academicYear || '2024-25' },
            req.body,
            { new: true, upsert: true, runValidators: true }
        );
        res.json({ success: true, message: 'Fee structure saved', fee });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
