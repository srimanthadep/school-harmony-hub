import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, generateFeeReceiptPDF, exportStudentsExcel, exportStudentsPDF } from '../utils/pdfUtils';
import {
    MdAdd, MdEdit, MdDelete, MdSearch,
    MdDownload, MdPayment, MdHistory, MdClose, MdPerson,
    MdFileDownload, MdPictureAsPdf, MdTableChart, MdReceiptLong,
    MdCheckBox, MdCheckBoxOutlineBlank
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';

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
    dateOfBirth: '', address: '', totalFee: '', totalBookFee: '', academicYear: '2025-26'
};

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Fetch students data with TanStack Query
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['students', page, classFilter, yearFilter],
        queryFn: async () => {
            const params = { page, limit: 50 };
            if (classFilter) params.class = classFilter;
            if (yearFilter) params.academicYear = yearFilter;
            const res = await API.get('/students', { params });
            return res.data;
        },
        keepPreviousData: true
    });

    const students = data?.students || [];
    const totalPages = data?.pages || 1;
    const totalStudents = data?.total || 0;

    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const isAdmin = user?.role === 'admin';

    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState(1);

    const getTuitionStatus = (s) => {
        if (!s.totalFee) return 'na';
        const paid = s.totalPaid || 0;
        if (paid >= s.totalFee) return 'paid';
        if (paid > 0) return 'partial';
        return 'unpaid';
    };

    const getLibraryStatus = (s) => {
        const total = s.totalBookFee || 0;
        const paid = s.totalBookPaid || 0;
        if (!total) return 'na';
        if (paid >= total) return 'paid';
        if (paid > 0) return 'partial';
        return 'unpaid';
    };

    const STATUS_ORDER = { unpaid: 0, partial: 1, paid: 2, na: 3 };

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            if (classFilter && sortField === 'name') {
                const rA = parseInt(a.rollNo) || 0;
                const rB = parseInt(b.rollNo) || 0;
                return rA - rB;
            }
            if (sortField === 'tuitionStatus') {
                const av = STATUS_ORDER[getTuitionStatus(a)] ?? 0;
                const bv = STATUS_ORDER[getTuitionStatus(b)] ?? 0;
                return (av - bv) * sortDir;
            }
            if (sortField === 'libraryStatus') {
                const av = STATUS_ORDER[getLibraryStatus(a)] ?? 0;
                const bv = STATUS_ORDER[getLibraryStatus(b)] ?? 0;
                return (av - bv) * sortDir;
            }
            const av = sortField === 'totalFee' ? a.totalFee
                : sortField === 'pendingAmount' ? a.pendingAmount
                    : sortField === 'totalBookFee' ? (a.totalBookFee || 0)
                        : sortField === 'pendingBookAmount' ? (a.pendingBookAmount || 0)
                            : sortField === 'rollNo' ? (parseInt(a.rollNo) || 0)
                                : (a[sortField] || '');
            const bv = sortField === 'totalFee' ? b.totalFee
                : sortField === 'pendingAmount' ? b.pendingAmount
                    : sortField === 'totalBookFee' ? (b.totalBookFee || 0)
                        : sortField === 'pendingBookAmount' ? (b.pendingBookAmount || 0)
                            : sortField === 'rollNo' ? (parseInt(b.rollNo) || 0)
                                : (b[sortField] || '');
            if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
            return String(av).localeCompare(String(bv)) * sortDir;
        });
    }, [students, sortField, sortDir, classFilter]);

    // Fuzzy search logic locally on the current page for instant results
    const fuse = useMemo(() => new Fuse(sortedStudents, {
        keys: ['name', 'studentId', 'parentPhone', 'parentName'],
        threshold: 0.3
    }), [sortedStudents]);

    const filteredStudents = useMemo(() => {
        if (!search) return sortedStudents;
        return fuse.search(search).map(r => r.item);
    }, [search, sortedStudents, fuse]);

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [formData, setFormData] = useState({
        name: '', class: 'Nursery', rollNo: '',
        gender: 'male', parentName: '', parentPhone: '', parentEmail: '',
        dateOfBirth: '', address: '', totalFee: '', totalBookFee: '', academicYear: '2025-26'
    });
    const [formErrors, setFormErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showPayment, setShowPayment] = useState(null);
    const [showHistory, setShowHistory] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', feeType: 'tuition', remarks: '' });
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        API.get('/settings').then(r => setSettings(r.data.settings)).catch(() => { });
    }, []);

    const validateForm = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        if (!formData.rollNo.trim()) errs.rollNo = 'Roll no is required';
        if (!formData.parentName.trim()) errs.parentName = 'Parent name is required';
        if (!formData.parentPhone.trim()) errs.parentPhone = 'Parent phone is required';
        if (formData.totalFee === '' || formData.totalFee < 0) errs.totalFee = 'Valid fee required';
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
                toast.success('Student updated!');
            } else {
                await API.post('/students', formData);
                toast.success('Student added!');
            }
            setShowForm(false);
            setEditStudent(null);
            setFormData(emptyStudent);
            queryClient.invalidateQueries(['students']);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/students/${showDeleteConfirm._id}`);
            toast.success('Student deleted');
            setShowDeleteConfirm(null);
            queryClient.invalidateQueries(['students']);
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const fetchStudents = () => queryClient.invalidateQueries(['students']);

    const [editPaymentTarget, setEditPaymentTarget] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({});
    const [editPaymentLoading, setEditPaymentLoading] = useState(false);
    const [showDeletePaymentConfirm, setShowDeletePaymentConfirm] = useState(null);
    const [showPromote, setShowPromote] = useState(false);
    const [promoteForm, setPromoteForm] = useState({ fromYear: '2025-26', toYear: '2026-27' });
    const [promoteLoading, setPromoteLoading] = useState(false);
    const [promoteResult, setPromoteResult] = useState(null);

    const openEdit = (student) => {
        setEditStudent(student);
        setFormData({
            name: student.name, class: student.class,
            rollNo: student.rollNo, gender: student.gender || 'male',
            parentName: student.parentName, parentPhone: student.parentPhone,
            parentEmail: student.parentEmail || '', address: student.address || '',
            totalFee: student.totalFee, totalBookFee: student.totalBookFee || '',
            academicYear: student.academicYear || '2025-26',
            dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : ''
        });
        setShowForm(true);
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
        if (editPaymentForm.amount === '' || editPaymentForm.amount === undefined) {
            toast.error('Valid amount required');
            return;
        }
        setEditPaymentLoading(true);
        try {
            await API.put(`/students/${editPaymentTarget.studentId}/payments/${editPaymentTarget.payment._id}`, editPaymentForm);
            toast.success('Payment updated!');
            setEditPaymentTarget(null);
            const res = await API.get(`/students/${showHistory._id}/payments`);
            setHistoryData(res.data);
            fetchStudents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setEditPaymentLoading(false);
        }
    };

    const handleDeletePayment = (paymentId) => {
        setShowDeletePaymentConfirm(paymentId);
    };

    const confirmDeletePayment = async () => {
        if (!showDeletePaymentConfirm) return;
        try {
            await API.delete(`/students/${showHistory._id}/payments/${showDeletePaymentConfirm}`);
            toast.success('Payment deleted successfully');
            // Refresh history
            const res = await API.get(`/students/${showHistory._id}/payments`);
            setHistoryData(res.data);
            fetchStudents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete payment');
        } finally {
            setShowDeletePaymentConfirm(null);
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
        if (paymentForm.amount === '' || paymentForm.amount < 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        const isTuition = paymentForm.feeType === 'tuition';
        const pending = isTuition ? showPayment.pendingAmount : (showPayment.pendingBookAmount || 0);
        if (Number(paymentForm.amount) > pending) {
            toast.error(`Amount cannot exceed pending ${isTuition ? 'tuition' : 'book\'s'} fee: ${formatCurrency(pending)}`);
            return;
        }
        setPaymentLoading(true);
        try {
            const res = await API.post(`/students/${showPayment._id}/payments`, paymentForm);
            toast.success('Payment recorded!');
            setShowPayment(null);
            setPaymentForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'cash', feeType: 'tuition', remarks: '' });
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

    const handleWhatsApp = (s) => {
        if (!s.parentPhone || s.parentPhone.trim() === '') {
            toast.error('No phone number found for this parent');
            return;
        }
        const cleanPhone = s.parentPhone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const msg = `Dear ${s.parentName},\nThis is a polite reminder from Oxford School that ${s.name}'s pending school fee is ₹${s.pendingAmount}. Please arrange the payment at your earliest convenience.\nThank you!`;
        window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

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
                        {selectedStudents.length > 0 && (
                            <button className="btn btn-success" onClick={() => toast.promise(Promise.resolve(), { loading: 'Processing bulk reminders...', success: 'Bulk reminders sent to WhatsApp!', error: 'Failed' })}>
                                <FaWhatsapp /> Send {selectedStudents.length} Reminders
                            </button>
                        )}
                        <button className="btn btn-secondary btn-sm btn-half" onClick={() => exportStudentsExcel(filteredStudents)}>
                            <MdTableChart /> Excel
                        </button>
                        <button className="btn btn-secondary btn-sm btn-half" onClick={() => exportStudentsPDF(sortedStudents, settings)}>
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
                    Showing <strong>{(page - 1) * 50 + 1} - {(page - 1) * 50 + students.length}</strong> of <strong>{totalStudents}</strong> students
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {isLoading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : filteredStudents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🧑‍🎓</div>
                        <h3>No students found</h3>
                        <p>Add a new student or adjust your filters</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <div
                                            onClick={() => {
                                                if (selectedStudents.length === filteredStudents.length) setSelectedStudents([]);
                                                else setSelectedStudents(filteredStudents.map(s => s._id));
                                            }}
                                            style={{ cursor: 'pointer', display: 'flex', color: '#1a237e' }}
                                        >
                                            {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
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
                                {filteredStudents.map(s => (
                                    <tr key={s._id}>
                                        <td>
                                            <div
                                                onClick={() => {
                                                    if (selectedStudents.includes(s._id)) setSelectedStudents(selectedStudents.filter(id => id !== s._id));
                                                    else setSelectedStudents([...selectedStudents, s._id]);
                                                }}
                                                style={{ cursor: 'pointer', display: 'flex', color: '#1a237e' }}
                                            >
                                                {selectedStudents.includes(s._id) ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                                            </div>
                                        </td>
                                        <td><code style={{ fontSize: 11, color: '#1a237e' }}>{s.studentId}</code></td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-admin" style={{ fontSize: 11 }}>{s.class}</span>
                                        </td>

                                        <td>{s.rollNo}</td>
                                        <td>
                                            <div style={{ fontSize: 13 }}>{s.parentName}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                                <a href={`tel:${s.parentPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    Ph. {s.parentPhone}
                                                </a>
                                            </div>
                                        </td>
                                        <td style={{ minWidth: 90 }}>
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
                                        <td style={{ textAlign: 'center' }}>
                                            {getTuitionStatus(s) === 'na' ? <span style={{ color: '#9ca3af', fontSize: 12 }}>N/A</span> : (
                                                <span className={`badge ${STATUS_BADGE[getTuitionStatus(s)] || 'badge-unpaid'}`}>
                                                    {getTuitionStatus(s)}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ minWidth: 90 }}>
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
                                        <td style={{ textAlign: 'center' }}>
                                            {getLibraryStatus(s) === 'na' ? <span style={{ color: '#9ca3af', fontSize: 12 }}>N/A</span> : (
                                                <span className={`badge ${STATUS_BADGE[getLibraryStatus(s)] || 'badge-unpaid'}`}>
                                                    {getLibraryStatus(s)}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {/* 2x2 action grid - same style as Staff page */}
                                            <div className="actions-grid">
                                                {/* Row 1: Pay + Receipt */}
                                                <button
                                                    className="btn btn-success btn-sm btn-icon"
                                                    title="Record Payment"
                                                    style={{ opacity: (s.pendingAmount > 0 || (s.pendingBookAmount || 0) > 0) ? 1 : 0.3, cursor: (s.pendingAmount > 0 || (s.pendingBookAmount || 0) > 0) ? 'pointer' : 'default' }}
                                                    onClick={() => (s.pendingAmount > 0 || (s.pendingBookAmount || 0) > 0) && setShowPayment(s)}>
                                                    <MdPayment />
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm btn-icon"
                                                    title="Download Latest Receipt"
                                                    style={{ opacity: (s.totalPaid > 0 || (s.totalBookPaid || 0) > 0) ? 1 : 0.3, cursor: (s.totalPaid > 0 || (s.totalBookPaid || 0) > 0) ? 'pointer' : 'default' }}
                                                    onClick={() => (s.totalPaid > 0 || (s.totalBookPaid || 0) > 0) && downloadLatestReceipt(s)}>
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
                                                {/* Row 3: WhatsApp + Delete */}
                                                <button className="btn btn-sm btn-icon" title="WhatsApp Reminder"
                                                    style={{ background: '#25D366', color: 'white', opacity: (s.pendingAmount > 0 || (s.pendingBookAmount || 0) > 0) ? 1 : 0.3, cursor: (s.pendingAmount > 0 || (s.pendingBookAmount || 0) > 0) ? 'pointer' : 'default', border: 'none' }}
                                                    onClick={() => (s.pendingAmount > 0 || (s.pendingBookAmount || 0) > 0) && handleWhatsApp(s)}>
                                                    <FaWhatsapp />
                                                </button>
                                                <button className="btn btn-danger btn-sm btn-icon" title="Delete"
                                                    onClick={() => setShowDeleteConfirm(s)}>
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Previous
                                </button>
                                <span className="pagination-info">
                                    Showing <strong>{(page - 1) * 50 + 1} - {(page - 1) * 50 + students.length}</strong> of <strong>{totalStudents}</strong>
                                </span>
                                <button
                                    className="pagination-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        )}
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
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Total Tuition Fee <span className="required">*</span></label>
                                        <input type="number" className={`form-control ${formErrors.totalFee ? 'error' : ''}`}
                                            value={formData.totalFee} onChange={e => setFormData({ ...formData, totalFee: e.target.value })}
                                            onWheel={(e) => e.target.blur()}
                                            placeholder="Annual tuition fee" min="0" />
                                        {formErrors.totalFee && <p className="form-error">{formErrors.totalFee}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Total Book's Fee <span className="required">*</span></label>
                                        <input type="number" className={`form-control ${formErrors.totalBookFee ? 'error' : ''}`}
                                            value={formData.totalBookFee} onChange={e => setFormData({ ...formData, totalBookFee: e.target.value })}
                                            onWheel={(e) => e.target.blur()}
                                            placeholder="Annual book's fee" min="0" />
                                        {formErrors.totalBookFee && <p className="form-error">{formErrors.totalBookFee}</p>}
                                    </div>
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

            {/* Delete Payment Confirm */}
            {showDeletePaymentConfirm && (
                <div className="modal-overlay" style={{ zIndex: 1200 }}>
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="btn-close" onClick={() => setShowDeletePaymentConfirm(null)}><MdClose /></button>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-dialog">
                                <div className="confirm-icon">🗑️</div>
                                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Delete Payment Record?</p>
                                <p style={{ fontSize: 13, color: '#6b7280' }}>
                                    This action cannot be undone. The fee payment will be permanently deleted.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeletePaymentConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={confirmDeletePayment}>Delete Record</button>
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
                                <div style={{ marginTop: 12, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tuition Fee:</div>
                                    <div style={{ display: 'flex', gap: 20 }}>
                                        <span style={{ fontSize: 13 }}>Total: <strong>{formatCurrency(showPayment.totalFee)}</strong></span>
                                        <span style={{ fontSize: 13 }}>Paid: <strong style={{ color: '#43a047' }}>{formatCurrency(showPayment.totalPaid)}</strong></span>
                                        <span style={{ fontSize: 13 }}>Pending: <strong style={{ color: '#e53935' }}>{formatCurrency(showPayment.pendingAmount)}</strong></span>
                                    </div>
                                </div>
                                <div style={{ marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Book's Fee:</div>
                                    <div style={{ display: 'flex', gap: 20 }}>
                                        <span style={{ fontSize: 13 }}>Total: <strong>{formatCurrency(showPayment.totalBookFee || 0)}</strong></span>
                                        <span style={{ fontSize: 13 }}>Paid: <strong style={{ color: '#43a047' }}>{formatCurrency(showPayment.totalBookPaid || 0)}</strong></span>
                                        <span style={{ fontSize: 13 }}>Pending: <strong style={{ color: '#e53935' }}>{formatCurrency(showPayment.pendingBookAmount || 0)}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <form id="payment-form" onSubmit={handlePayment}>
                                <div className="form-grid">
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Payment For <span className="required">*</span></label>
                                        <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input type="radio" name="feeType" value="tuition" checked={paymentForm.feeType === 'tuition'} onChange={e => setPaymentForm({ ...paymentForm, feeType: e.target.value })} />
                                                Tuition Fee
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input type="radio" name="feeType" value="book" checked={paymentForm.feeType === 'book'} onChange={e => setPaymentForm({ ...paymentForm, feeType: e.target.value })} />
                                                Book's Fee
                                            </label>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount (₹) <span className="required">*</span></label>
                                        <input type="number" className="form-control"
                                            value={paymentForm.amount}
                                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            onWheel={(e) => e.target.blur()}
                                            min={0} step={1} placeholder="Enter amount" />
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
                                    <div className="mobile-stack" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                        <div className="highlight-box" style={{ flex: 1, borderLeft: '4px solid #3b82f6' }}>
                                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Tuition Total / Paid / Pending</div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>
                                                {formatCurrency(showHistory.totalFee)} / <span style={{ color: '#43a047' }}>{formatCurrency(historyData.totalPaid)}</span> / <span style={{ color: '#e53935' }}>{formatCurrency(historyData.pendingAmount)}</span>
                                            </div>
                                        </div>
                                        <div className="highlight-box" style={{ flex: 1, borderLeft: '4px solid #8b5cf6' }}>
                                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Book's Total / Paid / Pending</div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>
                                                {formatCurrency(showHistory.totalBookFee || 0)} / <span style={{ color: '#43a047' }}>{formatCurrency(historyData.totalBookPaid || 0)}</span> / <span style={{ color: '#e53935' }}>{formatCurrency(historyData.pendingBookAmount || 0)}</span>
                                            </div>
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
                                                        <th>Type</th>
                                                        <th>Date</th>
                                                        <th>Mode</th>
                                                        <th>Remarks</th>
                                                        <th>Download</th>
                                                        {isOwner && (
                                                            <>
                                                                <th>Edit</th>
                                                                <th>Delete</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyData.payments.map((p, i) => (
                                                        <tr key={i}>
                                                            <td><code style={{ fontSize: 12, color: '#1a237e' }}>{p.receiptNo || '-'}</code></td>
                                                            <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(p.amount)}</td>
                                                            <td style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 600 }}>{p.feeType || 'tuition'}</td>
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
                                                                <>
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
                                                                    <td>
                                                                        <button
                                                                            className="btn btn-sm"
                                                                            title="Delete Payment"
                                                                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                            onClick={() => handleDeletePayment(p._id)}
                                                                        >
                                                                            <MdDelete style={{ fontSize: 14 }} /> Delete
                                                                        </button>
                                                                    </td>
                                                                </>
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
                                            onWheel={(e) => e.target.blur()}
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
                                    <div className="promote-result-grid" style={{ gap: 10 }}>
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
