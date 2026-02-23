const { z } = require('zod');

const studentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    class: z.enum(['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']),
    rollNo: z.string().min(1, "Roll number is required"),
    gender: z.enum(['male', 'female', 'other']).default('male'),
    parentName: z.string().min(2, "Parent name is required"),
    parentPhone: z.string().regex(/^[0-9]{10}$/, "Invalid phone number"),
    parentEmail: z.string().email().optional().or(z.literal('')),
    totalFee: z.number().min(0),
    totalBookFee: z.number().min(0).optional().default(0),
    academicYear: z.string().optional()
});

module.exports = { studentSchema };
