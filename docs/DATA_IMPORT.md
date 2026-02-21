# Data Import Guide — School Harmony Hub

This document explains how to import student and staff data into School Harmony Hub using the Supabase backend.

## Overview

School Harmony Hub uses Supabase (PostgreSQL) as its database. All student and staff data lives in the `students` and `staff` tables. You can import data via:

1. **Supabase Dashboard** (CSV import)
2. **SQL scripts** (direct INSERT statements)
3. **Supabase JS SDK** (programmatic import)

---

## 1. Importing Students

### Required CSV columns

| Column | Type | Notes |
|---|---|---|
| `student_id` | text | Unique identifier, e.g. `STU001` |
| `full_name` | text | Student's full name |
| `class` | text | One of: `Nursery`, `LKG`, `UKG`, `1st`–`10th` |
| `section` | text | e.g. `A`, `B`, `C` |
| `roll_no` | integer | Roll number in class |
| `parent_name` | text | Guardian's name |
| `parent_phone` | text | Guardian's phone |
| `parent_email` | text (optional) | Guardian's email |
| `address` | text (optional) | Home address |
| `total_fee` | numeric | Annual tuition fee (e.g. `12000`) |
| `total_book_fee` | numeric | Annual book fee (e.g. `2500`) |
| `academic_year` | text | e.g. `2024-25` |
| `status` | text | `active` or `inactive` (default: `active`) |

### Sample CSV

```csv
student_id,full_name,class,section,roll_no,parent_name,parent_phone,parent_email,address,total_fee,total_book_fee,academic_year,status
STU001,Ravi Kumar,1st,A,1,Suresh Kumar,9876543210,suresh@example.com,123 Main St,12000,2500,2024-25,active
STU002,Priya Sharma,2nd,B,5,Rajesh Sharma,9876543211,,456 Oak Ave,13000,2700,2024-25,active
STU003,Ananya Reddy,UKG,A,3,Kavitha Reddy,9876543212,kavitha@example.com,789 Pine Rd,8000,2000,2024-25,active
```

### Import via Supabase Dashboard

1. Go to your Supabase project → **Table Editor** → `students` table.
2. Click **Import data** → choose your CSV file.
3. Map columns to match the table schema.
4. Click **Import**.

### Import via SQL

```sql
INSERT INTO public.students
  (student_id, full_name, class, section, roll_no, parent_name, parent_phone,
   parent_email, address, total_fee, total_book_fee, academic_year, status)
VALUES
  ('STU001','Ravi Kumar','1st','A',1,'Suresh Kumar','9876543210',
   'suresh@example.com','123 Main St',12000,2500,'2024-25','active'),
  ('STU002','Priya Sharma','2nd','B',5,'Rajesh Sharma','9876543211',
   NULL,'456 Oak Ave',13000,2700,'2024-25','active');
```

### Import via JavaScript (Node.js script)

```js
// scripts/import-students.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const csv = readFileSync("./data/students.csv", "utf-8");
const records = parse(csv, { columns: true, skip_empty_lines: true });

const { error } = await supabase.from("students").insert(
  records.map(r => ({
    student_id: r.student_id,
    full_name: r.full_name,
    class: r.class,
    section: r.section || "A",
    roll_no: parseInt(r.roll_no, 10),
    parent_name: r.parent_name,
    parent_phone: r.parent_phone,
    parent_email: r.parent_email || null,
    address: r.address || null,
    total_fee: parseFloat(r.total_fee) || 0,
    total_book_fee: parseFloat(r.total_book_fee) || 0,
    academic_year: r.academic_year || "2024-25",
    status: r.status || "active",
  }))
);

if (error) console.error("Import failed:", error.message);
else console.log(`Imported ${records.length} student(s).`);
```

Run with:
```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your_service_key \
node scripts/import-students.mjs
```

---

## 2. Importing Staff

### Required CSV columns

| Column | Type | Notes |
|---|---|---|
| `staff_id` | text | Unique identifier, e.g. `STF001` |
| `full_name` | text | Staff member's full name |
| `role` | text | e.g. `Teacher`, `Principal`, `Accountant` |
| `subject` | text (optional) | Subject taught (for teachers) |
| `monthly_salary` | numeric | Monthly salary amount |
| `joining_date` | date (optional) | Format: `YYYY-MM-DD` |
| `phone` | text (optional) | Contact phone |
| `email` | text (optional) | Email address |
| `address` | text (optional) | Home address |

### Sample CSV

```csv
staff_id,full_name,role,subject,monthly_salary,joining_date,phone,email,address
STF001,Lakshmi Devi,Teacher,Mathematics,25000,2020-06-01,9876500001,lakshmi@school.edu,100 Staff Colony
STF002,Ramesh Babu,Principal,,50000,2018-01-15,9876500002,ramesh@school.edu,200 Admin Block
STF003,Sunitha Rao,Accountant,,30000,2021-03-01,9876500003,,300 Finance Wing
```

### Import via SQL

```sql
INSERT INTO public.staff
  (staff_id, full_name, role, subject, monthly_salary, joining_date, phone, email, address)
VALUES
  ('STF001','Lakshmi Devi','Teacher','Mathematics',25000,'2020-06-01','9876500001','lakshmi@school.edu','100 Staff Colony'),
  ('STF002','Ramesh Babu','Principal',NULL,50000,'2018-01-15','9876500002','ramesh@school.edu','200 Admin Block');
```

---

## 3. Class-specific Data (Class Sheets Approach)

If you have data organized by class (like separate sheets per class), combine all sheets into a single CSV following the format above. Use the `class` column to distinguish each class.

Example workflow:
1. Export each class sheet to CSV.
2. Concatenate all CSVs (keep only one header row).
3. Import the combined CSV using one of the methods above.

---

## 4. Applying Fee Structures After Import

After importing students, use the **Fee Structures** page in the admin dashboard to:
1. Create fee structures for each class/year.
2. Click the **cascade (↻)** button on a fee structure row to automatically update all active students in that class with the correct `total_fee` and `total_book_fee`.

Or use the Supabase function directly:

```sql
-- Apply tuition fee structure to all active 1st class students in 2024-25
SELECT apply_fee_structure('1st', '2024-25');

-- Apply book fee structure
SELECT apply_book_fee_structure('1st', '2024-25');
```

---

## 5. Security Notes

- **Never commit** your `SUPABASE_SERVICE_ROLE_KEY` or any credentials to the repository.
- Use environment variables or `.env` files (not tracked by git) when running import scripts.
- The service role key bypasses RLS — use it only for trusted admin operations.
- For production imports, prefer the Supabase Dashboard with MFA enabled.
