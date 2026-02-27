const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BACKUP_DIR = path.join(__dirname, '../backups');

async function runInstitutionalBackup() {
    console.log('📦 RUNNING INSTITUTIONAL BACKUP (3-2-1 Rule)...');

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const tempDir = path.join(BACKUP_DIR, `temp_${Date.now()}`);

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log(`📡 Exporting ${collections.length} collections...`);
        for (const col of collections) {
            const data = await db.collection(col.name).find({}).toArray();
            fs.writeFileSync(path.join(tempDir, `${col.name}.json`), JSON.stringify(data, null, 2));
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const zipName = `institutional_backup_${dateStr}.zip`;
        const zipFile = path.join(BACKUP_DIR, zipName);

        const output = fs.createWriteStream(zipFile);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(tempDir, false);
        await archive.finalize();

        console.log(`✅ Stage 1: Local Backup Successful -> ${zipFile}`);

        // Clean up temp
        fs.rmSync(tempDir, { recursive: true, force: true });

        // Phase 2: Rotating local (Keep last 14 days)
        const allBackups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('institutional_backup_'))
            .sort();

        while (allBackups.length > 14) {
            const oldFile = allBackups.shift();
            fs.unlinkSync(path.join(BACKUP_DIR, oldFile));
            console.log(`🗑️  Rotated out old backup: ${oldFile}`);
        }

        console.log('🚀 Phase 3: Off-site Cloud Copy (Optional: Hook into Google Drive / Email)');

        // Example: If node-mailer is configured, we could email this too.
        // For now, local and persistent storage is ready.

    } catch (err) {
        console.error('❌ Institutional Backup Failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runInstitutionalBackup();
