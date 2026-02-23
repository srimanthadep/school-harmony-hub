// ===== Core Entity Types =====

export interface Student {
    _id: string;
    studentId: string;
    name: string;
    class: string;
    rollNo: string;
    gender: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    dateOfBirth?: string;
    address?: string;
    totalFee: number;
    totalBookFee?: number;
    totalPaid: number;
    totalBookPaid?: number;
    pendingAmount: number;
    pendingBookAmount?: number;
    academicYear: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    feePayments?: Payment[];
    [key: string]: any;
}

export interface Payment {
    _id: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    feeType: 'tuition' | 'book';
    remarks?: string;
    receiptNo?: string;
    createdAt?: string;
}

export interface Staff {
    _id: string;
    staffId: string;
    name: string;
    phone: string;
    role: string;
    subject?: string;
    department?: string;
    qualification?: string;
    experience?: string;
    gender: string;
    address?: string;
    monthlySalary: number;
    totalSalaryPaid: number;
    joiningDate: string;
    bankAccount?: string;
    bankName?: string;
    ifscCode?: string;
    academicYear: string;
    isActive: boolean;
    salaryPayments?: SalaryPayment[];
    leaves?: Leave[];
    [key: string]: any;
}

export interface SalaryPayment {
    _id: string;
    month: string;
    amount: number;
    baseAmount?: number;
    cuttings?: number;
    paymentDate: string;
    paymentMode: string;
    remarks?: string;
    slipNo?: string;
}

export interface Leave {
    _id: string;
    date: string;
    reason?: string;
    status: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'staff' | 'student';
    isActive: boolean;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    isAdmin: boolean;
    isOwner: boolean;
    isStaff: boolean;
    isStudent: boolean;
}

export interface Notification {
    id: string;
    type: 'payment' | 'salary' | 'promotion' | 'info' | 'warning' | 'delete';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    icon?: string;
}

export interface Settings {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    principalName?: string;
    receiptPrefix?: string;
    salarySlipPrefix?: string;
    academicYear?: string;
    currency?: string;
    [key: string]: any;
}

export interface FeeStructure {
    _id?: string;
    class: string;
    academicYear: string;
    tuitionFee: number;
    admissionFee: number;
    examFee: number;
    libraryFee: number;
    sportsFee: number;
    transportFee: number;
    miscFee: number;
    totalFee: number;
}

export interface BookFeeStructure {
    _id?: string;
    class: string;
    academicYear: string;
    readingBookFee: number;
    textBooksFee: number;
    practiceWorkBookFee: number;
    funWithDotBookFee: number;
    dairyFee: number;
    idCardFee: number;
    coversFee: number;
    noteBooksFee: number;
    miscFee: number;
    totalFee: number;
}

// ===== API Response Types =====

export interface StudentListResponse {
    students: Student[];
    page: number;
    pages: number;
    total: number;
}

export interface StaffListResponse {
    staff: Staff[];
    page: number;
    pages: number;
    total: number;
}

export interface PaymentHistoryResponse {
    payments: Payment[];
    totalPaid: number;
    pendingAmount: number;
    totalFee: number;
    totalBookFee?: number;
    totalBookPaid?: number;
    pendingBookAmount?: number;
}

export interface SalaryHistoryResponse {
    salaryPayments: SalaryPayment[];
    monthlySalary: number;
    totalSalaryPaid: number;
}

