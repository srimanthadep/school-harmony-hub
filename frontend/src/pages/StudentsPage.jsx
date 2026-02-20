import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, generateFeeReceiptPDF, exportStudentsExcel, exportStudentsPDF } from '../utils/pdfUtils';
import {
    MdAdd, MdEdit, MdDelete, MdSearch,
    MdDownload, MdPayment, MdHistory, MdClose, MdPerson,
    MdFileDownload, MdPictureAsPdf, MdTableChart, MdReceiptLong
} from 'react-icons/md';

const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const PAYMENT_MODES = ['cash', 'online', 'cheque', 'dd'];
const ACADEMIC_YEARS = ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27', '2027-28'];

const STATUS_BADGE = {
    paid: 'badge-paid',
    partial: 'badge-partial',
    unpaid: 'badge-unpaid'
};

const emptyStudent = {
    name: '', class: 'Nursery', rollNo: '',
    gender: 'male', parentName: '', parentPhone: '', parentEmail: '',
    dateOfBirth: '', address: '', totalFee: '', academicYear: '2024-25'
};

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState(1);

    // Modals
    const [showForm, setShowForm] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [formData, setFormData] = useState(emptyStudent);
    const [formErrors, setFormErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showPayment, setShowPayment] = useState(null);
    const [showHistory, setShowHistory] = useState(null);

    const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', remarks: '' });
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [historyData, setHistoryData] = useState(null);

    const [settings, setSettings] = useState({});

    // Edit payment (owner only)
    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const isAdmin = user?.role === 'admin';
    const [editPaymentTarget, setEditPaymentTarget] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({});
    const [editPaymentLoading, setEditPaymentLoading] = useState(false);

    // Promote students
    const [showPromote, setShowPromote] = useState(false);
    const [promoteForm, setPromoteForm] = useState({ fromYear: '2024-25', toYear: '2025-26' });
    const [promoteLoading, setPromoteLoading] = useState(false);
    const [promoteResult, setPromoteResult] = useState(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: 10000 };
            if (classFilter) params.class = classFilter;
            if (yearFilter) params.academicYear = yearFilter;
            if (search) params.search = search;
            const res = await API.get('/students', { params });
            setStudents(res.data.students);
        } catch (err) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    }, [classFilter, yearFilter, search]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);
    useEffect(() => {
        API.get('/settings').then(r => setSettings(r.data.settings)).catch(() => { });
    }, []);

    const validateForm = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        if (!formData.rollNo.trim()) errs.rollNo = 'Roll no is required';
        if (!formData.parentName.trim()) errs.parentName = 'Parent name is required';
        if (!formData.parentPhone.trim()) errs.parentPhone = 'Parent phone is required';
        if (!formData.totalFee || formData.totalFee <= 0) errs.totalFee = 'Valid fee required';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setFormLoading(true);
        try {
            if (editStudent) {
                await API.put(`/students/${editStudent._id}`, formData);
                toast.success('Student updated successfully!');
            } else {
                await API.post('/students', formData);
                toast.success('Student added successfully!');
            }
            setShowForm(false);
            setEditStudent(null);
            setFormData(emptyStudent);
            fetchStudents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const openEdit = (student) => {
        setEditStudent(student);
        setFormData({
            name: student.name, class: student.class,
            rollNo: student.rollNo, gender: student.gender || 'male',
            parentName: student.parentName, parentPhone: student.parentPhone,
            parentEmail: student.parentEmail || '', address: student.address || '',
            totalFee: student.totalFee, academicYear: student.academicYear || '2024-25',
            dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : ''
        });
        setShowForm(true);
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/students/${showDeleteConfirm._id}`);
            toast.success('Student deleted');
            setShowDeleteConfirm(null);
            fetchStudents();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const openHistory = async (student) => {
        setShowHistory(student);
        try {
            const res = await API.get(`/students/${student._id}/payments`);
            setHistoryData(res.data);
        } catch { toast.error('Failed to load history'); }
    };

    const openEditPayment = (payment) => {
        setEditPaymentTarget({ studentId: showHistory._id, payment });
        setEditPaymentForm({
            amount: payment.amount,
            paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
            paymentMode: payment.paymentMode || 'cash',
            remarks: payment.remarks || ''
        });
    };

    const handleEditPayment = async (e) => {
        e.preventDefault();
        // Allow 0 — only reject empty string / undefined
        if (editPaymentForm.amount === '' || editPaymentForm.amount === undefined || editPaymentForm.amount === null) {
            toast.error('Please enter an amount (0 is allowed for corrections)');
            return;
        }
        setEditPaymentLoading(true);
        try {
            await API.put(
                `/students/${editPaymentTarget.studentId}/payments/${editPaymentTarget.payment._id}`,
                editPaymentForm
            );
            toast.success('Payment updated successfully!');
            const studentId = editPaymentTarget.studentId;
            setEditPaymentTarget(null);
            const res = await API.get(`/students/${studentId}/payments`);
            setHistoryData(res.data);
            fetchStudents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update payment');
        } finally {
            setEditPaymentLoading(false);
        }
    };

    const handlePromote = async () => {
        setPromoteLoading(true);
        try {
            const res = await API.post('/students/promote', promoteForm);
            setPromoteResult(res.data);
            toast.success(res.data.message);
            fetchStudents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Promotion failed');
        } finally {
            setPromoteLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount || paymentForm.amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        const pending = showPayment.pendingAmount;
        if (Number(paymentForm.amount) > pending) {
            toast.error(`Amount cannot exceed pending: ${formatCurrency(pending)}`);
            return;
        }
        setPaymentLoading(true);
        try {
            const res = await API.post(`/students/${showPayment._id}/payments`, paymentForm);
            toast.success('Payment recorded!');
            setShowPayment(null);
            setPaymentForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', remarks: '' });
            fetchStudents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failed');
        } finally {
            setPaymentLoading(false);
        }
    };

    // Download latest receipt directly from table
    const downloadLatestReceipt = async (student) => {
        try {
            const res = await API.get(`/students/${student._id}/payments`);
            const data = res.data;
            if (!data.payments || data.payments.length === 0) {
                toast.error('No payments found for this student');
                return;
            }
            // Get the most recent payment
            const latest = data.payments[data.payments.length - 1];
            generateFeeReceiptPDF(
                { ...student, totalPaid: data.totalPaid, pendingAmount: data.pendingAmount },
                latest,
                settings
            );
        } catch {
            toast.error('Failed to load receipt');
        }
    };

    const STATUS_ORDER = { unpaid: 0, partial: 1, paid: 2 };
    const sortedStudents = [...students].sort((a, b) => {
        // If class filter is active, primary sort = roll number numerically
        if (classFilter && sortField === 'name') {
            const rA = parseInt(a.rollNo) || 0;
            const rB = parseInt(b.rollNo) || 0;
            return rA - rB;
        }
        if (sortField === 'paymentStatus') {
            const av = STATUS_ORDER[a.paymentStatus] ?? 0;
            const bv = STATUS_ORDER[b.paymentStatus] ?? 0;
            return (av - bv) * sortDir;
        }
        const av = sortField === 'totalFee' ? a.totalFee
            : sortField === 'pendingAmount' ? a.pendingAmount
                : sortField === 'rollNo' ? (parseInt(a.rollNo) || 0)
                    : (a[sortField] || '');
        const bv = sortField === 'totalFee' ? b.totalFee
            : sortField === 'pendingAmount' ? b.pendingAmount
                : sortField === 'rollNo' ? (parseInt(b.rollNo) || 0)
                    : (b[sortField] || '');
        if (typeof av === 'number') return (av - bv) * sortDir;
        return String(av).localeCompare(String(bv)) * sortDir;
    });

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => -d);
        else { setSortField(field); setSortDir(1); }
    };

    const SortArrow = ({ field }) => sortField === field ? (sortDir === 1 ? ' ↑' : ' ↓') : ' ⇅';

    return (
        <div>
            {/* Controls */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="filters-bar">
                        <div className="search-bar" style={{ minWidth: 220 }}>
                            <MdSearch className="search-icon" />
                            <input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-control" style={{ width: 130 }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                            <option value="">All Classes</option>
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="form-control" style={{ width: 130 }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                            <option value="">All Years</option>
                            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>

                    </div>
                    <div className="btn-group">
                        <button className="btn btn-secondary btn-sm" onClick={() => exportStudentsExcel(sortedStudents)}>
                            <MdTableChart /> Excel
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => exportStudentsPDF(sortedStudents, settings)}>
                            <MdPictureAsPdf /> PDF
                        </button>
                        {(isAdmin || isOwner) && (
                            <button className="btn btn-sm"
                                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                                onClick={() => { setPromoteResult(null); setShowPromote(true); }}>
                                🎓 Promote Students
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => { setEditStudent(null); setFormData(emptyStudent); setFormErrors({}); setShowForm(true); }}>
                            <MdAdd /> Add Student
                        </button>
                    </div>
                </div>
                <div style={{ padding: '8px 24px', fontSize: 13, color: '#6b7280' }}>
                    Showing {sortedStudents.length} students
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {loading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : sortedStudents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🧑‍🎓</div>
                        <h3>No students found</h3>
                        <p>Add a new student or adjust your filters</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th onClick={() => toggleSort('studentId')}>ID <SortArrow field="studentId" /></th>
                                    <th onClick={() => toggleSort('name')}>Name <SortArrow field="name" /></th>
                                    <th onClick={() => toggleSort('class')}>Class <SortArrow field="class" /></th>

                                    <th>Roll No</th>
                                    <th>Parent</th>
                                    <th onClick={() => toggleSort('totalFee')}>Total Fee <SortArrow field="totalFee" /></th>
                                    <th onClick={() => toggleSort('pendingAmount')}>Pending <SortArrow field="pendingAmount" /></th>
                                    <th onClick={() => toggleSort('paymentStatus')} style={{ cursor: 'pointer' }}>Status <SortArrow field="paymentStatus" /></th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStudents.map(s => (
                                    <tr key={s._id}>
                                        <td><code style={{ fontSize: 11, color: '#1a237e' }}>{s.studentId}</code></td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.parentPhone}</div>
                                        </td>
                                        <td>{s.class}</td>

                                        <td>{s.rollNo}</td>
                                        <td style={{ fontSize: 13 }}>{s.parentName}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(s.totalFee)}</td>
                                        <td style={{ fontWeight: 600, color: s.pendingAmount > 0 ? '#e53935' : '#43a047' }}>
                                            {formatCurrency(s.pendingAmount)}
                                        </td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[s.paymentStatus] || 'badge-unpaid'}`}>
                                                {s.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            {/* 2x2 action grid - same style as Staff page */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 5,
                                                minWidth: 90
                                            }}>
                                                {/* Row 1: Pay + Receipt */}
                                                <button
                                                    className="btn btn-success btn-sm btn-icon"
                                                    title="Record Payment"
                                                    style={{ opacity: s.pendingAmount > 0 ? 1 : 0.3, cursor: s.pendingAmount > 0 ? 'pointer' : 'default' }}
                                                    onClick={() => s.pendingAmount > 0 && setShowPayment(s)}>
                                                    <MdPayment />
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm btn-icon"
                                                    title="Download Latest Receipt"
                                                    style={{ opacity: s.totalPaid > 0 ? 1 : 0.3, cursor: s.totalPaid > 0 ? 'pointer' : 'default' }}
                                                    onClick={() => s.totalPaid > 0 && downloadLatestReceipt(s)}>
                                                    <MdReceiptLong />
                                                </button>
                                                {/* Row 2: History + Edit */}
                                                <button className="btn btn-secondary btn-sm btn-icon" title="Payment History"
                                                    onClick={() => openHistory(s)}>
                                                    <MdHistory />
                                                </button>
                                                <button className="btn btn-secondary btn-sm btn-icon" title="Edit"
                                                    onClick={() => openEdit(s)}>
                                                    <MdEdit />
                                                </button>
                                                {/* Row 3: Delete (full width) */}
                                                <button className="btn btn-danger btn-sm btn-icon" title="Delete"
                                                    style={{ gridColumn: 'span 2' }}
                                                    onClick={() => setShowDeleteConfirm(s)}>
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Student Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><MdPerson /> {editStudent ? 'Edit Student' : 'Add New Student'}</h3>
                            <button className="btn-close" onClick={() => setShowForm(false)}><MdClose /></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body">
                                <div className="form-section-title">Personal Information</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name <span className="required">*</span></label>
                                        <input className={`form-control ${formErrors.name ? 'error' : ''}`}
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Student full name" />
                                        {formErrors.name && <p className="form-error">{formErrors.name}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select className="form-control" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date of Birth</label>
                                        <input type="date" className="form-control" value={formData.dateOfBirth}
                                            onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <input className="form-control" value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Residential address" />
                                    </div>
                                </div>

                                <div className="form-section-title">Academic Details</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Class <span className="required">*</span></label>
                                        <select className="form-control" value={formData.class}
                                            onChange={e => setFormData({ ...formData, class: e.target.value })}>
                                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Roll Number <span className="required">*</span></label>
                                        <input className={`form-control ${formErrors.rollNo ? 'error' : ''}`}
                                            value={formData.rollNo} onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                                            placeholder="Roll number" />
                                        {formErrors.rollNo && <p className="form-error">{formErrors.rollNo}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Academic Year</label>
                                        <input className="form-control" value={formData.academicYear}
                                            onChange={e => setFormData({ ...formData, academicYear: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-section-title">Parent / Guardian Details</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Parent/Guardian Name <span className="required">*</span></label>
                                        <input className={`form-control ${formErrors.parentName ? 'error' : ''}`}
                                            value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                                            placeholder="Father/Mother/Guardian name" />
                                        {formErrors.parentName && <p className="form-error">{formErrors.parentName}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Parent Phone <span className="required">*</span></label>
                                        <input className={`form-control ${formErrors.parentPhone ? 'error' : ''}`}
                                            value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                                            placeholder="10-digit mobile number" />
                                        {formErrors.parentPhone && <p className="form-error">{formErrors.parentPhone}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Parent Email <small>(Optional)</small></label>
                                        <input type="email" className="form-control" value={formData.parentEmail}
                                            onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                                            placeholder="parent@email.com" />
                                    </div>
                                </div>

                                <div className="form-section-title">Fee Details</div>
                                <div className="form-group">
                                    <label className="form-label">Total Annual Fee <span className="required">*</span></label>
                                    <input type="number" className={`form-control ${formErrors.totalFee ? 'error' : ''}`}
                                        value={formData.totalFee} onChange={e => setFormData({ ...formData, totalFee: e.target.value })}
                                        placeholder="Annual fee amount" min="0" />
                                    {formErrors.totalFee && <p className="form-error">{formErrors.totalFee}</p>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="btn-close" onClick={() => setShowDeleteConfirm(null)}><MdClose /></button>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-dialog">
                                <div className="confirm-icon">🗑️</div>
                                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Delete {showDeleteConfirm.name}?</p>
                                <p style={{ fontSize: 13, color: '#6b7280' }}>
                                    This action cannot be undone. The student record will be deactivated.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete Student</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3><MdPayment /> Record Fee Payment</h3>
                            <button className="btn-close" onClick={() => setShowPayment(null)}><MdClose /></button>
                        </div>
                        <div className="modal-body">
                            <div className="highlight-box" style={{ marginBottom: 16 }}>
                                <strong>{showPayment.name}</strong> - {showPayment.class}
                                <div style={{ marginTop: 8, display: 'flex', gap: 20 }}>
                                    <span style={{ fontSize: 13 }}>Total: <strong>{formatCurrency(showPayment.totalFee)}</strong></span>
                                    <span style={{ fontSize: 13 }}>Paid: <strong style={{ color: '#43a047' }}>{formatCurrency(showPayment.totalPaid)}</strong></span>
                                    <span style={{ fontSize: 13 }}>Pending: <strong style={{ color: '#e53935' }}>{formatCurrency(showPayment.pendingAmount)}</strong></span>
                                </div>
                            </div>
                            <form id="payment-form" onSubmit={handlePayment}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Amount (₹) <span className="required">*</span></label>
                                        <input type="number" className="form-control"
                                            value={paymentForm.amount}
                                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            min={1} step={1} placeholder="Enter amount" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Date</label>
                                        <input type="date" className="form-control"
                                            value={paymentForm.paymentDate}
                                            onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Mode</label>
                                        <select className="form-control" value={paymentForm.paymentMode}
                                            onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}>
                                            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Remarks</label>
                                        <input className="form-control" value={paymentForm.remarks}
                                            onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                            placeholder="Optional note" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPayment(null)}>Cancel</button>
                            <button form="payment-form" type="submit" className="btn btn-success" disabled={paymentLoading}>
                                {paymentLoading ? 'Processing...' : '✓ Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {showHistory && (
                <div className="modal-overlay">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><MdHistory /> Payment History - {showHistory.name}</h3>
                            <button className="btn-close" onClick={() => { setShowHistory(null); setHistoryData(null); }}><MdClose /></button>
                        </div>
                        <div className="modal-body">
                            {historyData ? (
                                <>
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                        <div className="highlight-box" style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Total Fee</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a237e' }}>{formatCurrency(showHistory.totalFee)}</div>
                                        </div>
                                        <div className="highlight-box" style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Total Paid</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#43a047' }}>{formatCurrency(historyData.totalPaid)}</div>
                                        </div>
                                        <div className="highlight-box" style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Pending</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#e53935' }}>{formatCurrency(historyData.pendingAmount)}</div>
                                        </div>
                                    </div>
                                    {historyData.payments.length === 0 ? (
                                        <div className="empty-state" style={{ padding: 30 }}>
                                            <p style={{ color: '#9ca3af' }}>No payments recorded yet</p>
                                        </div>
                                    ) : (
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Receipt No</th>
                                                        <th>Amount</th>
                                                        <th>Date</th>
                                                        <th>Mode</th>
                                                        <th>Remarks</th>
                                                        <th>Download</th>
                                                        {isOwner && <th>Edit</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyData.payments.map((p, i) => (
                                                        <tr key={i}>
                                                            <td><code style={{ fontSize: 12, color: '#1a237e' }}>{p.receiptNo || '-'}</code></td>
                                                            <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(p.amount)}</td>
                                                            <td style={{ fontSize: 13 }}>{formatDate(p.paymentDate)}</td>
                                                            <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{p.paymentMode}</td>
                                                            <td style={{ fontSize: 12, color: '#6b7280' }}>{p.remarks || '-'}</td>
                                                            <td>
                                                                <button className="btn btn-secondary btn-sm" title="Download Receipt"
                                                                    onClick={() => generateFeeReceiptPDF(
                                                                        { ...showHistory, totalPaid: historyData.totalPaid, pendingAmount: historyData.pendingAmount },
                                                                        p, settings
                                                                    )}>
                                                                    <MdDownload />
                                                                </button>
                                                            </td>
                                                            {isOwner && (
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        title="Edit Payment"
                                                                        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                        onClick={() => openEditPayment(p)}
                                                                    >
                                                                        <MdEdit style={{ fontSize: 14 }} /> Edit
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="loading-spinner"><div className="spinner" /></div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setShowHistory(null); setHistoryData(null); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Payment Modal - OWNER ONLY */}
            {isOwner && editPaymentTarget && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditPaymentTarget(null)}>
                    <div className="modal" style={{ maxWidth: 500 }}>
                        <div className="modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: '12px 12px 0 0' }}>
                            <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                👑 Edit Fee Payment
                            </h3>
                            <button className="btn-close" style={{ color: '#fff' }} onClick={() => setEditPaymentTarget(null)}><MdClose /></button>
                        </div>
                        <div className="modal-body">
                            <div className="highlight-box" style={{ marginBottom: 16, background: '#f5f3ff', border: '1px solid #c4b5fd' }}>
                                <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>⚠️ Owner-only action</div>
                                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                                    Editing receipt <strong>{editPaymentTarget.payment.receiptNo}</strong> for <strong>{showHistory?.name}</strong>
                                </div>
                            </div>
                            <form id="edit-payment-form" onSubmit={handleEditPayment}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Amount (₹) <span className="required">*</span></label>
                                        <input type="number" className="form-control"
                                            value={editPaymentForm.amount}
                                            onChange={e => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                                            min={0} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Date</label>
                                        <input type="date" className="form-control"
                                            value={editPaymentForm.paymentDate}
                                            onChange={e => setEditPaymentForm({ ...editPaymentForm, paymentDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Mode</label>
                                        <select className="form-control"
                                            value={editPaymentForm.paymentMode}
                                            onChange={e => setEditPaymentForm({ ...editPaymentForm, paymentMode: e.target.value })}>
                                            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Remarks</label>
                                        <input className="form-control"
                                            value={editPaymentForm.remarks}
                                            onChange={e => setEditPaymentForm({ ...editPaymentForm, remarks: e.target.value })}
                                            placeholder="Optional note" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setEditPaymentTarget(null)}>Cancel</button>
                            <button form="edit-payment-form" type="submit"
                                className="btn"
                                disabled={editPaymentLoading}
                                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>
                                {editPaymentLoading ? 'Saving...' : '✓ Update Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Promote Students Modal */}
            {showPromote && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !promoteLoading && setShowPromote(false)}>
                    <div className="modal" style={{ maxWidth: 500 }}>
                        <div className="modal-header" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '12px 12px 0 0' }}>
                            <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>🎓 Promote Students</h3>
                            <button className="btn-close" style={{ color: '#fff' }} onClick={() => setShowPromote(false)} disabled={promoteLoading}><MdClose /></button>
                        </div>
                        <div className="modal-body">
                            {promoteResult ? (
                                <div>
                                    <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #86efac', marginBottom: 16, textAlign: 'center' }}>
                                        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                                        <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d' }}>Promotion Complete!</div>
                                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>{promoteResult.message}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                        <div style={{ textAlign: 'center', padding: 12, background: '#eff6ff', borderRadius: 8 }}>
                                            <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{promoteResult.promoted}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Promoted</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: 12, background: '#fef3c7', borderRadius: 8 }}>
                                            <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{promoteResult.graduated}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Graduated (10th)</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                                            <div style={{ fontSize: 24, fontWeight: 800, color: '#6b7280' }}>{promoteResult.skipped}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Skipped</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, marginBottom: 20 }}>
                                        <div style={{ fontWeight: 700, color: '#c2410c', fontSize: 14, marginBottom: 6 }}>⚠️ Important — Read before proceeding</div>
                                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
                                            <li>All active students from <strong>{promoteForm.fromYear}</strong> will be moved to <strong>{promoteForm.toYear}</strong></li>
                                            <li>Each student is promoted to the <strong>next class</strong> (Nursery→LKG, 1st→2nd, etc.)</li>
                                            <li>Fee payment history is <strong>cleared</strong> — fresh start for the new year</li>
                                            <li>Fees are updated from the new year's fee structure (if set)</li>
                                            <li>10th class students are <strong>graduated</strong> (marked inactive)</li>
                                            <li style={{ color: '#dc2626', fontWeight: 600 }}>This action cannot be undone!</li>
                                        </ul>
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">From Academic Year (current)</label>
                                            <select className="form-control" value={promoteForm.fromYear}
                                                onChange={e => setPromoteForm({ ...promoteForm, fromYear: e.target.value })}>
                                                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">To Academic Year (new)</label>
                                            <select className="form-control" value={promoteForm.toYear}
                                                onChange={e => setPromoteForm({ ...promoteForm, toYear: e.target.value })}>
                                                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPromote(false)} disabled={promoteLoading}>
                                {promoteResult ? 'Close' : 'Cancel'}
                            </button>
                            {!promoteResult && (
                                <button className="btn" disabled={promoteLoading || promoteForm.fromYear === promoteForm.toYear}
                                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff' }}
                                    onClick={handlePromote}>
                                    {promoteLoading ? '⏳ Processing...' : '🎓 Confirm & Promote'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
