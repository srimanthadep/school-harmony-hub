# Deployment Documentation: School Fee Management System

This document contains all the necessary configurations required to deploy the application.

---

## 1. MongoDB Atlas Configuration (Database)

| Requirement | Value |
| :--- | :--- |
| **Network Access** | Must add IP `0.0.0.0/0` (Allow Access from Anywhere) |
| **Connection String** | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0` |

> **Security note**: Do not commit real credentials to source control. Store them as environment variables on your hosting platform.

---

## 2. Frontend Environment Variables (Vercel)
These must be added in **Project Settings > Environment Variables** on the Vercel Dashboard.

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend.herokuapp.com/api` | Backend API base URL consumed by the frontend |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Gemini AI API key for chat feature (get from https://aistudio.google.com/app/apikey) |
| `VITE_OPENAI_API_KEY` | `sk-proj-...` | OpenAI / ChatGPT API key for chat feature (get from https://platform.openai.com/api-keys) |
| `NODE_ENV` | `production` | Tells the app it is running in production mode |

---

## 3. Backend Environment Variables (Heroku)
These must be added in your Heroku app **Settings > Config Vars**.

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/db` | Full connection string to MongoDB Atlas |
| `JWT_SECRET` | *(generate a strong random string)* | Secret key used to sign JWT tokens |
| `JWT_EXPIRE` | `7d` | Token expiry duration (e.g. `1d`, `7d`, `30d`) |
| `NODE_ENV` | `production` | Tells the app it is running in production mode |
| `FRONTEND_URL` | `https://oxfordschool.cc,https://www.oxfordschool.cc,https://admin.oxfordschool.cc` | Comma-separated list of allowed CORS origins (overrides default whitelist) |
| `PORT` | (leave blank) | Port the server listens on (Heroku sets this automatically) |

---

## 4. Vercel Project Settings

To ensure the "Monorepo" structure (separate frontend/backend folders) works:

1.  **Root Directory**: Set to `./` (or blank). **Do NOT set it to `frontend`**.
2.  **Framework Preset**: Select **Other**.
3.  **Build Command**: Leave blank (rely on `vercel.json` in the root).
4.  **Output Directory**: Leave blank.

---

## 5. Local Setup (Summary)

If you need to run the project locally again:
1.  **Backend**: `cd backend && cp .env.example .env` (then fill in values) `&& npm install && npm run dev`
2.  **Frontend**: `cd frontend && npm install && npm run dev`
3.  **Seed Data**: `cd backend && npm run seed`

---

## 6. Deployment Instructions (Step-by-Step)

### Backend (Heroku):
1.  Create a new Heroku app: `heroku create your-app-name`
2.  Connect to your GitHub repository or use Heroku CLI
3.  Add all **Backend Environment Variables** in Settings > Config Vars
4.  Deploy: `git push heroku main` or enable automatic deploys from GitHub
5.  The `Procfile` in the root will automatically start the backend

### Frontend (Vercel):
1.  Push all local files to GitHub (ensure `vercel.json` is in the root)
2.  Import the GitHub Repository into Vercel
3.  Add all **Frontend Environment Variables** (including `VITE_GEMINI_API_KEY`)
4.  Ensure **Root Directory** settings are correct
5.  Deploy

> ⚠️ **Migration note**: The password hashing algorithm was changed from SHA-256+JWT_SECRET to bcryptjs. All existing hashed passwords in the database are now invalid. Re-run `npm run seed` (or reset each password via the Admin Panel) after deploying.
