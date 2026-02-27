const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Student = require('../models/Student');
const Staff = require('../models/Staff');

/**
 * Daily Institutional Backup Service
 * Runs every night at Midnight
 */
const initBackupService = () => {
    // Schedule: 0 0 * * * (Every night at Midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('📦 Starting daily automated institutional backup...');
        await performFullBackup();
    });
};

const performFullBackup = async () => {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const mongoose = require('mongoose');
    const archiver = require('archiver');
    const tempDir = path.join(backupDir, `temp_${Date.now()}`);

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
        const zipFile = path.join(backupDir, `full_db_backup_${dateStr}.zip`);
        const output = fs.createWriteStream(zipFile);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(tempDir, false);
        await archive.finalize();

        // 3. Email Backup (3-2-1 rule: Email is the off-site copy)
        try {
            await sendBackupEmail([zipFile], `DAILY Institutional Backup - ${dateStr}`);
        } catch (emailErr) {
            console.error('⚠️ Backup ZIP created but email failed to send:', emailErr.message);
        }

        console.log(`✅ Daily institutional backup completed: ${zipFile}`);
    } catch (err) {
        console.error('❌ Daily Backup Failed:', err);
    } finally {
        // 4. Cleanup temp folders
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        // 5. ROTATE local backups (Keep last 7 days)
        const backupDir = path.join(__dirname, '../backups');
        if (fs.existsSync(backupDir)) {
            const allBackups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('full_db_backup_'))
                .sort();

            while (allBackups.length > 7) {
                const oldFile = allBackups.shift();
                fs.unlinkSync(path.join(backupDir, oldFile));
            }
        }
    }
};

const sendBackupEmail = async (attachments, subject) => {
    // --- FINAL ROBUST CONFIG ---
    const pass = (process.env.BACKUP_EMAIL_PASS || '').trim();

    // Use Port 587 (STARTTLS) and Force IPv4 at the Socket levels
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
            user: (process.env.BACKUP_EMAIL_USER || 'srimanthadep@gmail.com').trim(),
            pass: pass
        },
        // MAGIC FIX: Force binding to IPv4 to prevent IPv6 routing errors
        localAddress: '0.0.0.0',
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 90000
    });

    console.log('🔌 Verifying final SMTP connection (IPv4-Forced)...');
    try {
        await transporter.verify();
        console.log('⭐ SUCCESS: Email Connection Ready!');
    } catch (vErr) {
        console.error('❌ FINAL FAIL: Render is blocking all SMTP ports. Message:', vErr.message);
        throw vErr;
    }

    const mailOptions = {
        from: '"Oxford School Backup" <noreply@oxfordschool.cc>',
        to: 'srimanthadep@gmail.com',
        subject: subject || `Weekly School Data Backup - ${new Date().toDateString()}`,
        text: 'Please find the attached backup of school data.',
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

module.exports = { initBackupService, performFullBackup };
