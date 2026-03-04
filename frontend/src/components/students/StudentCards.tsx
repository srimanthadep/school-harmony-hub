import React from 'react';
import { MdEdit, MdDelete, MdPayment, MdHistory, MdPeople } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import Skeleton from '../Skeleton';
import { Student } from '../../types';
import { formatCurrency } from '../../utils/pdfUtils';

interface StudentCardsProps {
    students: Student[];
    isLoading: boolean;
    onEdit: (student: Student) => void;
    onDelete: (student: Student) => void;
    onRecordPayment: (student: Student) => void;
    onViewHistory: (student: Student) => void;
    onViewProfile: (student: Student) => void;
    onWhatsApp: (student: Student) => void;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STATUS_BADGE_CLASS: Record<string, string> = {
    paid: 'badge-paid',
    partial: 'badge-partial',
    unpaid: 'badge-unpaid',
    na: 'badge-info'
};

const STATUS_LABEL: Record<string, string> = {
    paid: 'PAID',
    partial: 'PARTIAL',
    unpaid: 'UNPAID',
    na: 'N/A'
};

export default function StudentCards({
    students,
    isLoading,
    onEdit,
    onDelete,
    onRecordPayment,
    onViewHistory,
    onViewProfile,
    onWhatsApp,
}: StudentCardsProps) {
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

    if (students.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🧑‍🎓</div>
                <h3>No students found</h3>
                <p>Add a new student or adjust your filters</p>
            </div>
        );
    }

    return (
        <div className="student-cards-grid">
            {students.map(s => {
                const status = s.tuitionStatus || 'unpaid';
                const initials = getInitials(s.name);
                return (
                    <div key={s._id} className="student-card">
                        <div className="student-card-top">
                            <button
                                className="student-avatar"
                                onClick={() => onViewProfile(s)}
                                title="View Profile"
                                aria-label={`View profile of ${s.name}`}
                            >
                                <span>{initials}</span>
                            </button>
                            <div className="student-card-info">
                                <div className="student-card-header-row">
                                    <div className="student-card-name-block">
                                        <h3
                                            className="student-card-name"
                                            onClick={() => onViewProfile(s)}
                                            title="View Profile"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onViewProfile(s)}
                                        >
                                            {s.name}
                                        </h3>
                                        <p className="student-card-meta">ID: {s.studentId} • Roll: {s.rollNo}</p>
                                    </div>
                                    <span className={`badge ${STATUS_BADGE_CLASS[status] || 'badge-unpaid'}`}>
                                        {STATUS_LABEL[status] || status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="student-card-class">{s.class}</p>
                            </div>
                        </div>
                        <div className="student-card-bottom">
                            <div className="student-card-parent-row">
                                <div className="student-card-parent">
                                    <MdPeople size={16} />
                                    <span>
                                        {s.parentName}
                                        {s.parentPhone ? (
                                            <> (<a href={`tel:${s.parentPhone}`} style={{ color: 'inherit' }}>{s.parentPhone}</a>)</>
                                        ) : ''}
                                    </span>
                                </div>
                                <button className="student-card-profile-btn" onClick={() => onViewProfile(s)}>
                                    Profile
                                </button>
                            </div>
                            <div className="student-card-fee-row">
                                <div className="student-card-fee-item">
                                    <p className="fee-label">Total</p>
                                    <p className="fee-value fee-neutral">{formatCurrency(s.totalFee)}</p>
                                </div>
                                <div className="student-card-fee-item">
                                    <p className="fee-label">Paid</p>
                                    <p className={`fee-value ${s.totalPaid > 0 ? 'fee-paid' : 'fee-neutral'}`}>
                                        {formatCurrency(s.totalPaid)}
                                    </p>
                                </div>
                                <div className="student-card-fee-item">
                                    <p className="fee-label">Pending</p>
                                    <p className={`fee-value ${s.pendingAmount > 0 ? 'fee-pending' : 'fee-neutral'}`}>
                                        {formatCurrency(s.pendingAmount)}
                                    </p>
                                </div>
                            </div>
                            <div className="student-card-actions">
                                <button className="btn btn-icon btn-secondary" title="Record Payment" onClick={() => onRecordPayment(s)} style={{ color: '#10b981' }}>
                                    <MdPayment />
                                </button>
                                <button className="btn btn-icon btn-secondary" title="Payment History" onClick={() => onViewHistory(s)} style={{ color: '#f59e0b' }}>
                                    <MdHistory />
                                </button>
                                <button className="btn btn-icon btn-secondary" title="WhatsApp Reminder" onClick={() => onWhatsApp(s)} style={{ color: '#25D366' }}>
                                    <FaWhatsapp />
                                </button>
                                <button className="btn btn-icon btn-secondary" title="Edit Student" onClick={() => onEdit(s)} style={{ color: '#3b82f6' }}>
                                    <MdEdit />
                                </button>
                                <button className="btn btn-icon btn-secondary" title="Delete Student" onClick={() => onDelete(s)} style={{ color: '#ef4444' }}>
                                    <MdDelete />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}