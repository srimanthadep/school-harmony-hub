const mongoose = require('mongoose');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

// Concurrency lock (single-instance; for multi-instance, use a database-backed flag)
let backupInProgress = false;

const cleanup = (backupDir) => {
    fs.rm(backupDir, { recursive: true, force: true }, (err) => {
        if (err) console.error('Backup cleanup error:', err.message);
    });
    backupInProgress = false;
};

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
        await fsPromises.mkdir(backupDir, { recursive: true });

        // Get all collection names from the database
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        // Export each collection as JSON
        for (const col of collections) {
            const data = await db.collection(col.name).find({}).toArray();
            const filePath = path.join(backupDir, `${col.name}.json`);
            await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
        }

        // Set response headers for ZIP download
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const filename = `${dd}-${mm}-${yyyy}-${hh}${min}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Create ZIP archive and pipe to response
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            throw err;
        });

        res.on('finish', () => cleanup(backupDir));
        res.on('close', () => cleanup(backupDir));

        archive.pipe(res);
        archive.directory(backupDir, false);
        await archive.finalize();
    } catch (err) {
        cleanup(backupDir);
        console.error('Backup error:', err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Backup failed: ' + err.message });
        }
    }
};
