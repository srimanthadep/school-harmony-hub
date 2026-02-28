const { z } = require('zod');

// Fix #22: Added Zod validation for staff creation, mirroring the student validation pattern
const staffSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['teacher', 'principal', 'vice_principal', 'admin_staff', 'librarian', 'peon', 'guard', 'accountant', 'other'], {
        errorMap: () => ({ message: 'Invalid staff role' })
    }),
    phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    monthlySalary: z.coerce.number().min(0, 'Monthly salary must be a positive number'),
    joiningDate: z.string().min(1, 'Joining date is required').or(z.date()),
    subject: z.string().optional(),
    department: z.string().optional(),
    qualification: z.string().optional(),
    experience: z.coerce.number().min(0).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.string().optional(),
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
    ifscCode: z.string().optional(),
    academicYear: z.string().optional(),
    photo: z.string().optional()
});

module.exports = { staffSchema };
