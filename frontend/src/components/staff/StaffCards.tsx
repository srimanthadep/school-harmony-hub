import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPayment, MdReceiptLong, MdHistory, MdDateRange, MdEdit, MdDelete } from 'react-icons/md';
import { formatCurrency, formatDate } from '../../utils/pdfUtils';
import { Staff } from '../../types';
import Skeleton from '../Skeleton';

interface StaffCardsProps {
    staff: Staff[];
    isLoading: boolean;
    onEdit: (s: Staff) => void;
    onDelete: (s: Staff) => void;
    onPaySalary: (s: Staff) => void;
    downloadLatestPayslip: (s: Staff) => void;
    onViewHistory: (s: Staff) => void;
    onViewLeaves: (s: Staff) => void;
    getStatus: (s: Staff) => string;
    roleDisplay: (r: string) => string;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StaffCards({
    staff,
    isLoading,
    onEdit,
    onDelete,
    onPaySalary,
    downloadLatestPayslip,
    onViewHistory,
    onViewLeaves,
    getStatus,
    roleDisplay,
}: StaffCardsProps) {
    if (isLoading) {
        return (
            <div className="student-cards-grid">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="student-card">
                        <div className="student-card-top">
                            <Skeleton width="56px" height="56px" borderRadius="50%" />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <Skeleton width="140px" height="16px" />
                                <Skeleton width="100px" height="12px" />
                            </div>
                        </div>
                        <div className="student-card-bottom">
                            <Skeleton width="100%" height="12px" style={{ marginBottom: 8 }} />
                            <Skeleton width="100%" height="40px" borderRadius="8px" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (staff.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">👨‍🏫</div>
                <h3>No staff found</h3>
                <p>Add a new staff member or adjust your filters</p>
            </div>
        );
    }

    return (
        <div className="student-cards-grid">
            <AnimatePresence mode="popLayout">
                {staff.map((s, idx) => {
                    const status = getStatus(s);
                    const initials = getInitials(s.name);
                    return (
                        <motion.div
                            key={s._id}
                            className="student-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <div className="student-card-top">
                                <div className="student-avatar" style={{ cursor: 'default' }}>
                                    <span>{initials}</span>
                                </div>
                                <div className="student-card-info">
                                    <div className="student-card-header-row">
                                        <div className="student-card-name-block">
                                            <h3 className="student-card-name" style={{ cursor: 'default' }}>{s.name}</h3>
                                            <p className="student-card-meta">ID: {s.staffId} · Joined: {formatDate(s.joiningDate)}</p>
                                        </div>
                                        <span className={`badge ${status === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                                            {status === 'paid' ? 'PAID' : 'DUE'}
                                        </span>
                                    </div>
                                    <p className="student-card-class">
                                        <span className="badge badge-admin glass" style={{ textTransform: 'capitalize', fontSize: 11 }}>
                                            {roleDisplay(s.role)}
                                        </span>
                                        {s.subject && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-secondary)' }}>{s.subject}</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="student-card-bottom">
                                <div className="student-card-fee-row">
                                    <div className="student-card-fee-item">
                                        <p className="fee-label">Monthly</p>
                                        <p className="fee-value fee-neutral">{formatCurrency(s.monthlySalary)}</p>
                                    </div>
                                    <div className="student-card-fee-item">
                                        <p className="fee-label">Total Paid</p>
                                        <p className={`fee-value ${s.totalSalaryPaid > 0 ? 'fee-paid' : 'fee-neutral'}`}>
                                            {formatCurrency(s.totalSalaryPaid)}
                                        </p>
                                    </div>
                                    <div className="student-card-fee-item">
                                        <p className="fee-label">Leaves</p>
                                        <p className="fee-value" style={{ color: 'var(--warning)' }}>
                                            {s.leaves?.length || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="student-card-actions">
                                    <button className="btn btn-icon btn-secondary" title="Pay Salary" onClick={() => onPaySalary(s)} style={{ color: '#10b981' }}>
                                        <MdPayment />
                                    </button>
                                    <button
                                        className="btn btn-icon btn-secondary"
                                        title="Download Latest Payslip"
                                        style={{ color: '#3b82f6', opacity: s.totalSalaryPaid > 0 ? 1 : 0.35, cursor: s.totalSalaryPaid > 0 ? 'pointer' : 'default' }}
                                        onClick={() => s.totalSalaryPaid > 0 && downloadLatestPayslip(s)}
                                    >
                                        <MdReceiptLong />
                                    </button>
                                    <button className="btn btn-icon btn-secondary" title="Salary History" onClick={() => onViewHistory(s)} style={{ color: '#f59e0b' }}>
                                        <MdHistory />
                                    </button>
                                    <button className="btn btn-icon btn-secondary" title="Leaves" onClick={() => onViewLeaves(s)} style={{ color: '#8b5cf6' }}>
                                        <MdDateRange />
                                    </button>
                                    <button className="btn btn-icon btn-secondary" title="Edit" onClick={() => onEdit(s)} style={{ color: '#3b82f6' }}>
                                        <MdEdit />
                                    </button>
                                    <button className="btn btn-icon btn-secondary" title="Delete" onClick={() => onDelete(s)} style={{ color: '#ef4444' }}>
                                        <MdDelete />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}