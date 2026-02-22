const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Student = require('../models/Student');
const Payment = require('../models/Payment');

/**
 * Weekly Backup Service
 * Runs every Sunday at Midnight
 */
const initBackupService = () => {
    // Schedule: 0 0 * * 0 (Sunday Midnight)
    // For testing you can use: * * * * * (Every minute)
    cron.schedule('0 0 * * 0', async () => {
        console.log('📦 Starting weekly automated backup...');
        await performBackup();
    });
};

const performBackup = async () => {
    const backupDir = path.join(__dirname, '../temp_backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const dateStr = new Date().toISOString().split('T')[0];
    const studentFile = path.join(backupDir, `students_backup_${dateStr}.csv`);
    const paymentFile = path.join(backupDir, `payments_backup_${dateStr}.csv`);

    try {
        // 1. Export Students
        const students = await Student.find().lean();
        const studentCsvWriter = createCsvWriter({
            path: studentFile,
            header: [
                { id: 'studentId', title: 'Student ID' },
                { id: 'name', title: 'Name' },
                { id: 'class', title: 'Class' },
                { id: 'parentName', title: 'Parent' },
                { id: 'parentPhone', title: 'Phone' },
                { id: 'totalFee', title: 'Total Fee' },
                { id: 'status', title: 'Status' }
            ]
        });
        await studentCsvWriter.writeRecords(students);

        // 2. Export Payments
        const payments = await Payment.find().populate('studentId', 'name studentId').lean();
        const paymentCsvWriter = createCsvWriter({
            path: paymentFile,
            header: [
                { id: 'receiptNo', title: 'Receipt No' },
                { id: 'studentId.name', title: 'Student' },
                { id: 'studentId.studentId', title: 'ID' },
                { id: 'amount', title: 'Amount' },
                { id: 'paymentDate', title: 'Date' },
                { id: 'paymentMode', title: 'Mode' }
            ]
        });

        // Flatten payment data for CSV
        const flatPayments = payments.map(p => ({
            ...p,
            'studentId.name': p.studentId?.name || 'N/A',
            'studentId.studentId': p.studentId?.studentId || 'N/A'
        }));
        await paymentCsvWriter.writeRecords(flatPayments);

        // 3. Email Backups
        await sendBackupEmail([studentFile, paymentFile]);

        // 4. Cleanup
        setTimeout(() => {
            if (fs.existsSync(studentFile)) fs.unlinkSync(studentFile);
            if (fs.existsSync(paymentFile)) fs.unlinkSync(paymentFile);
        }, 60000); // Wait a minute before delete

        console.log('✅ Weekly backup completed and emailed.');
    } catch (err) {
        console.error('❌ Backup Failed:', err);
    }
};

const sendBackupEmail = async (attachments) => {
    // These should ideally be in .env
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.BACKUP_EMAIL_USER || 'srimanthadep@gmail.com',
            pass: process.env.BACKUP_EMAIL_PASS // App password needed
        }
    });

    const mailOptions = {
        from: '"Oxford School Backup" <noreply@oxfordschool.cc>',
        to: 'srimanthadep@gmail.com',
        subject: `Weekly School Data Backup - ${new Date().toDateString()}`,
        text: 'Please find the attached weekly backup of student records and payment history.',
        attachments: attachments.map(file => ({
            filename: path.basename(file),
            path: file
        }))
    };

    if (process.env.BACKUP_EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
    } else {
        console.warn('⚠️ Backup email not sent: BACKUP_EMAIL_PASS not configured in .env');
    }
};

module.exports = { initBackupService, performBackup };
