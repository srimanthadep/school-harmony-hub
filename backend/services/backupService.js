const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Student = require('../models/Student');
const Staff = require('../models/Staff');

/**
 * Daily Institutional Backup Service
 * Fix #32: Added IST timezone so backup runs at midnight India time, not UTC midnight (5:30 AM IST)
 */
const initBackupService = () => {
    // Schedule: 0 0 * * * (Every night at Midnight IST)
    cron.schedule('0 0 * * *', async () => {
        console.log('📦 Starting daily automated institutional backup...');
        await performFullBackup();
    }, {
        timezone: 'Asia/Kolkata' // Fix #32: Run at midnight IST, not UTC
    });
};

const performFullBackup = async () => {
    const backupRootDir = path.join(__dirname, '../backups'); // Fix #20: no shadowed variable
    if (!fs.existsSync(backupRootDir)) fs.mkdirSync(backupRootDir, { recursive: true });

    const mongoose = require('mongoose');
    const archiver = require('archiver');
    const tempDir = path.join(backupRootDir, `temp_${Date.now()}`);
    let zipFile = null; // Fix #29: track zip path to verify before emailing

    try {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // 1. Export all collections to JSON
        const db = mongoose.connection.db;
        if (!db) return console.error('❌ Backup failed: No DB connection');

        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const data = await db.collection(col.name).find({}).toArray();
            fs.writeFileSync(path.join(tempDir, `${col.name}.json`), JSON.stringify(data, null, 2));
        }

        // 2. ZIP the files
        const dateStr = new Date().toISOString().split('T')[0];
        zipFile = path.join(backupRootDir, `full_db_backup_${dateStr}.zip`);
        const output = fs.createWriteStream(zipFile);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(tempDir, false);
        await archive.finalize();

        // 3. Fix #29: Only email if ZIP was actually created
        if (fs.existsSync(zipFile)) {
            try {
                await sendBackupEmail([zipFile], `DAILY Institutional Backup - ${dateStr}`);
            } catch (emailErr) {
                console.error('⚠️ Backup ZIP created but email failed to send:', emailErr.message);
            }
        } else {
            console.error('❌ ZIP file was not created, skipping email.');
        }

        console.log(`✅ Daily institutional backup completed: ${zipFile}`);
    } catch (err) {
        console.error('❌ Daily Backup Failed:', err);
    } finally {
        // 4. Cleanup temp folders
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        // 5. ROTATE local backups (Keep last 7 days) — Fix #20: use backupRootDir, not re-declared var
        if (fs.existsSync(backupRootDir)) {
            const allBackups = fs.readdirSync(backupRootDir)
                .filter(f => f.startsWith('full_db_backup_'))
                .sort();

            while (allBackups.length > 7) {
                const oldFile = allBackups.shift();
                fs.unlinkSync(path.join(backupRootDir, oldFile));
            }
        }
    }
};

const sendBackupEmail = async (attachments, subject) => {
    // Fix #3: Use env vars only — no hardcoded email fallbacks
    const emailUser = process.env.BACKUP_EMAIL_USER;
    const emailPass = (process.env.BACKUP_EMAIL_PASS || '').trim();
    const emailRecipient = process.env.BACKUP_EMAIL_RECIPIENT || emailUser;

    if (!emailUser || !emailPass) {
        console.warn('⚠️ Backup email not sent: BACKUP_EMAIL_USER or BACKUP_EMAIL_PASS not configured in .env');
        return;
    }

    // Use Port 465 (SSL) and Force IPv4 via official 'family' setting
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: emailUser,
            pass: emailPass
        },
        family: 4, // Official Node.js/Nodemailer way to force IPv4
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 90000
    });

    console.log('🔌 Verifying SMTP (Forced IPv4 Port 465)...');
    let isConfigured = false;
    try {
        await transporter.verify();
        console.log('⭐ SUCCESS: Email Connection Ready!');
        isConfigured = true;
    } catch (vErr) {
        console.warn('⚠️ SMTP Verification FAILED (Render Firewall Blocked). Email backup skipped.');
    }

    const mailOptions = {
        from: `"Oxford School Backup" <${emailUser}>`, // Fix #3: use env var as sender
        to: emailRecipient, // Fix #3: use env var as recipient
        subject: subject || `Weekly School Data Backup - ${new Date().toDateString()}`,
        text: 'Please find the attached backup of school data.',
        attachments: attachments.map(file => ({
            filename: path.basename(file),
            path: file
        }))
    };

    if (isConfigured) {
        try {
            await transporter.sendMail(mailOptions);
            console.log('📧 Backup email sent successfully!');
        } catch (sendErr) {
            console.error('❌ Failed to send backup email:', sendErr.message);
        }
    } else {
        console.log('ℹ️ Local backup saved. Email was skipped due to connection issues.');
    }
};

module.exports = { initBackupService, performFullBackup };
