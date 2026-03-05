/**
 * Test Backup Email Script
 * Run this to manually trigger a backup email test
 * Usage: node test-backup-email.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { performFullBackup } = require('./services/backupService');

const testBackupEmail = async () => {
    try {
        console.log('🧪 Testing backup email functionality...\n');
        console.log('📧 Email Configuration:');
        console.log('  - Sender:', process.env.BACKUP_EMAIL_USER);
        console.log('  - Recipient:', process.env.BACKUP_EMAIL_RECIPIENT || process.env.BACKUP_EMAIL_USER);
        console.log('  - App Password:', process.env.BACKUP_EMAIL_PASS ? '✓ Set' : '✗ Missing');
        console.log('\n');

        if (!process.env.BACKUP_EMAIL_USER || !process.env.BACKUP_EMAIL_PASS) {
            console.error('❌ Missing email configuration in .env file');
            console.error('Please set BACKUP_EMAIL_USER and BACKUP_EMAIL_PASS');
            process.exit(1);
        }

        // Connect to database
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to database\n');

        // Trigger backup
        console.log('📦 Creating backup and sending email...');
        await performFullBackup();
        
        console.log('\n✅ Test completed! Check:');
        console.log('  1. Server console for detailed logs');
        console.log('  2. Your email inbox:', process.env.BACKUP_EMAIL_RECIPIENT || process.env.BACKUP_EMAIL_USER);
        console.log('  3. backend/backups/ folder for the ZIP file');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err.message);
        console.error(err);
        process.exit(1);
    }
};

testBackupEmail();
