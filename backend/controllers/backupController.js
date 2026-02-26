const mongoose = require('mongoose');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

// Concurrency lock
let backupInProgress = false;

/**
 * POST /api/backup/download
 * Exports all MongoDB collections as JSON, zips them, and streams the ZIP to the client.
 * Works on MongoDB Atlas Free Tier without requiring mongodump.
 */
exports.downloadBackup = async (req, res) => {
    if (backupInProgress) {
        return res.status(429).json({ success: false, message: 'A backup is already in progress. Please wait.' });
    }

    backupInProgress = true;
    const backupDir = path.join(__dirname, '..', 'temp_backups', `backup_${Date.now()}`);

    try {
        // Create temp directory
        fs.mkdirSync(backupDir, { recursive: true });

        // Get all collection names from the database
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        // Export each collection as JSON
        for (const col of collections) {
            const data = await db.collection(col.name).find({}).toArray();
            const filePath = path.join(backupDir, `${col.name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }

        // Set response headers for ZIP download
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `school_backup_${dateStr}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Create ZIP archive and pipe to response
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            throw err;
        });

        // When the response finishes (download complete), clean up temp files
        res.on('finish', () => {
            fs.rm(backupDir, { recursive: true, force: true }, () => {});
            backupInProgress = false;
        });

        // If client disconnects, still clean up
        res.on('close', () => {
            fs.rm(backupDir, { recursive: true, force: true }, () => {});
            backupInProgress = false;
        });

        archive.pipe(res);
        archive.directory(backupDir, false);
        await archive.finalize();
    } catch (err) {
        // Clean up on error
        fs.rm(backupDir, { recursive: true, force: true }, () => {});
        backupInProgress = false;
        console.error('Backup error:', err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Backup failed: ' + err.message });
        }
    }
};
