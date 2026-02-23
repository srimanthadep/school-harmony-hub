import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { generateSalarySlipPDF, exportStaffExcel, exportStaffPDF } from '../utils/pdfUtils';
import { getCurrentAcademicYear, getAcademicYearOptions } from '../utils/academicYear';
import {
    MdAdd, MdSearch, MdPayment, MdReceiptLong, MdHistory, MdDateRange,
    MdFileDownload, MdPictureAsPdf, MdTableChart, MdPerson
} from 'react-icons/md';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { motion } from 'framer-motion';
import { Staff, SalaryPayment, StaffListResponse } from '../types';

// Components
import StaffTable from '../components/staff/StaffTable';
import StaffForm from '../components/staff/StaffForm';
import SalaryModal from '../components/staff/SalaryModal';
import StaffHistoryModal from '../components/staff/StaffHistoryModal';
import EditSalaryModal from '../components/staff/EditSalaryModal';
import LeaveModal from '../components/staff/LeaveModal';
import EditLeaveModal from '../components/staff/EditLeaveModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const ROLES = ['teacher', 'principal', 'vice_principal', 'admin_staff', 'librarian', 'peon', 'guard', 'accountant', 'other'];
const ACADEMIC_YEARS = getAcademicYearOptions();

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
    name: '', phone: '', role: 'teacher', subject: '',
    department: '', qualification: '', experience: '', gender: 'male',
    address: '', monthlySalary: '', joiningDate: '',
    bankAccount: '', bankName: '', ifscCode: '', academicYear: getCurrentAcademicYear(),
    isActive: true
};

const ROLE_DISPLAY = (r: string) => r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function StaffPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { addNotification } = useNotifications();

    // List & Filter State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [yearFilter, setYearFilter] = useState(getCurrentAcademicYear());
    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState(1);

    // Form Modal State
    const [showForm, setShowForm] = useState(false);
    const [editStaff, setEditStaff] = useState<Staff | null>(null);
    const [formData, setFormData] = useState<any>(emptyStaff);
    const [formErrors, setFormErrors] = useState<any>({});
    const [formLoading, setFormLoading] = useState(false);

    // Delete Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Staff | null>(null);
    const [showDeletePaymentConfirm, setShowDeletePaymentConfirm] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Salary Modal State
    const [showSalaryId, setShowSalaryId] = useState<string | null>(null);
    const [salaryForm, setSalaryForm] = useState<any>({
        month: CURRENT_MONTH, baseAmount: '', cuttings: '', amount: '', paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'bank_transfer', remarks: ''
    });
    const [salaryLoading, setSalaryLoading] = useState(false);

    // History & Edit Salary State
    const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
    const [historyData, setHistoryData] = useState<any>(null);
    const [editSalaryTarget, setEditSalaryTarget] = useState<any>(null); // { staffId, payment }
    const [editSalaryForm, setEditSalaryForm] = useState<any>({
        baseAmount: '', cuttings: '', amount: '', paymentDate: '', paymentMode: 'bank_transfer', remarks: '', month: ''
    });
    const [editSalaryLoading, setEditSalaryLoading] = useState(false);

    // Leave Modal State
    const [showLeavesId, setShowLeavesId] = useState<string | null>(null);
    const [leaveForm, setLeaveForm] = useState({ date: new Date().toISOString().split('T')[0], reason: '' });
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [editLeaveTarget, setEditLeaveTarget] = useState<any>(null); // { staffId, leave }
    const [editLeaveForm, setEditLeaveForm] = useState({ date: '', reason: '', status: 'approved' });
    const [editLeaveLoading, setEditLeaveLoading] = useState(false);

    const [settings, setSettings] = useState<any>({});

    // Fetch staff data
    const { data, isLoading } = useQuery<StaffListResponse>({
        queryKey: ['staff', page, roleFilter, yearFilter],
        queryFn: async () => {
            const params: any = { page, limit: 50 };
            if (roleFilter) params.role = roleFilter;
            if (yearFilter) params.academicYear = yearFilter;
            const res = await API.get('/staff', { params });
            return res.data;
        }
    });

    const staff = data?.staff || [];
    const totalPages = data?.pages || 1;
    const totalStaffCount = data?.total || 0;

    useEffect(() => {
        API.get('/settings').then(r => setSettings(r.data.settings)).catch(() => { });
    }, []);

    const getStatus = (s: Staff) => s.salaryPayments?.some(p => p.month === CURRENT_MONTH) ? 'paid' : 'unpaid';

    const STATUS_ORDER: Record<string, number> = { paid: 2, unpaid: 0 };

    const sortedStaff = useMemo(() => {
        return [...staff].sort((a, b) => {
            if (sortField === 'status') {
                const av = STATUS_ORDER[getStatus(a)] ?? 0;
                const bv = STATUS_ORDER[getStatus(b)] ?? 0;
                return (av - bv) * sortDir;
            }
            if (sortField === 'leaves') {
                const av = a.leaves?.length || 0;
                const bv = b.leaves?.length || 0;
                return (av - bv) * sortDir;
            }
            const av = sortField === 'monthlySalary' ? a.monthlySalary
                : sortField === 'totalSalaryPaid' ? a.totalSalaryPaid
                    : (a[sortField as keyof Staff] || '');
            const bv = sortField === 'monthlySalary' ? b.monthlySalary
                : sortField === 'totalSalaryPaid' ? b.totalSalaryPaid
                    : (b[sortField as keyof Staff] || '');
            if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
            return String(av).localeCompare(String(bv)) * sortDir;
        });
    }, [staff, sortField, sortDir]);

    const fuse = useMemo(() => new Fuse(sortedStaff, {
        keys: ['name', 'staffId', 'phone', 'role'],
        threshold: 0.3
    }), [sortedStaff]);

    const filteredStaff: Staff[] = useMemo(() => {
        if (!search) return sortedStaff;
        return fuse.search(search).map(r => r.item);
    }, [search, sortedStaff, fuse]);

    // Derived states
    const showLeaves = useMemo(() => staff.find(s => s._id === showLeavesId) || null, [staff, showLeavesId]);
    const showSalary = useMemo(() => staff.find(s => s._id === showSalaryId) || null, [staff, showSalaryId]);
    const showHistory = useMemo(() => staff.find(s => s._id === showHistoryId) || null, [staff, showHistoryId]);

    // Handlers
    const validateForm = () => {
        const errs: any = {};
        if (!formData.name?.trim()) errs.name = 'Name is required';
        if (!formData.phone?.trim()) errs.phone = 'Phone is required';
        if (formData.monthlySalary === '' || Number(formData.monthlySalary) < 0) errs.monthlySalary = 'Valid salary required';
        if (!formData.joiningDate) errs.joiningDate = 'Joining date is required';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setFormLoading(true);
        try {
            if (editStaff) {
                await API.put(`/staff/${editStaff._id}`, formData);
                toast.success('Staff updated!');
                addNotification({
                    type: 'info',
                    title: 'Staff Updated',
                    message: `Details updated for ${formData.name}.`
                });
            } else {
                await API.post('/staff', formData);
                toast.success('Staff added!');
                addNotification({
                    type: 'promotion',
                    title: 'New Staff Registered',
                    message: `${formData.name} added as ${ROLE_DISPLAY(formData.role)}.`
                });
            }
            setShowForm(false); setEditStaff(null); setFormData(emptyStaff);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err: any) { toast.error(err.response?.data?.message || 'Operation failed'); }
        finally { setFormLoading(false); }
    };

    const openEdit = (s: Staff) => {
        setEditStaff(s);
        setFormData({
            name: s.name, phone: s.phone, role: s.role,
            subject: s.subject || '', department: s.department || '',
            qualification: s.qualification || '', experience: s.experience || '',
            gender: s.gender || 'male', address: s.address || '',
            monthlySalary: s.monthlySalary, bankAccount: s.bankAccount || '',
            bankName: s.bankName || '', ifscCode: s.ifscCode || '',
            academicYear: s.academicYear || getCurrentAcademicYear(),
            isActive: s.isActive !== false,
            joiningDate: s.joiningDate ? s.joiningDate.split('T')[0] : ''
        });
        setShowForm(true);
    };

    const handleDeleteStaff = async () => {
        if (!showDeleteConfirm) return;
        setDeleteLoading(true);
        try {
            await API.delete(`/staff/${showDeleteConfirm._id}`);
            toast.success('Staff deleted');
            setShowDeleteConfirm(null);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch { toast.error('Delete failed'); }
        finally { setDeleteLoading(false); }
    };

    const openHistory = async (s: Staff) => {
        setShowHistoryId(s._id);
        try {
            const res = await API.get(`/staff/${s._id}/salaries`);
            const data = res.data;
            if (data.salaryPayments) data.salaryPayments = [...data.salaryPayments].reverse();
            setHistoryData(data);
        } catch { toast.error('Failed to load salary history'); }
    };

    const handleSalaryPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (salaryForm.amount === '' || Number(salaryForm.amount) < 0) { toast.error('Enter a valid amount'); return; }
        setSalaryLoading(true);
        try {
            const staffName = showSalary?.name || 'Staff Member';
            await API.post(`/staff/${showSalaryId}/salaries`, {
                ...salaryForm,
                amount: Number(salaryForm.amount),
                baseAmount: Number(salaryForm.baseAmount || 0),
                cuttings: Number(salaryForm.cuttings || 0)
            });
            toast.success('Salary payment recorded!');
            addNotification({
                type: 'salary',
                title: 'Salary Paid',
                message: `₹${Number(salaryForm.amount).toLocaleString()} paid to ${staffName} for ${salaryForm.month}.`
            });
            setShowSalaryId(null);
            setSalaryForm({ month: CURRENT_MONTH, baseAmount: '', cuttings: '', amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'bank_transfer', remarks: '' });
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err: any) { toast.error(err.response?.data?.message || 'Payment failed'); }
        finally { setSalaryLoading(false); }
    };

    const downloadLatestPayslip = (s: Staff) => {
        if (!s.salaryPayments?.length) return;
        const last = s.salaryPayments[s.salaryPayments.length - 1];
        generateSalarySlipPDF(s, last, settings);
    };

    const openEditSalary = (payment: any) => {
        if (!showHistory) return;
        setEditSalaryTarget({ staffId: showHistory._id, payment });
        setEditSalaryForm({
            baseAmount: payment.baseAmount || payment.amount,
            cuttings: payment.cuttings || 0,
            amount: payment.amount,
            paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
            paymentMode: payment.paymentMode || 'bank_transfer',
            remarks: payment.remarks || '',
            month: payment.month || CURRENT_MONTH
        });
    };

    const handleEditSalary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editSalaryTarget) return;
        if (editSalaryForm.amount === '' || Number(editSalaryForm.amount) < 0) {
            toast.error('Valid amount required');
            return;
        }
        setEditSalaryLoading(true);
        try {
            await API.put(
                `/staff/${editSalaryTarget.staffId}/salaries/${editSalaryTarget.payment._id}`,
                editSalaryForm
            );
            toast.success('Salary payment updated!');
            const staffId = editSalaryTarget.staffId;
            setEditSalaryTarget(null);
            // Refresh history
            const res = await API.get(`/staff/${staffId}/salaries`);
            setHistoryData(res.data);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setEditSalaryLoading(false);
        }
    };

    const confirmDeleteSalaryPayment = async () => {
        if (!showDeletePaymentConfirm || !showHistoryId) return;
        setDeleteLoading(true);
        try {
            await API.delete(`/staff/${showHistoryId}/salaries/${showDeletePaymentConfirm}`);
            toast.success('Salary payment deleted!');
            // Refresh history
            const res = await API.get(`/staff/${showHistoryId}/salaries`);
            setHistoryData(res.data);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setShowDeletePaymentConfirm(null);
            setDeleteLoading(false);
        }
    };

    const handleRecordLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leaveForm.date) { toast.error('Date is required'); return; }
        setLeaveLoading(true);
        try {
            await API.post(`/staff/${showLeavesId}/leaves`, leaveForm);
            toast.success('Leave recorded!');
            setLeaveForm({ date: new Date().toISOString().split('T')[0], reason: '' });
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to record leave');
        } finally {
            setLeaveLoading(false);
        }
    };

    const handleDeleteLeave = async (leaveId: string) => {
        try {
            await API.delete(`/staff/${showLeavesId}/leaves/${leaveId}`);
            toast.success('Leave deleted');
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete leave');
        }
    };

    const openEditLeave = (leave: any) => {
        setEditLeaveTarget({ staffId: showLeavesId, leave });
        setEditLeaveForm({
            date: leave.date ? leave.date.split('T')[0] : '',
            reason: leave.reason || '',
            status: leave.status || 'approved'
        });
    };

    const handleEditLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editLeaveTarget) return;
        setEditLeaveLoading(true);
        try {
            await API.put(
                `/staff/${editLeaveTarget.staffId}/leaves/${editLeaveTarget.leave._id}`,
                editLeaveForm
            );
            toast.success('Leave updated!');
            setEditLeaveTarget(null);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setEditLeaveLoading(false);
        }
    };

    const toggleSort = (field: string) => {
        if (sortField === field) setSortDir(d => -d);
        else { setSortField(field); setSortDir(1); }
    };

    return (
        <div>
            {/* Controls */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="card glass" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="filters-bar">
                        <div className="search-bar" style={{ minWidth: 260 }}>
                            <MdSearch className="search-icon" />
                            <input placeholder="Search name, ID, phone..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-control" style={{ width: 140 }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
                            <option value="">All Roles</option>
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_DISPLAY(r)}</option>)}
                        </select>
                        <select className="form-control" style={{ width: 130 }} value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1); }}>
                            <option value="">All Sessions</option>
                            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={() => exportStaffExcel(filteredStaff)} title="Export to Excel">
                                <MdTableChart />
                            </button>
                            <button className="btn btn-secondary" onClick={() => exportStaffPDF(filteredStaff)} title="Export to PDF">
                                <MdPictureAsPdf />
                            </button>
                        </div>
                        <button className="btn btn-primary hover-lift" onClick={() => { setEditStaff(null); setFormData(emptyStaff); setFormErrors({}); setShowForm(true); }}>
                            <MdAdd /> Add Staff
                        </button>
                    </div>
                </div>
                <div style={{ padding: '8px 24px', fontSize: 13, color: '#64748b' }}>
                    Found <strong>{totalStaffCount}</strong> staff members •
                    Showing <strong>{staff.length}</strong> on this page
                </div>
            </motion.div >

            {/* Table */}
            <div className="card">
                <StaffTable
                    staff={filteredStaff}
                    isLoading={isLoading}
                    onEdit={openEdit}
                    onDelete={setShowDeleteConfirm}
                    onPaySalary={(s) => {
                        setShowSalaryId(s._id);
                        setSalaryForm((f: any) => ({
                            ...f,
                            baseAmount: s.monthlySalary,
                            cuttings: 0,
                            amount: s.monthlySalary,
                            month: CURRENT_MONTH,
                            paymentDate: new Date().toISOString().split('T')[0]
                        }));
                    }}
                    downloadLatestPayslip={downloadLatestPayslip}
                    onViewHistory={openHistory}
                    onViewLeaves={(s) => setShowLeavesId(s._id)}
                    sortField={sortField}
                    sortDir={sortDir}
                    toggleSort={toggleSort}
                    getStatus={getStatus}
                    roleDisplay={ROLE_DISPLAY}
                />

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
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
            </div >

            {/* Modals */}
            <StaffForm
                show={showForm}
                editStaff={editStaff}
                formData={formData}
                formErrors={formErrors}
                formLoading={formLoading}
                onClose={() => setShowForm(false)}
                onSubmit={handleFormSubmit}
                setFormData={setFormData}
                roles={ROLES}
                roleDisplay={ROLE_DISPLAY}
            />

            <SalaryModal
                show={showSalary}
                salaryForm={salaryForm}
                salaryLoading={salaryLoading}
                months={MONTHS}
                onClose={() => setShowSalaryId(null)}
                onSubmit={handleSalaryPayment}
                setSalaryForm={setSalaryForm}
                roleDisplay={ROLE_DISPLAY}
            />

            <StaffHistoryModal
                show={showHistory}
                historyData={historyData}
                userRole={user?.role}
                onClose={() => { setShowHistoryId(null); setHistoryData(null); }}
                onDownloadSlip={(p) => generateSalarySlipPDF(showHistory!, p, settings)}
                onEditSalary={openEditSalary}
                onDeleteSalary={setShowDeletePaymentConfirm}
                onReverseHistory={() => setHistoryData((h: any) => ({ ...h, salaryPayments: [...h.salaryPayments].reverse() }))}
            />

            <EditSalaryModal
                show={editSalaryTarget}
                editForm={editSalaryForm}
                loading={editSalaryLoading}
                months={MONTHS}
                onClose={() => setEditSalaryTarget(null)}
                onFormChange={setEditSalaryForm}
                onSubmit={handleEditSalary}
            />

            <LeaveModal
                show={showLeaves}
                leaveForm={leaveForm}
                leaveLoading={leaveLoading}
                userRole={user?.role}
                onClose={() => setShowLeavesId(null)}
                onRecordLeave={handleRecordLeave}
                onDeleteLeave={handleDeleteLeave}
                onEditLeave={openEditLeave}
                setLeaveForm={setLeaveForm}
            />

            <EditLeaveModal
                show={editLeaveTarget}
                editForm={editLeaveForm}
                loading={editLeaveLoading}
                onClose={() => setEditLeaveTarget(null)}
                onFormChange={setEditLeaveForm}
                onSubmit={handleEditLeave}
            />

            <DeleteConfirmModal
                show={!!showDeleteConfirm}
                title="Delete Staff"
                message={`Are you sure you want to delete ${showDeleteConfirm?.name}? This action cannot be undone.`}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDeleteStaff}
                loading={deleteLoading}
            />

            <DeleteConfirmModal
                show={!!showDeletePaymentConfirm}
                title="Delete Salary Record"
                message="Are you sure you want to delete this salary payment? This action cannot be undone."
                onClose={() => setShowDeletePaymentConfirm(null)}
                onConfirm={confirmDeleteSalaryPayment}
                loading={deleteLoading}
            />
        </div >
    );
}
