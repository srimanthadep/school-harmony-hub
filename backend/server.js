// Force Google DNS to resolve MongoDB Atlas SRV records (local dev fix)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const compression = require('compression');
const { initBackupService } = require('./services/backupService');
initBackupService();

const app = express();

// Performance and Security middleware
app.use(compression());
app.use(helmet());

const whitelist = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://192.168.0.184:5174', 'http://localhost:8080', 'https://oxfordschool.cc', 'https://www.oxfordschool.cc', 'https://admin.oxfordschool.cc'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // generous limit for admin-only app
  skip: (req) => process.env.NODE_ENV !== 'production' // no limit in dev
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body).length) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[HIDDEN]';
    console.log('Body:', safeBody);
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/salaries', require('./routes/salaries'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/staff-attendance', require('./routes/staffAttendance'));
app.use('/api/backup', require('./routes/backup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'School Fee Management API Running' });
});

// Root route
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Oxford School API Gateway</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { 
                font-family: 'Inter', sans-serif; 
                background: linear-gradient(135deg, #f0fdf4 0%, #e0e7ff 100%);
                color: #1e293b; 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
            }
            .container { 
                text-align: center; 
                background: white; 
                padding: 3rem 4rem; 
                border-radius: 16px; 
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); 
                max-width: 500px;
                width: 90%;
            }
            .logo {
                width: 72px;
                height: 72px;
                background: #4f46e5;
                color: white;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                margin: 0 auto 1.5rem auto;
                box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.4);
            }
            h1 { 
                color: #0f172a; 
                margin-bottom: 0.5rem; 
                font-size: 1.5rem;
                letter-spacing: -0.025em;
            }
            p { 
                color: #64748b; 
                margin-top: 0; 
                font-size: 0.95rem;
                line-height: 1.5;
            }
            .status { 
                display: inline-flex; 
                align-items: center; 
                gap: 8px; 
                background: #dcfce7; 
                color: #166534; 
                padding: 6px 16px; 
                border-radius: 9999px; 
                font-size: 0.875rem; 
                font-weight: 600; 
                margin-top: 1.5rem; 
            }
            .status::before { 
                content: ''; 
                width: 8px; 
                height: 8px; 
                background: #22c55e; 
                border-radius: 50%; 
                display: inline-block; 
                box-shadow: 0 0 8px #22c55e;
            }
            .footer {
                margin-top: 3rem;
                color: #94a3b8;
                font-size: 0.8rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🏫</div>
            <h1>Oxford School API</h1>
            <p>System Core & Database Gateway.</p>
            <p>This server strictly handles authenticated API requests from the main application panels.</p>
            <div class="status">All Systems Operational</div>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Oxford School Systems
        </div>
    </body>
    </html>
  `;
  res.send(html);
});

// --- TESTING ONLY: Hidden Backup Trigger ---
app.get('/api/safety/secret-backup-trigger', async (req, res) => {
  try {
    const { performFullBackup } = require('./services/backupService');
    await performFullBackup();
    res.status(200).json({ success: true, message: 'Backup triggered and email sent!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const { errorHandler } = require('./middleware/errorMiddleware');
// ... after routes
app.use(errorHandler);

const { connectDB } = require('./utils/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
