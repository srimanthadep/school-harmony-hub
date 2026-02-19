# 🏫 School Fee & Salary Management System

A full-stack web application for managing school student fees and staff salaries with role-based authentication.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Recharts |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (JSON Web Tokens) |
| PDF | jsPDF + jspdf-autotable |
| Excel | xlsx |

---

## 📋 Prerequisites

1. **Node.js** v18+ - [Download](https://nodejs.org/)
2. **MongoDB** - Choose one:
   - Local: [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/atlas) (Free tier)

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd frontend
npm install
```

### 2. Configure MongoDB

**Option A - Local MongoDB:**
Start MongoDB service. The default URI `mongodb://localhost:27017/school_fee_management` in `.env` works.

**Option B - MongoDB Atlas (Cloud):**
1. Create free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get your connection string
3. Edit `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/school_fee_management
   ```

### 3. Seed Demo Data

```bash
cd backend
npm run seed
```

This creates:
- 1 Admin user
- 10 Staff members (with salary payment history)
- 15 Students across all classes (with fee payment history)
- Fee structures for all 13 classes

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@school.edu | Admin@123 |
| **Staff** | amit@school.edu | Staff@123 |
| **Student** | student1@school.edu | Student@123 |

---

## 👥 User Roles & Access

### Admin
- Full dashboard with analytics
- Complete student management (CRUD)
- Complete staff management (CRUD)
- Fee payment recording with receipt generation
- Salary payment recording with salary slip
- Reports: class-wise, pending, monthly, salary
- School settings & fee structure configuration
- Export students as Excel/PDF

### Student (View Only)
- View own fee summary and payment status
- Download fee receipts as PDF
- Payment progress visualization

### Staff (View Only)
- View own salary details and history
- Download salary slips as PDF

---

## 📦 Features

### Student Management
- ✅ Add/Edit/Delete students
- ✅ Class (Nursery → 10th), Section, Roll No
- ✅ Parent/Guardian details
- ✅ Annual fee assignment per student
- ✅ Record partial and full fee payments
- ✅ Auto-calculate pending balance
- ✅ Full payment history per student
- ✅ Download fee receipt as PDF (school letterhead)
- ✅ Export all students as Excel
- ✅ Export all students as PDF
- ✅ Search, filter by class/section, sort

### Staff Management
- ✅ Add/Edit/Delete staff
- ✅ Roles: Teacher, Principal, Librarian, etc.
- ✅ Monthly salary recording (partial/full)
- ✅ Salary history per staff
- ✅ Download salary slip as PDF
- ✅ Search and filter by role

### Reports
- ✅ Class-wise fee collection analysis
- ✅ Pending fees with student details
- ✅ Monthly income vs salary expense chart
- ✅ Staff salary report

### Dashboard
- ✅ Overview stats (students, staff, fees, salary)
- ✅ Monthly bar charts
- ✅ Fee collection pie chart
- ✅ Class-wise collection bar chart
- ✅ Recent payments table

---

## 📁 Project Structure

```
school-fee-management/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── staffController.js
│   │   ├── reportController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js           # With embedded fee payments
│   │   ├── Staff.js             # With embedded salary payments
│   │   ├── FeeStructure.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── students.js
│   │   ├── staff.js
│   │   ├── reports.js
│   │   └── settings.js
│   ├── seed/
│   │   └── seedData.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── StudentsPage.jsx
    │   │   ├── StaffPage.jsx
    │   │   ├── ReportsPage.jsx
    │   │   ├── SettingsPage.jsx
    │   │   ├── StudentPortal.jsx
    │   │   └── StaffPortal.jsx
    │   ├── utils/
    │   │   ├── api.js            # Axios instance
    │   │   └── pdfUtils.js       # PDF & Excel exports
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/login              - Login
GET    /api/auth/me                 - Get current user
PUT    /api/auth/change-password    - Change password
GET    /api/auth/users              - Get all users (admin)
```

### Students
```
GET    /api/students                - List students (filter: class, section, search)
POST   /api/students                - Create student
GET    /api/students/:id            - Get student
PUT    /api/students/:id            - Update student
DELETE /api/students/:id            - Delete student
GET    /api/students/:id/payments   - Payment history
POST   /api/students/:id/payments   - Record payment
GET    /api/students/stats/overview - Dashboard stats
```

### Staff
```
GET    /api/staff                   - List staff (filter: role, search)
POST   /api/staff                   - Create staff
GET    /api/staff/:id               - Get staff member
PUT    /api/staff/:id               - Update staff
DELETE /api/staff/:id               - Delete staff
GET    /api/staff/:id/salaries      - Salary history
POST   /api/staff/:id/salaries      - Record salary payment
GET    /api/staff/stats/overview    - Staff stats
```

### Reports
```
GET    /api/reports/dashboard       - Full dashboard data
GET    /api/reports/pending-fees    - Students with pending fees
GET    /api/reports/classwise-fees  - Class-wise collection
GET    /api/reports/salary          - Salary report
GET    /api/reports/monthly         - Monthly income vs expense
```

### Settings
```
GET    /api/settings                - Get school settings
PUT    /api/settings                - Update settings
GET    /api/settings/fee-structures - Get fee structures
POST   /api/settings/fee-structures - Create/update fee structure
```

---

## 🚀 Deployment

### Backend (Railway / Render)
1. Push to GitHub
2. Connect to Railway/Render
3. Set environment variables from `.env`
4. Set `MONGODB_URI` to your Atlas connection string
5. Set `NODE_ENV=production`

### Frontend (Vercel / Netlify)
1. Update `vite.config.js` proxy to your deployed backend URL (or use env vars)
2. Or set `VITE_API_URL` in Vercel/Netlify env vars and update `api.js`

---

## 🔒 Security Features
- JWT authentication with 7-day expiry
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 req/15min per IP)
- Helmet.js security headers
- CORS restricted to frontend URL
- Role-based access control on all routes
- Soft-delete (data preserved, marked inactive)
