# School Harmony Hub

A comprehensive school management system built with React, TypeScript, Vite, and Supabase.

## Features

### Admin Features
- **Dashboard** — Key stats: total students/staff, fees collected/pending, book fees, students fully paid, collection rate
- **Students** — Full CRUD, class/section/status filtering, export to CSV, fee management per student, student promotion
- **Staff** — Full CRUD, salary management per staff member, export to CSV
- **Fees** — View all fee transactions, filter by class/receipt
- **Salaries** — View all salary payments, search by staff/month
- **Fee Structures** — Configure tuition and book fee structures per class and academic year; cascade to all active students
- **Reports** — Fee overview charts, pending fees report, salary report
- **Settings** — Edit school info (name, address, phone, email, website, principal), configure academic year, currency, and receipt/slip numbering

### Student Portal
- View own fee details and payment history

### Teacher Portal
- View own salary and payment history

### Role-based Access
- Roles: `admin`, `student`, `teacher`
- All features protected by Supabase Row Level Security (RLS)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| State | TanStack Query + React state |
| Charts | Recharts |
| Testing | Vitest + Testing Library |

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) account and project

### 1. Clone and install

```bash
git clone https://github.com/srimanthadep/school-harmony-hub.git
cd school-harmony-hub
npm install
```

### 2. Configure environment variables

Copy `.env` and fill in your Supabase credentials:

```bash
cp .env .env.local
```

Set the following in `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Never commit secrets** — `.env.local` is git-ignored.

### 3. Apply database migrations

Apply all migrations in the `supabase/migrations/` folder to your Supabase project:

**Option A — Supabase CLI:**
```bash
npx supabase db push
```

**Option B — Dashboard:**
1. Go to your Supabase project → **SQL Editor**.
2. Run each `.sql` file in `supabase/migrations/` in chronological order.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

### 5. Create the first admin user

1. Register via the login page.
2. In Supabase SQL Editor, assign the admin role:

```sql
SELECT assign_user_role('admin@yourschool.edu', 'admin');
```

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | User profile (auto-created on signup) |
| `user_roles` | Role assignments (`admin`, `student`, `teacher`) |
| `students` | Student records with fee details |
| `fee_payments` | Individual fee payment records |
| `staff` | Staff records with salary details |
| `salary_payments` | Individual salary payment records |
| `school_settings` | Single-row school configuration |
| `fee_structures` | Tuition fee structure per class/year |
| `book_fee_structures` | Book fee structure per class/year |

### Key Columns Added

**`students`**
- `total_book_fee` — Annual book fee amount
- `academic_year` — Current academic year (e.g. `2024-25`)
- `status` — `active` or `inactive`

**`fee_payments`**
- `fee_type` — `tuition` or `book`
- `recorded_by` — User ID who recorded the payment

**`salary_payments`**
- `recorded_by` — User ID who recorded the payment

### Supabase Functions

| Function | Description |
|---|---|
| `apply_fee_structure(class, year)` | Updates `total_fee` for all active students in the given class/year |
| `apply_book_fee_structure(class, year)` | Updates `total_book_fee` for all active students |
| `promote_students(from_year, to_year)` | Promotes all active students; graduates 10th class students |
| `assign_user_role(email, role)` | Assigns a role to a user by email |

---

## Student Promotion

Admin can promote all active students from one academic year to the next via **Students → Promote**:

1. Select the source year (e.g. `2024-25`)
2. Select the target year (e.g. `2025-26`)
3. Click **Promote**

The system:
- Moves each student to the next class in order: `Nursery → LKG → UKG → 1st → … → 10th`
- Applies the new year's fee structure (if configured) to set `total_fee` and `total_book_fee`
- Marks 10th-class students as `inactive` (graduated)

---

## Fee Structures

Configure fees per class and academic year in **Fee Structures**:

### Tuition Fee Structure fields
`tuitionFee`, `admissionFee`, `examFee`, `libraryFee`, `sportsFee`, `transportFee`, `miscFee` → computed `totalFee`

### Book Fee Structure fields
`readingBookFee`, `textBooksFee`, `practiceWorkBookFee`, `funWithDotBookFee`, `dairyFee`, `idCardFee`, `coversFee`, `noteBooksFee`, `miscFee` → computed `totalFee`

After saving, click the **↻** (cascade) button to push the total fee to all active students in that class/year.

---

## Importing Student / Staff Data

See [`docs/DATA_IMPORT.md`](docs/DATA_IMPORT.md) for full instructions including:
- CSV format specification
- Supabase Dashboard import
- SQL INSERT approach
- Node.js script approach
- Applying fee structures after import

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |

> The service role key is **never** exposed to the frontend.

---

## Deployment

### Lovable / Vercel / Netlify

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting provider's environment settings.
2. Deploy the repository. The build command is `npm run build` and the output directory is `dist`.

### Supabase Edge Functions

This project does not currently use Edge Functions — all business logic runs client-side with Supabase RLS and PostgreSQL functions for security.

---

## Security

- All tables use Row Level Security (RLS).
- The `has_role()` function (SECURITY DEFINER) safely checks roles without exposing the `user_roles` table directly.
- Receipt/slip numbers are generated client-side with timestamp entropy; for strict uniqueness enforcement, use the `last_receipt_no`/`last_slip_no` counters in `school_settings` (updated server-side).
- No secrets are committed to this repository.

