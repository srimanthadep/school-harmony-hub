# Production Backup Checklist ✅

## Current Backup Strategy

**✅ Email Backups (Primary)**
- Daily automated backups at **midnight IST** (Asia/Kolkata timezone)
- Backs up entire MongoDB database to ZIP file
- Automatically emailed to: `srimanthadep@gmail.com`
- Local retention: Last 7 backups kept in `backend/backups/`
- Gmail SMTP on port 465 (SSL) with app password authentication

**✅ Manual Backup**
- Available via Admin Panel → Maintenance tab → "Test Email" button
- Triggers immediate backup + email delivery
- Useful for on-demand backups before major changes

---

## Heroku Configuration Checklist

### Required Environment Variables

Verify these are set on Heroku (`heroku config --app YOUR_APP_NAME`):

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://...                   # ✅ Your MongoDB Atlas connection

# Authentication
JWT_SECRET=school_fee_secret_2025              # ✅ JWT signing key
JWT_EXPIRE=7d                                  # Token expiration

# Server Configuration
PORT=5000                                      # Heroku sets this automatically
NODE_ENV=production                            # Must be 'production' on Heroku
FRONTEND_URL=https://oxfordschool.cc,...       # Your frontend URLs (comma-separated)

# Backup Configuration (CRITICAL)
BACKUP_EMAIL_USER=srimanthadep@gmail.com       # ✅ Gmail address
BACKUP_EMAIL_PASS=nhbpolswphvidrhm             # ✅ Gmail app password
BACKUP_EMAIL_RECIPIENT=srimanthadep@gmail.com  # ✅ Where to send backups

# Admin
SUPER_ADMIN_EMAIL=srimanthadep@gmail.com       # Super admin account
```

### Set Missing Variables

If any are missing, run:

```powershell
# On your local machine
heroku config:set BACKUP_EMAIL_USER=srimanthadep@gmail.com --app YOUR_APP_NAME
heroku config:set BACKUP_EMAIL_PASS=nhbpolswphvidrhm --app YOUR_APP_NAME
heroku config:set BACKUP_EMAIL_RECIPIENT=srimanthadep@gmail.com --app YOUR_APP_NAME
heroku config:set NODE_ENV=production --app YOUR_APP_NAME
```

---

## Verification Steps

### 1. Check Heroku Logs for Backup Initialization

```bash
heroku logs --tail --app YOUR_APP_NAME | grep -i backup
```

**Expected output on server start:**
```
🛰️ Database link established.
⏰ Backup scheduler activated.
```

### 2. Verify Backup Schedule

The backup runs automatically at **00:00 IST** (midnight India time) daily.

**To test manually:**
1. Open your app: https://oxfordschool.cc
2. Login as admin
3. Go to **Admin Panel** → **Maintenance** tab
4. Click "Test Email"
5. Check your email within 1-2 minutes

### 3. Monitor Backup Logs

**Check if backups are running:**
```bash
heroku logs --app YOUR_APP_NAME --source app | grep -i backup
```

**Look for these messages:**
- `📦 Starting daily automated institutional backup...`
- `✅ Daily institutional backup completed`
- `✅ Backup emailed successfully`

**If you see errors:**
- `⚠️ Backup email not sent: BACKUP_EMAIL_USER or BACKUP_EMAIL_PASS not configured`
  → Set environment variables above

- `⚠️ Backup ZIP created but email failed to send`
  → Check Gmail app password is correct
  → Verify Gmail allows "Less secure app access" or uses App Password

---

## Backup Schedule

| Time (IST) | Action | Notification |
|---|---|---|
| 12:00 AM | Automated backup runs | Email sent to srimanthadep@gmail.com |
| Anytime | Manual backup via Admin Panel | Email sent immediately |

---

## Email Backup Details

**Format:** ZIP file containing JSON exports of all MongoDB collections
**Size:** ~20-30 KB (varies by data size)
**Filename:** `full_db_backup_YYYY-MM-DD.zip`
**Retention:** 
- Local (Heroku): Last 7 backups
- Email: Stored in your Gmail (unlimited if you have Google One)

---

## What Gets Backed Up

✅ All MongoDB collections:
- Students (profiles, fees, payments)
- Staff (profiles, salaries, leaves)
- Users (authentication)
- Attendance records (students & staff)
- Expense records
- Fee structures
- Settings
- Activity logs
- Deleted records

---

## Disaster Recovery

### Restore from Backup

1. **Download backup ZIP** from your email
2. **Extract JSON files**
3. **Restore to MongoDB:**

```bash
# For each collection
mongoimport --uri="YOUR_MONGODB_URI" --collection=students --file=students.json --jsonArray
mongoimport --uri="YOUR_MONGODB_URI" --collection=staff --file=staff.json --jsonArray
# ... repeat for all collections
```

### Quick Restore Script

Place this in `backend/scripts/restore-backup.js`:

```javascript
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function restoreBackup(backupDir) {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
        const collectionName = path.basename(file, '.json');
        const data = JSON.parse(fs.readFileSync(path.join(backupDir, file)));
        
        await db.collection(collectionName).deleteMany({});
        if (data.length > 0) {
            await db.collection(collectionName).insertMany(data);
        }
        console.log(`✅ Restored ${collectionName}: ${data.length} documents`);
    }
    
    await mongoose.disconnect();
}

// Usage: node restore-backup.js /path/to/extracted/backup
restoreBackup(process.argv[2]).catch(console.error);
```

---

## Monitoring

### Check Last Backup

```bash
heroku logs --app YOUR_APP_NAME --tail | grep "Daily institutional backup completed"
```

### Check Email Delivery

- Check your Gmail inbox for emails from your app
- Search for: `DAILY Institutional Backup`
- Latest should be from today at midnight IST

### Set Up Alerts (Optional)

Use services like:
- **UptimeRobot** - Monitor if app is running
- **Heroku Scheduler** - Run custom backup verification scripts
- **Gmail filters** - Auto-label backup emails for easy tracking

---

## Troubleshooting

### "No backup emails received"

1. Check Heroku environment variables are set
2. Verify Gmail app password is correct
3. Check Heroku logs for errors:
   ```bash
   heroku logs --app YOUR_APP_NAME --tail | grep -i error
   ```

### "Backup runs but email fails"

- Gmail may block the app temporarily
- Generate a new Gmail App Password:
  1. Go to https://myaccount.google.com/apppasswords
  2. Create new app password for "Mail"
  3. Update Heroku: `heroku config:set BACKUP_EMAIL_PASS=NEW_PASSWORD`

### "Heroku dyno sleeping"

**✅ You have a paid Heroku dyno** - no sleep issues!
- Your dyno runs 24/7
- Backups run reliably at midnight IST

---

## Best Practices

1. **Keep backups for at least 30 days** in your Gmail
2. **Test manual backup monthly** via Admin Panel
3. **Download a backup before major changes** (DB migrations, bulk updates)
4. **Verify backup integrity** by occasionally extracting and checking JSON files
5. **Monitor email delivery** - set up Gmail filters to track backup emails

---

## Production Deployment

### Deploy Changes

```bash
git add .
git commit -m "chore: Remove Google Drive backup, focus on email backups"
git push origin main
git push heroku main
```

### Verify Deployment

```bash
heroku logs --tail --app YOUR_APP_NAME
```

**Look for:**
- ✅ `Server running on port 5000`
- ✅ `MongoDB Connected`
- ✅ `Backup scheduler activated`

---

## Summary

✅ **Daily automated backups at midnight IST**
✅ **Email delivered to srimanthadep@gmail.com**
✅ **7-day local retention on Heroku**
✅ **Manual backup button in Admin Panel**
✅ **Paid Heroku dyno (24/7 uptime)**
✅ **Gmail with app password authentication**

**Your backups are solid! 🎉**

---

**Questions?** Check Heroku logs or test via Admin Panel → Maintenance tab.
