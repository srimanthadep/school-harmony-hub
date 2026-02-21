import React, { useEffect, useState, useCallback } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, generateSalarySlipPDF } from '../utils/pdfUtils';
import {
    MdAdd, MdEdit, MdDelete, MdSearch, MdClose,
    MdPayment, MdHistory, MdDownload, MdPerson, MdReceiptLong
} from 'react-icons/md';

const ROLES = ['teacher', 'principal', 'vice_principal', 'admin_staff', 'librarian', 'peon', 'guard', 'accountant', 'other'];

const ACADEMIC_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27'];

const generateMonths = () => {
    const months = [];
    const date = new Date();
    // Show 12 months back and 3 months forward
    const start = new Date(date.getFullYear(), date.getMonth() - 12, 1);
    for (let i = 0; i < 16; i++) {
        months.push(start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        start.setMonth(start.getMonth() + 1);
    }
    return months;
};

const MONTHS = generateMonths();
const CURRENT_MONTH = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const emptyStaff = {
    name: '', email: '', phone: '', role: 'teacher', subject: '',
    department: '', qualification: '', experience: '', gender: 'male',
    address: '', monthlySalary: '', joiningDate: '',
    bankAccount: '', bankName: '', ifscCode: '', academicYear: '2025-26'
};

const ROLE_DISPLAY = (r) => r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStaffCount, setTotalStaffCount] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter, yearFilter]);

    const [showForm, setShowForm] = useState(false);
    const [editStaff, setEditStaff] = useState(null);
    const [formData, setFormData] = useState(emptyStaff);
    const [formErrors, setFormErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showSalary, setShowSalary] = useState(null);
    const [showHistory, setShowHistory] = useState(null);
    const [historyData, setHistoryData] = useState(null);

    const [salaryForm, setSalaryForm] = useState({
        month: CURRENT_MONTH, amount: '', paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'bank_transfer', remarks: ''
    });
    const [salaryLoading, setSalaryLoading] = useState(false);
    const [settings, setSettings] = useState({});

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 50 };
            if (roleFilter) params.role = roleFilter;
            if (yearFilter) params.academicYear = yearFilter;
            if (debouncedSearch) params.search = debouncedSearch;
            const res = await API.get('/staff', { params });
            setStaff(res.data.staff);
            setTotalStaffCount(res.data.total || 0);
            setTotalPages(Math.ceil((res.data.total || 0) / 50));
        } catch { toast.error('Failed to load staff'); }
        finally { setLoading(false); }
    }, [roleFilter, debouncedSearch, page]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);
    useEffect(() => { API.get('/settings').then(r => setSettings(r.data.settings)).catch(() => { }); }, []);

    const validateForm = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        if (!formData.email.trim()) errs.email = 'Email is required';
        if (!formData.phone.trim()) errs.phone = 'Phone is required';
        if (!formData.monthlySalary || formData.monthlySalary <= 0) errs.monthlySalary = 'Valid salary required';
        if (!formData.joiningDate) errs.joiningDate = 'Joining date is required';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setFormLoading(true);
        try {
            if (editStaff) {
                await API.put(`/staff/${editStaff._id}`, formData);
                toast.success('Staff updated!');
            } else {
                await API.post('/staff', formData);
                toast.success('Staff added!');
            }
            setShowForm(false); setEditStaff(null); setFormData(emptyStaff);
            fetchStaff();
        } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
        finally { setFormLoading(false); }
    };

    const openEdit = (s) => {
        setEditStaff(s);
        setFormData({
            name: s.name, email: s.email, phone: s.phone, role: s.role,
            subject: s.subject || '', department: s.department || '',
            qualification: s.qualification || '', experience: s.experience || '',
            gender: s.gender || 'male', address: s.address || '',
            monthlySalary: s.monthlySalary, bankAccount: s.bankAccount || '',
            bankName: s.bankName || '', ifscCode: s.ifscCode || '',
            academicYear: s.academicYear || '2025-26',
            joiningDate: s.joiningDate ? s.joiningDate.split('T')[0] : ''
        });
        setShowForm(true);
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/staff/${showDeleteConfirm._id}`);
            toast.success('Staff deleted');
            setShowDeleteConfirm(null); fetchStaff();
        } catch { toast.error('Delete failed'); }
    };

    const openHistory = async (s) => {
        setShowHistory(s);
        try {
            const res = await API.get(`/staff/${s._id}/salaries`);
            setHistoryData(res.data);
        } catch { toast.error('Failed to load salary history'); }
    };

    const handleSalaryPayment = async (e) => {
        e.preventDefault();
        if (!salaryForm.amount || salaryForm.amount <= 0) { toast.error('Enter a valid amount'); return; }
        setSalaryLoading(true);
        try {
            await API.post(`/staff/${showSalary._id}/salaries`, { ...salaryForm, amount: Number(salaryForm.amount) });
            toast.success('Salary payment recorded!');
            setShowSalary(null);
            setSalaryForm({ month: CURRENT_MONTH, amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'bank_transfer', remarks: '' });
            fetchStaff();
        } catch (err) { toast.error(err.response?.data?.message || 'Payment failed'); }
        finally { setSalaryLoading(false); }
    };

    const downloadLatestPayslip = (s) => {
        if (!s.salaryPayments || s.salaryPayments.length === 0) {
            toast.error('No salary history to download');
            return;
        }
        const latestInfo = [...s.salaryPayments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
        generateSalarySlipPDF(s, latestInfo, settings);
    };

    return (
        <div>
            {/* Controls */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="filters-bar">
                        <div className="search-bar" style={{ minWidth: 220 }}>
                            <MdSearch className="search-icon" />
                            <input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-control" style={{ width: 140 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                            <option value="">All Roles</option>
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_DISPLAY(r)}</option>)}
                        </select>
                        <select className="form-control" style={{ width: 130 }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                            <option value="">All Sessions</option>
                            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditStaff(null); setFormData(emptyStaff); setFormErrors({}); setShowForm(true); }}>
                        <MdAdd /> Add Staff
                    </button>
                </div>
                <div style={{ padding: '8px 24px', fontSize: 13, color: '#6b7280' }}>
                    Showing <strong>{(page - 1) * 50 + 1} - {(page - 1) * 50 + staff.length}</strong> of <strong>{totalStaffCount}</strong> staff members
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {loading ? (
                    <div className="loading-spinner"><div className="spinner" /></div>
                ) : staff.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">👨‍🏫</div>
                        <h3>No staff found</h3>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Subject</th>
                                    <th>Monthly Salary</th>
                                    <th>Total Paid</th>
                                    <th>Session</th>
                                    <th>Joining Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map(s => (
                                    <tr key={s._id}>
                                        <td><code style={{ fontSize: 11, color: '#1a237e' }}>{s.staffId}</code></td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.email}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-admin" style={{ textTransform: 'capitalize' }}>
                                                {ROLE_DISPLAY(s.role)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{s.subject || '-'}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(s.monthlySalary)}</td>
                                        <td style={{ fontWeight: 600, color: '#43a047' }}>{formatCurrency(s.totalSalaryPaid)}</td>
                                        <td style={{ fontSize: 12 }}><span className="badge" style={{ background: '#f0f2f8', color: '#1a237e' }}>{s.academicYear || '-'}</span></td>
                                        <td style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(s.joiningDate)}</td>
                                        <td>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 5,
                                                minWidth: 90
                                            }}>
                                                <button className="btn btn-success btn-sm btn-icon" title="Pay Salary"
                                                    onClick={() => {
                                                        setShowSalary(s);
                                                        setSalaryForm(f => ({
                                                            ...f,
                                                            amount: s.monthlySalary,
                                                            month: CURRENT_MONTH,
                                                            paymentDate: new Date().toISOString().split('T')[0]
                                                        }));
                                                    }}>
                                                    <MdPayment />
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm btn-icon"
                                                    title="Download Latest Payslip"
                                                    style={{ opacity: s.totalSalaryPaid > 0 ? 1 : 0.3, cursor: s.totalSalaryPaid > 0 ? 'pointer' : 'default' }}
                                                    onClick={() => s.totalSalaryPaid > 0 && downloadLatestPayslip(s)}>
                                                    <MdReceiptLong />
                                                </button>
                                                <button className="btn btn-secondary btn-sm btn-icon" title="Salary History"
                                                    onClick={() => openHistory(s)}>
                                                    <MdHistory />
                                                </button>
                                                <button className="btn btn-secondary btn-sm btn-icon" title="Edit" onClick={() => openEdit(s)}>
                                                    <MdEdit />
                                                </button>
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

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="pagination" style={{ padding: '0 24px 20px' }}>
                        <button
                            className="pagination-btn"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page <strong>{page}</strong> of {totalPages}
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

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><MdPerson /> {editStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
                            <button className="btn-close" onClick={() => setShowForm(false)}><MdClose /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-section-title">Personal Information</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name <span className="required">*</span></label>
                                        <input className={`form-control ${formErrors.name ? 'error' : ''}`}
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        {formErrors.name && <p className="form-error">{formErrors.name}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email <span className="required">*</span></label>
                                        <input type="email" className={`form-control ${formErrors.email ? 'error' : ''}`}
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        {formErrors.email && <p className="form-error">{formErrors.email}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone <span className="required">*</span></label>
                                        <input className={`form-control ${formErrors.phone ? 'error' : ''}`}
                                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select className="form-control" value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <input className="form-control" value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-section-title">Professional Details</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Role <span className="required">*</span></label>
                                        <select className="form-control" value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                            {ROLES.map(r => <option key={r} value={r}>{ROLE_DISPLAY(r)}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subject (for teachers)</label>
                                        <input className="form-control" value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="e.g., Mathematics" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Qualification</label>
                                        <input className="form-control" value={formData.qualification}
                                            onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Experience (years)</label>
                                        <input type="number" className="form-control" value={formData.experience}
                                            onWheel={(e) => e.target.blur()}
                                            onChange={e => setFormData({ ...formData, experience: e.target.value })} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Joining Date <span className="required">*</span></label>
                                        <input type="date" className={`form-control ${formErrors.joiningDate ? 'error' : ''}`}
                                            value={formData.joiningDate}
                                            onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                                        {formErrors.joiningDate && <p className="form-error">{formErrors.joiningDate}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Academic Year</label>
                                        <input className="form-control" value={formData.academicYear}
                                            onChange={e => setFormData({ ...formData, academicYear: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-section-title">Salary & Bank Details</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Monthly Salary (₹) <span className="required">*</span></label>
                                        <input type="number" className={`form-control ${formErrors.monthlySalary ? 'error' : ''}`}
                                            value={formData.monthlySalary}
                                            onWheel={(e) => e.target.blur()}
                                            onChange={e => setFormData({ ...formData, monthlySalary: e.target.value })} min="0" />
                                        {formErrors.monthlySalary && <p className="form-error">{formErrors.monthlySalary}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bank Account No</label>
                                        <input className="form-control" value={formData.bankAccount}
                                            onChange={e => setFormData({ ...formData, bankAccount: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bank Name</label>
                                        <input className="form-control" value={formData.bankName}
                                            onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">IFSC Code</label>
                                        <input className="form-control" value={formData.ifscCode}
                                            onChange={e => setFormData({ ...formData, ifscCode: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Saving...' : editStaff ? 'Update Staff' : 'Add Staff'}
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
                                <p style={{ fontSize: 13, color: '#6b7280' }}>Staff record will be deactivated.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Salary Payment Modal */}
            {showSalary && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3><MdPayment /> Pay Salary - {showSalary.name}</h3>
                            <button className="btn-close" onClick={() => setShowSalary(null)}><MdClose /></button>
                        </div>
                        <form onSubmit={handleSalaryPayment}>
                            <div className="modal-body">
                                <div className="highlight-box" style={{ marginBottom: 16 }}>
                                    <strong>{showSalary.name}</strong> · {ROLE_DISPLAY(showSalary.role)}
                                    {showSalary.subject && ` · ${showSalary.subject}`}
                                    <div style={{ marginTop: 6, fontSize: 14 }}>
                                        Monthly Salary: <strong style={{ color: '#1a237e' }}>{formatCurrency(showSalary.monthlySalary)}</strong>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Month <span className="required">*</span></label>
                                        <select className="form-control" value={salaryForm.month}
                                            onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })}>
                                            {MONTHS.map(m => <option key={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount (₹) <span className="required">*</span></label>
                                        <input type="number" className="form-control" value={salaryForm.amount}
                                            onWheel={(e) => e.target.blur()}
                                            onChange={e => setSalaryForm({ ...salaryForm, amount: e.target.value })} min={1} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Date</label>
                                        <input type="date" className="form-control" value={salaryForm.paymentDate}
                                            onChange={e => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Mode</label>
                                        <select className="form-control" value={salaryForm.paymentMode}
                                            onChange={e => setSalaryForm({ ...salaryForm, paymentMode: e.target.value })}>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cash">Cash</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Remarks</label>
                                        <input className="form-control" value={salaryForm.remarks}
                                            onChange={e => setSalaryForm({ ...salaryForm, remarks: e.target.value })}
                                            placeholder="Optional remarks" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSalary(null)}>Cancel</button>
                                <button type="submit" className="btn btn-success" disabled={salaryLoading}>
                                    {salaryLoading ? 'Processing...' : '✓ Pay Salary'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Salary History Modal */}
            {showHistory && (
                <div className="modal-overlay">
                    <div className="modal modal-lg">
                        <div className="modal-header">
                            <h3><MdHistory /> Salary History - {showHistory.name}</h3>
                            <button className="btn-close" onClick={() => { setShowHistory(null); setHistoryData(null); }}><MdClose /></button>
                        </div>
                        <div className="modal-body">
                            {historyData ? (
                                <>
                                    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                        <div className="highlight-box" style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Monthly Salary</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a237e' }}>{formatCurrency(historyData.monthlySalary)}</div>
                                        </div>
                                        <div className="highlight-box" style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>Total Paid</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#43a047' }}>{formatCurrency(historyData.totalSalaryPaid)}</div>
                                        </div>
                                    </div>
                                    {historyData.salaryPayments?.length === 0 ? (
                                        <div className="empty-state" style={{ padding: 30 }}>
                                            <p style={{ color: '#9ca3af' }}>No salary payments recorded yet</p>
                                        </div>
                                    ) : (
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Slip No</th>
                                                        <th>Month</th>
                                                        <th>Amount</th>
                                                        <th>Date</th>
                                                        <th>Mode</th>
                                                        <th>Download</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyData.salaryPayments?.map((p, i) => (
                                                        <tr key={i}>
                                                            <td><code style={{ fontSize: 12, color: '#1a237e' }}>{p.slipNo || '-'}</code></td>
                                                            <td style={{ fontWeight: 600 }}>{p.month}</td>
                                                            <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(p.amount)}</td>
                                                            <td style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(p.paymentDate)}</td>
                                                            <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{(p.paymentMode || '').replace('_', ' ')}</td>
                                                            <td>
                                                                <button className="btn btn-secondary btn-sm"
                                                                    onClick={() => generateSalarySlipPDF(showHistory, p, settings)}>
                                                                    <MdDownload />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : <div className="loading-spinner"><div className="spinner" /></div>}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setShowHistory(null); setHistoryData(null); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
