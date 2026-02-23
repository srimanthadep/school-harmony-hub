import React from 'react';
import { MdEdit, MdDelete, MdPayment, MdHistory, MdPerson, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import Skeleton from '../Skeleton';
import { Student } from '../../types';
import { formatCurrency } from '../../utils/pdfUtils';

interface StudentTableProps {
    students: Student[];
    isLoading: boolean;
    selectedStudents: string[];
    onSelect: (id: string) => void;
    onSelectAll: () => void;
    onEdit: (student: Student) => void;
    onDelete: (student: Student) => void;
    onRecordPayment: (student: Student) => void;
    onViewHistory: (student: Student) => void;
    onViewProfile: (student: Student) => void;
    onWhatsApp: (student: Student) => void;
    sortField: string;
    sortDir: number;
    toggleSort: (field: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
    paid: 'badge-paid',
    partial: 'badge-partial',
    unpaid: 'badge-unpaid',
    na: 'badge-info'
};

export default function StudentTable({
    students,
    isLoading,
    selectedStudents,
    onSelect,
    onSelectAll,
    onEdit,
    onDelete,
    onRecordPayment,
    onViewHistory,
    onViewProfile,
    onWhatsApp,
    sortField,
    sortDir,
    toggleSort
}: StudentTableProps) {
    const SortArrow = ({ field }: { field: string }) => sortField === field ? (sortDir === 1 ? ' ↑' : ' ↓') : ' ⇅';

    if (isLoading) {
        return (
            <div className="table-container">
                <table className="students-table">
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}></th>
                            <th>ID</th><th>Name</th><th>Class</th><th>Roll No</th><th>Parent</th>
                            <th>Tuition Fee</th><th>Status</th><th>Book's Fee</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(10)].map((_, i) => (
                            <tr key={i}>
                                <td><Skeleton width="20px" height="20px" /></td>
                                <td><Skeleton width="60px" /></td>
                                <td><Skeleton width="120px" /></td>
                                <td><Skeleton width="60px" /></td>
                                <td><Skeleton width="40px" /></td>
                                <td><Skeleton width="100px" /></td>
                                <td><Skeleton width="80px" /></td>
                                <td><Skeleton width="60px" borderRadius="12px" /></td>
                                <td><Skeleton width="80px" /></td>
                                <td><Skeleton width="60px" borderRadius="12px" /></td>
                                <td><div style={{ display: 'flex', gap: 4 }}><Skeleton width="24px" height="24px" /><Skeleton width="24px" height="24px" /></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        <div className="table-container">
            <table className="students-table">
                <thead>
                    <tr>
                        <th style={{ width: 40 }}>
                            <div
                                onClick={onSelectAll}
                                style={{ cursor: 'pointer', display: 'flex', color: '#1a237e' }}
                            >
                                {selectedStudents.length === students.length && students.length > 0 ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                            </div>
                        </th>
                        <th onClick={() => toggleSort('studentId')}>ID <SortArrow field="studentId" /></th>
                        <th onClick={() => toggleSort('name')}>Name <SortArrow field="name" /></th>
                        <th onClick={() => toggleSort('class')}>Class <SortArrow field="class" /></th>
                        <th>Roll No</th>
                        <th>Parent</th>
                        <th onClick={() => toggleSort('totalFee')}>Tuition Fee <SortArrow field="totalFee" /></th>
                        <th onClick={() => toggleSort('tuitionStatus')} style={{ cursor: 'pointer', textAlign: 'center' }}>Tuition Status <SortArrow field="tuitionStatus" /></th>
                        <th onClick={() => toggleSort('totalBookFee')}>Book's Fee <SortArrow field="totalBookFee" /></th>
                        <th onClick={() => toggleSort('libraryStatus')} style={{ cursor: 'pointer', textAlign: 'center' }}>Book's Status <SortArrow field="libraryStatus" /></th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s._id}>
                            <td data-label="Select">
                                <div
                                    onClick={() => onSelect(s._id)}
                                    style={{ cursor: 'pointer', display: 'flex', color: '#1a237e' }}
                                >
                                    {selectedStudents.includes(s._id) ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                                </div>
                            </td>
                            <td data-label="ID"><code style={{ fontSize: 11, color: '#1a237e' }}>{s.studentId}</code></td>
                            <td data-label="Name">
                                <div
                                    className="student-name-link"
                                    onClick={() => onViewProfile(s)}
                                    title="View Profile"
                                >
                                    {s.name}
                                </div>
                            </td>
                            <td data-label="Class">
                                <span className="badge badge-admin" style={{ fontSize: 11 }}>{s.class}</span>
                            </td>
                            <td data-label="Roll No">{s.rollNo}</td>
                            <td data-label="Parent">
                                <div style={{ fontSize: 13 }}>{s.parentName}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                    <a href={`tel:${s.parentPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                        Ph. {s.parentPhone}
                                    </a>
                                </div>
                            </td>
                            <td data-label="Tuition Fee" style={{ minWidth: 90 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2, alignItems: 'center' }}>
                                    <span style={{ color: '#6b7280' }}>Tot:</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(s.totalFee)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, alignItems: 'center' }}>
                                    <span style={{ color: '#6b7280' }}>Pend:</span>
                                    <span style={{ fontWeight: 600, fontSize: 13, color: s.pendingAmount > 0 ? '#e53935' : '#43a047' }}>
                                        {formatCurrency(s.pendingAmount)}
                                    </span>
                                </div>
                            </td>
                            <td data-label="Tuition Status" style={{ textAlign: 'center' }}>
                                <span className={`badge ${STATUS_BADGE[s.paymentStatus || 'unpaid']}`}>
                                    {s.paymentStatus}
                                </span>
                            </td>
                            <td data-label="Book's Fee" style={{ minWidth: 90 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2, alignItems: 'center' }}>
                                    <span style={{ color: '#6b7280' }}>Tot:</span>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(s.totalBookFee || 0)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, alignItems: 'center' }}>
                                    <span style={{ color: '#6b7280' }}>Pend:</span>
                                    <span style={{ fontWeight: 600, fontSize: 13, color: (s.pendingBookAmount || 0) > 0 ? '#e53935' : '#43a047' }}>
                                        {formatCurrency(s.pendingBookAmount || 0)}
                                    </span>
                                </div>
                            </td>
                            <td data-label="Book's Status" style={{ textAlign: 'center' }}>
                                <span className={`badge ${STATUS_BADGE[s.bookStatus || 'unpaid']}`}>
                                    {s.bookStatus || 'unpaid'}
                                </span>
                            </td>
                            <td data-label="Actions">
                                <div className="actions-grid">
                                    <button className="btn btn-icon btn-secondary" title="View Profile" onClick={() => onViewProfile(s)} style={{ color: 'var(--primary)' }}>
                                        <MdPerson />
                                    </button>
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
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
