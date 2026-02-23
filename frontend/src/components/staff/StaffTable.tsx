import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPayment, MdReceiptLong, MdHistory, MdDateRange, MdEdit, MdDelete } from 'react-icons/md';
import { formatCurrency, formatDate } from '../../utils/pdfUtils';
import { Staff } from '../../types';
import Skeleton from '../Skeleton';

interface StaffTableProps {
    staff: Staff[];
    isLoading: boolean;
    onEdit: (s: Staff) => void;
    onDelete: (s: Staff) => void;
    onPaySalary: (s: Staff) => void;
    downloadLatestPayslip: (s: Staff) => void;
    onViewHistory: (s: Staff) => void;
    onViewLeaves: (s: Staff) => void;
    sortField: string;
    sortDir: number;
    toggleSort: (field: string) => void;
    getStatus: (s: Staff) => string;
    roleDisplay: (r: string) => string;
}

export default function StaffTable({
    staff,
    isLoading,
    onEdit,
    onDelete,
    onPaySalary,
    downloadLatestPayslip,
    onViewHistory,
    onViewLeaves,
    sortField,
    sortDir,
    toggleSort,
    getStatus,
    roleDisplay
}: StaffTableProps) {
    const SortArrow = ({ field }: { field: string }) => sortField === field ? (sortDir === 1 ? ' ↑' : ' ↓') : ' ⇅';

    if (isLoading) {
        return (
            <div className="table-container">
                <table className="students-table staff-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Name</th><th>Role</th><th>Salary</th><th>Paid</th><th>Session</th><th>Joined</th><th>Leaves</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5].map(i => (
                            <tr key={i}>
                                {Array(10).fill(0).map((_, j) => (
                                    <td key={j}><Skeleton width={j === 1 ? 120 : 60} height={20} /></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (staff.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">👨‍🏫</div>
                <h3>No staff found</h3>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="students-table staff-table">
                <thead>
                    <tr>
                        <th onClick={() => toggleSort('staffId')}>ID <SortArrow field="staffId" /></th>
                        <th onClick={() => toggleSort('name')}>Name <SortArrow field="name" /></th>
                        <th onClick={() => toggleSort('role')}>Role <SortArrow field="role" /></th>
                        <th onClick={() => toggleSort('monthlySalary')}>Monthly Salary <SortArrow field="monthlySalary" /></th>
                        <th onClick={() => toggleSort('totalSalaryPaid')}>Total Paid <SortArrow field="totalSalaryPaid" /></th>
                        <th onClick={() => toggleSort('academicYear')}>Session <SortArrow field="academicYear" /></th>
                        <th onClick={() => toggleSort('joiningDate')}>Joining Date <SortArrow field="joiningDate" /></th>
                        <th onClick={() => toggleSort('leaves')}>Leaves <SortArrow field="leaves" /></th>
                        <th onClick={() => toggleSort('status')}>Status <SortArrow field="status" /></th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence mode='popLayout'>
                        {staff.map((s, idx) => (
                            <motion.tr
                                key={s._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="hover-lift"
                            >
                                <td data-label="ID"><code style={{ fontSize: 11, color: '#1a237e', fontWeight: 700 }}>{s.staffId}</code></td>
                                <td data-label="Name">
                                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.name}</div>
                                    {s.subject && <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.subject}</div>}
                                </td>
                                <td data-label="Role">
                                    <span className="badge badge-admin glass" style={{ textTransform: 'capitalize' }}>
                                        {roleDisplay(s.role)}
                                    </span>
                                </td>
                                <td data-label="Salary" style={{ fontWeight: 700 }}>{formatCurrency(s.monthlySalary)}</td>
                                <td data-label="Paid" style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(s.totalSalaryPaid)}</td>
                                <td data-label="Session">
                                    <span className="badge glass" style={{ background: '#f1f5f9', color: '#1e293b' }}>
                                        {s.academicYear || '-'}
                                    </span>
                                </td>
                                <td data-label="Joined" style={{ fontSize: 12, color: '#64748b' }}>{formatDate(s.joiningDate)}</td>
                                <td data-label="Leaves">
                                    <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>
                                        {s.leaves?.length || 0}
                                    </span>
                                </td>
                                <td data-label="Status">
                                    <span className={`badge ${getStatus(s) === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                                        {getStatus(s) === 'paid' ? 'Paid' : 'Due'}
                                    </span>
                                </td>
                                <td data-label="Actions">
                                    <div className="actions-grid">
                                        <button className="btn btn-success btn-sm btn-icon hover-lift" title="Pay Salary"
                                            onClick={() => onPaySalary(s)}>
                                            <MdPayment />
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm btn-icon hover-lift"
                                            title="Download Latest Payslip"
                                            style={{ opacity: s.totalSalaryPaid > 0 ? 1 : 0.3, cursor: s.totalSalaryPaid > 0 ? 'pointer' : 'default' }}
                                            onClick={() => s.totalSalaryPaid > 0 && downloadLatestPayslip(s)}>
                                            <MdReceiptLong />
                                        </button>
                                        <button className="btn btn-secondary btn-sm btn-icon hover-lift" title="Salary History"
                                            onClick={() => onViewHistory(s)}>
                                            <MdHistory />
                                        </button>
                                        <button className="btn btn-secondary btn-sm btn-icon hover-lift" title="Leaves"
                                            onClick={() => onViewLeaves(s)}>
                                            <MdDateRange />
                                        </button>
                                        <button className="btn btn-secondary btn-sm btn-icon hover-lift" title="Edit" onClick={() => onEdit(s)}>
                                            <MdEdit />
                                        </button>
                                        <button className="btn btn-danger btn-sm btn-icon hover-lift" title="Delete"
                                            onClick={() => onDelete(s)}>
                                            <MdDelete />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
}
