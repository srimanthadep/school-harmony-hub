import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
    formatCurrency,
    generateFeeReceiptPDF,
    exportStudentsExcel,
    exportStudentsPDF
} from '../utils/pdfUtils';
import { getCurrentAcademicYear, getAcademicYearOptions } from '../utils/academicYear';
import { Student, StudentListResponse, PaymentHistoryResponse, Settings } from '../types';
import {
    MdAdd, MdSearch,
    MdPictureAsPdf, MdTableChart, MdPerson
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import StudentTable from '../components/students/StudentTable';
import StudentForm from '../components/students/StudentForm';
import PaymentModal from '../components/students/PaymentModal';
import PaymentHistoryModal from '../components/students/PaymentHistoryModal';
import EditPaymentModal from '../components/students/EditPaymentModal';
import BulkImportModal from '../components/students/BulkImportModal';
import PromoteModal from '../components/students/PromoteModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import StudentProfile from '../components/StudentProfile';

const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const PAYMENT_MODES = ['cash', 'online', 'cheque', 'dd'];
const ACADEMIC_YEARS = getAcademicYearOptions();

const emptyStudent = {
    name: '', class: 'Nursery', rollNo: '',
    gender: 'male', parentName: '', parentPhone: '', parentEmail: '',
    dateOfBirth: '', address: '', totalFee: '', totalBookFee: '', academicYear: getCurrentAcademicYear()
};

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const isOwner = user?.role === 'owner';
    const isAdmin = user?.role === 'admin';

    // Settings for PDF exports
    const [settings, setSettings] = useState<Settings>({});
    useEffect(() => {
        API.get('/settings').then(res => setSettings(res.data.settings || {}));
    }, []);

    // State for modals
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(emptyStudent);
    const [formErrors, setFormErrors] = useState<any>({});
    const [formLoading, setFormLoading] = useState(false);

    const [showPayment, setShowPayment] = useState<Student | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '' as string | number,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'cash',
        feeType: 'tuition',
        remarks: ''
    });
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [showHistory, setShowHistory] = useState<Student | null>(null);
    const [historyData, setHistoryData] = useState<PaymentHistoryResponse | null>(null);

    const [editPaymentTarget, setEditPaymentTarget] = useState<any>(null);
    const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', paymentDate: '', paymentMode: 'cash', remarks: '' });
    const [editPaymentLoading, setEditPaymentLoading] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<Student | null>(null);
    const [showDeletePaymentConfirm, setShowDeletePaymentConfirm] = useState<string | null>(null);

    const [showImportModal, setShowImportModal] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importForm, setImportForm] = useState({ class: 'Nursery', academicYear: getCurrentAcademicYear(), file: null as File | null });

    const [showPromote, setShowPromote] = useState(false);
    const [promoteLoading, setPromoteLoading] = useState(false);
    const [promoteForm, setPromoteForm] = useState({ fromYear: getCurrentAcademicYear(), toYear: '' });
    const [promoteResult, setPromoteResult] = useState<any>(null);

    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState<{ total: number; current: number; text: string } | null>(null);

    const [showProfileStudent, setShowProfileStudent] = useState<Student | null>(null);

    // Filter & Pagination State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [yearFilter, setYearFilter] = useState(getCurrentAcademicYear());
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState(1);

    const debouncedSearch = useMemo(
        () => debounce((value) => {
            setSearch(value);
            setPage(1);
        }, 500),
        []
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        debouncedSearch(e.target.value);
    };

    // Data Fetching
    const { data, isLoading } = useQuery<StudentListResponse>({
        queryKey: ['students', page, classFilter, yearFilter, search],
        queryFn: async () => {
            const params: any = { page, limit: 50 };
            if (classFilter) params.class = classFilter;
            if (yearFilter) params.academicYear = yearFilter;
            if (search) params.search = search;
            const res = await API.get('/students', { params });
            return res.data;
        }
    });

    const students = data?.students || [];
    const totalPages = data?.pages || 1;
    const totalStudents = data?.total || 0;

    const sortedStudents = useMemo(() => {
        return [...students].sort((a: any, b: any) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return -1 * sortDir;
            if (valA > valB) return 1 * sortDir;
            return 0;
        });
    }, [students, sortField, sortDir]);

    // Handlers
    const toggleSort = (field: string) => {
        if (sortField === field) setSortDir(d => -d);
        else { setSortField(field); setSortDir(1); }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormErrors({});
        try {
            if (editStudent) {
                await API.put(`/students/${editStudent._id}`, formData);
                toast.success('Student updated successfully');
            } else {
                await API.post('/students', formData);
                toast.success('Student added successfully');
            }
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
                const firstError = Object.values(err.response.data.errors)[0] as string;
                if (firstError) toast.error(firstError);
            } else {
                toast.error(err.response?.data?.message || 'Action failed');
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return toast.error('Enter valid amount');
        setPaymentLoading(true);
        try {
            const res = await API.post(`/students/${showPayment?._id}/payments`, paymentForm);
            toast.success('Payment recorded');
            if (res.data.payment) {
                generateFeeReceiptPDF(res.data.student, res.data.payment, settings);
            }
            setShowPayment(null);
            queryClient.invalidateQueries({ queryKey: ['students'] });

            addNotification({
                title: 'Payment Received',
                message: `₹${paymentForm.amount} received from ${showPayment?.name} for ${paymentForm.feeType} fee.`,
                type: 'payment'
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment failed');
        } finally {
            setPaymentLoading(false);
        }
    };

    const openHistory = async (student: Student) => {
        setShowHistory(student);
        try {
            const res = await API.get(`/students/${student._id}/payments`);
            setHistoryData(res.data);
        } catch {
            toast.error('Failed to load history');
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await API.delete(`/students/${showDeleteConfirm._id}`);
            toast.success('Student deleted');
            setShowDeleteConfirm(null);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch {
            toast.error('Delete failed');
        }
    };

    const handleBulkDelete = async () => {
        setBulkDeleteLoading(true);
        const tid = toast.loading(`Deleting ${selectedStudents.length} students...`);
        try {
            await API.post('/students/bulk-delete', { studentIds: selectedStudents });
            toast.success('Bulk delete successful', { id: tid });
            setSelectedStudents([]);
            setShowBulkDeleteConfirm(false);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Bulk delete failed', { id: tid });
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    const handleWhatsApp = (s: Student) => {
        if (!s.parentPhone || s.parentPhone.trim() === '') {
            toast.error('No phone number found');
            return;
        }
        const cleanPhone = s.parentPhone.replace(/\D/g, '');
        const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const msg = `Dear ${s.parentName},\nThis is a reminder from the school that ${s.name}'s pending fee is ₹${s.pendingAmount}. Please arrange payment.\nThank you!`;
        window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handlePromote = async () => {
        setPromoteLoading(true);
        try {
            const res = await API.post('/students/promote', promoteForm);
            setPromoteResult(res.data);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification({
                title: 'Students Promoted',
                message: `Promotion process completed for ${promoteForm.fromYear} to ${promoteForm.toYear}.`,
                type: 'promotion'
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Promotion failed');
        } finally {
            setPromoteLoading(false);
        }
    };

    const openEditPayment = (p: any) => {
        setEditPaymentTarget({ studentId: showHistory?._id, payment: p });
        setEditPaymentForm({
            amount: p.amount.toString(),
            paymentDate: p.paymentDate.split('T')[0],
            paymentMode: p.paymentMode,
            remarks: p.remarks || ''
        });
    };

    const handleEditPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditPaymentLoading(true);
        try {
            await API.put(`/students/${editPaymentTarget.studentId}/payments/${editPaymentTarget.payment._id}`, editPaymentForm);
            toast.success('Payment updated');
            setEditPaymentTarget(null);
            if (showHistory) openHistory(showHistory);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setEditPaymentLoading(false);
        }
    };

    const confirmDeletePayment = async () => {
        if (!showDeletePaymentConfirm || !showHistory) return;
        try {
            await API.delete(`/students/${showHistory._id}/payments/${showDeletePaymentConfirm}`);
            toast.success('Payment deleted');
            setShowDeletePaymentConfirm(null);
            openHistory(showHistory);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="students-page">
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <div className="filters-bar">
                        <div className="search-bar" style={{ minWidth: 220 }}>
                            <MdSearch className="search-icon" />
                            <input
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <select
                            className="form-control"
                            style={{ width: 130 }}
                            value={classFilter}
                            onChange={e => { setClassFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Classes</option>
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            className="form-control"
                            style={{ width: 130 }}
                            value={yearFilter}
                            onChange={e => { setYearFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Years</option>
                            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="btn-group">
                        {selectedStudents.length > 0 && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-success" onClick={() => toast.success('Sent bulk reminders!')}>
                                    <FaWhatsapp /> Send {selectedStudents.length} Reminders
                                </button>
                                <button className="btn btn-danger" onClick={() => setShowBulkDeleteConfirm(true)}>
                                    Delete {selectedStudents.length}
                                </button>
                            </div>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => exportStudentsExcel(students)}>
                            <MdTableChart /> Excel
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => exportStudentsPDF(sortedStudents, settings)}>
                            <MdPictureAsPdf /> PDF
                        </button>
                        {(isAdmin || isOwner) && (
                            <button className="btn btn-sm btn-warning" onClick={() => { setPromoteResult(null); setShowPromote(true); }}>
                                🎓 Promote
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => { setEditStudent(null); setFormData(emptyStudent); setShowForm(true); }}>
                            <MdAdd /> Add Student
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                            Bulk Import
                        </button>
                    </div>
                </div>
                <div style={{ padding: '8px 24px', fontSize: 13, color: '#6b7280' }}>
                    Showing <strong>{(page - 1) * 50 + 1} - {(page - 1) * 50 + students.length}</strong> of <strong>{totalStudents}</strong> students
                </div>
            </div>

            <div className="card">
                <StudentTable
                    students={sortedStudents}
                    isLoading={isLoading}
                    selectedStudents={selectedStudents}
                    onSelect={(id) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    onSelectAll={() => setSelectedStudents(selectedStudents.length === students.length ? [] : students.map(s => s._id))}
                    onEdit={(s) => { setEditStudent(s); setFormData({ ...s as any }); setShowForm(true); }}
                    onDelete={(s) => setShowDeleteConfirm(s)}
                    onRecordPayment={(s) => setShowPayment(s)}
                    onViewHistory={openHistory}
                    onViewProfile={(s) => setShowProfileStudent(s)}
                    onWhatsApp={handleWhatsApp}
                    sortField={sortField}
                    sortDir={sortDir}
                    toggleSort={toggleSort}
                />

                {totalPages > 1 && (
                    <div className="pagination">
                        <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                        <span className="pagination-info">Page <strong>{page}</strong> of {totalPages}</span>
                        <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <StudentForm
                show={showForm}
                editStudent={editStudent}
                formData={formData}
                formErrors={formErrors}
                formLoading={formLoading}
                onClose={() => setShowForm(false)}
                onSubmit={handleFormSubmit}
                setFormData={setFormData}
                classes={CLASSES}
            />

            <PaymentModal
                show={showPayment}
                paymentForm={paymentForm}
                paymentLoading={paymentLoading}
                paymentModes={PAYMENT_MODES}
                onClose={() => setShowPayment(null)}
                onSubmit={handlePayment}
                setPaymentForm={setPaymentForm}
            />

            <PaymentHistoryModal
                show={showHistory}
                historyData={historyData}
                isOwner={isOwner}
                settings={settings}
                onClose={() => { setShowHistory(null); setHistoryData(null); }}
                onDownload={generateFeeReceiptPDF}
                onEdit={openEditPayment}
                onDelete={setShowDeletePaymentConfirm}
            />

            <EditPaymentModal
                show={editPaymentTarget}
                editForm={editPaymentForm}
                loading={editPaymentLoading}
                paymentModes={PAYMENT_MODES}
                onClose={() => setEditPaymentTarget(null)}
                onFormChange={setEditPaymentForm}
                onSubmit={handleEditPayment}
            />

            <BulkImportModal
                show={showImportModal}
                importForm={importForm}
                importLoading={importLoading}
                classes={CLASSES}
                academicYears={ACADEMIC_YEARS}
                onClose={() => setShowImportModal(false)}
                onFileChange={(file) => setImportForm(prev => ({ ...prev, file }))}
                onFormChange={(field, value) => setImportForm(prev => ({ ...prev, [field]: value }))}
                onImport={async () => {
                    setImportLoading(true);
                    const fd = new FormData();
                    if (importForm.file) fd.append('file', importForm.file);
                    fd.append('class', importForm.class);
                    fd.append('academicYear', importForm.academicYear);
                    try {
                        await API.post('/students/import', fd);
                        toast.success('Import complete');
                        setShowImportModal(false);
                        queryClient.invalidateQueries({ queryKey: ['students'] });
                    } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Import failed');
                    } finally {
                        setImportLoading(false);
                    }
                }}
            />

            <PromoteModal
                show={showPromote}
                promoteLoading={promoteLoading}
                promoteResult={promoteResult}
                promoteForm={promoteForm}
                academicYears={ACADEMIC_YEARS}
                onClose={() => setShowPromote(false)}
                onFormChange={(f, v) => setPromoteForm(prev => ({ ...prev, [f]: v }))}
                onPromote={handlePromote}
            />

            <DeleteConfirmModal
                show={showDeleteConfirm}
                title="Deactivate Student"
                message={`Are you sure you want to deactivate ${showDeleteConfirm?.name}?`}
                confirmText="Yes, Deactivate"
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDelete}
            />

            <DeleteConfirmModal
                show={showDeletePaymentConfirm}
                title="Delete Payment"
                message="This will permanently delete the payment record. This cannot be undone."
                confirmText="Yes, Delete"
                onClose={() => setShowDeletePaymentConfirm(null)}
                onConfirm={confirmDeletePayment}
            />

            <DeleteConfirmModal
                show={showBulkDeleteConfirm}
                title="Bulk Delete"
                message={`Are you sure you want to delete ${selectedStudents.length} students?`}
                confirmText="Delete All Selected"
                loading={bulkDeleteLoading}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
            />

            <AnimatePresence>
                {showProfileStudent && (
                    <StudentProfile
                        student={showProfileStudent}
                        settings={settings}
                        onClose={() => setShowProfileStudent(null)}
                    />
                )}
            </AnimatePresence>

            {bulkProgress && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal glass" style={{ maxWidth: 400, textAlign: 'center', padding: 30 }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }} />
                        <h3>{bulkProgress.text}</h3>
                        <div style={{ margin: '20px 0', background: '#e2e8f0', borderRadius: 10, height: 10, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                style={{ height: '100%', background: 'var(--primary)' }}
                            />
                        </div>
                        <p>{bulkProgress.current} of {bulkProgress.total} processed</p>
                    </div>
                </div>
            )}
        </div>
    );
}
