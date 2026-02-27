const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix

/**
 * Normalizes MongoDB URI based on environment (Rule 1)
 */
function getNormalizedUri() {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in environment');
        process.exit(1);
    }

    const isProd = process.env.NODE_ENV === 'production';
    const dbName = isProd ? 'school_prod' : 'school_dev';

    if (mongoUri.includes('.net/')) {
        // Cluster URI (Atlas)
        mongoUri = mongoUri.replace(/\.net\/[^?]*/, `.net/${dbName}`);
    } else if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1') || mongoUri.includes('mongodb://')) {
        // Local or standard URI
        if (isProd && (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'))) {
            console.error('❌ SECURITY ALERT: NEVER CONNECT TO PRODUCTION DATABASE LOCALLY.');
            process.exit(1);
        }

        // Handle database name in URI
        const urlObj = new URL(mongoUri.startsWith('mongodb') ? mongoUri : `mongodb://${mongoUri}`);
        urlObj.pathname = `/${dbName}`;
        mongoUri = urlObj.toString();
    }

    return { mongoUri, dbName };
}

async function connectDB() {
    const { mongoUri, dbName } = getNormalizedUri();
    try {
        await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected to: ${dbName}`);
        return mongoose.connection;
    } catch (err) {
        console.error(`❌ MongoDB connection to ${dbName} failed:`, err.message);
        process.exit(1);
    }
}

module.exports = { connectDB, getNormalizedUri };
