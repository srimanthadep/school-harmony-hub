# Deployment Documentation: School Fee Management System

This document contains all the necessary keys, values, and configurations required to deploy the application to Vercel and connect it to MongoDB Atlas.

---

## 1. MongoDB Atlas Configuration (Database)

| Requirement | Value |
| :--- | :--- |
| **Username** | `srimanthadep_db_user` |
| **Initial Password** | `rfbSM2WOhZ2E0he1` |
| **Network Access** | Must add IP `0.0.0.0/0` (Allow Access from Anywhere) |
| **Connection String** | `mongodb+srv://srimanthadep_db_user:rfbSM2WOhZ2E0he1@cluster0.erwmelx.mongodb.net/?appName=Cluster0` |

---

## 2. Vercel Environment Variables
These must be added in **Project Settings > Environment Variables** on the Vercel Dashboard.

| Key | Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://srimanthadep_db_user:rfbSM2WOhZ2E0he1@cluster0.erwmelx.mongodb.net/?appName=Cluster0` | Full connection string to Atlas |
| `JWT_SECRET` | `school_fee_mgmt_secret_2024` | Used for login authentication |
| `NODE_ENV` | `production` | Tells the app it is running in production mode |

---

## 3. Vercel Project Settings

To ensure the "Monorepo" structure (separate frontend/backend folders) works:

1.  **Root Directory**: Set to `./` (or blank). **Do NOT set it to `frontend`**.
2.  **Framework Preset**: Select **Other**.
3.  **Build Command**: Leave blank (rely on `vercel.json` in the root).
4.  **Output Directory**: Leave blank.

---

## 4. Local Setup (Summary)

If you need to run the project locally again:
1.  **Backend**: `cd backend && npm install && npm run dev`
2.  **Frontend**: `cd frontend && npm install && npm run dev`
3.  **Data Import**: To re-import students from CSV files, run `node backend/scripts/importStudentsSafe.js`.

---

## 5. Deployment Instructions (Step-by-Step)
1.  Push all local files to GitHub (ensure `vercel.json` is in the root).
2.  Import the GitHub Repository into Vercel.
3.  Add the **3 Environment Variables** listed above.
4.  Ensure **Root Directory** settings are correct.
5.  Deploy.
