import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
    MdAdd, MdSearch, MdPerson,
    MdFileDownload, MdPictureAsPdf, MdTrendingUp, MdUploadFile, MdPersonAdd, MdKeyboardArrowDown
} from 'react-icons/md';
import { FaWhatsapp, FaFileExcel, FaFilePdf, FaFileImport } from 'react-icons/fa';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import StudentTable from '../components/students/StudentTable';
import StudentCards from '../components/students/StudentCards';
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

function DropDown({ value, onChange, options, width }: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    width: number;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value) || options[0];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="form-control"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#fff', textAlign: 'left' }}
            >
                <span>{selected.label}</span>
                <MdKeyboardArrowDown style={{ fontSize: 18, color: '#64748b', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }} />
            </button>
            {open && (
                <div className="dropdown-menu-list" style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 999,
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '100%',
                    maxHeight: 240, overflowY: 'auto', marginTop: 4
                }}>
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            style={{
                                padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                                background: opt.value === value ? 'var(--primary)' : '#fff',
                                color: opt.value === value ? '#fff' : '#1e293b',
                                transition: 'background 0.1s'
                            }}
                            onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLDivElement).style.background = '#f1f5f9'; }}
                            onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLDivElement).style.background = '#fff'; }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

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
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [sortField, setSortField] = useState('rollNo');
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
        queryKey: ['students', page, classFilter, yearFilter, search, statusFilter],
        queryFn: async () => {
            const params: any = { page, limit: 50 };
            if (classFilter) params.class = classFilter;
            if (yearFilter) params.academicYear = yearFilter;
            if (search) params.search = search;
            if (statusFilter) params.tuitionStatus = statusFilter;
            const res = await API.get('/students', { params });
            return res.data;
        }
    });

    const students = data?.students || [];
    const totalPages = data?.pages || 1;
    const totalStudents = data?.total || 0;

    const sortedStudents = useMemo(() => {
        const classOrder = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
        return [...students].sort((a: any, b: any) => {
            if (sortField === 'rollNo') {
                const classA = classOrder.indexOf(a.class);
                const classB = classOrder.indexOf(b.class);
                if (classA !== classB) return (classA - classB) * sortDir;
                return (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true }) * sortDir;
            }
            if (sortField === 'class') {
                const classA = classOrder.indexOf(a.class);
                const classB = classOrder.indexOf(b.class);
                if (classA !== classB) return (classA - classB) * sortDir;
                return (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true }) * sortDir;
            }
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

    const handleSelect = (id: string) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === sortedStudents.length && sortedStudents.length > 0) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(sortedStudents.map(s => s._id));
        }
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

            {/* ══ DESKTOP ONLY: new header + filter card ══ */}
            <div className="desktop-only" style={{ background: '#f9cb5b', margin: '-28px -28px 0 -28px', padding: '28px 28px 70px 28px', borderRadius: '0 0 1% 1% / 0 0 8px 8px', position: 'relative' }}>
                {/* ── Page Header ── */}
                <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flexShrink: 0 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', margin: 0, letterSpacing: '-0.5px' }}>Student Directory</h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4a3f00' }}>Manage and monitor student records across all academic years.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        {selectedStudents.length > 0 && (
                            <>
                                <button className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => toast.success('Sent bulk reminders!')}>
                                    <FaWhatsapp /> Send {selectedStudents.length} Reminders
                                </button>
                                <button className="btn btn-danger" onClick={() => setShowBulkDeleteConfirm(true)}>
                                    Delete {selectedStudents.length}
                                </button>
                            </>
                        )}
                        {(isAdmin || isOwner) && (
                            <button
                                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 20px', fontSize: 14, fontWeight: 700, borderRadius: 22, border: 'none', background: '#fff', color: '#1a1a1a', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.15s' }}
                                onClick={() => { setPromoteResult(null); setShowPromote(true); }}
                            >
                                <MdTrendingUp style={{ fontSize: 18 }} /> Promote
                            </button>
                        )}
                        <button
                            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 20px', fontSize: 14, fontWeight: 700, borderRadius: 22, border: 'none', background: '#242f8c', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}
                            onClick={() => setShowImportModal(true)}
                        >
                            <MdUploadFile style={{ fontSize: 16 }} /> Bulk Import
                        </button>
                        <button
                            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 20px', fontSize: 14, fontWeight: 700, borderRadius: 22, border: 'none', background: '#242f8c', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}
                            onClick={() => { setEditStudent(null); setFormData(emptyStudent); setShowForm(true); }}
                        >
                            <MdPersonAdd style={{ fontSize: 16 }} /> Add Student
                        </button>
                    </div>
                </div>
            </div>{/* end desktop-only header */}

            {/* ── Merged: Filters + Tabs + Table Card ── */}
            <div className="card" style={{ marginBottom: 20, marginTop: -50, padding: 0, overflow: 'visible', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '16px 16px', borderBottom: '1px solid #f1f5f9', overflow: 'visible', position: 'relative', zIndex: 100 }}>
                        <div className="search-bar" style={{ flex: '1 1 240px', minWidth: 200 }}>
                            <MdSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search students by name, ID, or class..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <DropDown
                            value={classFilter}
                            onChange={v => { setClassFilter(v); setPage(1); }}
                            options={[{ label: 'All Classes', value: '' }, ...CLASSES.map(c => ({ label: c, value: c }))]}
                            width={160}
                        />
                        <DropDown
                            value={yearFilter}
                            onChange={v => { setYearFilter(v); setPage(1); }}
                            options={[{ label: 'All Years', value: '' }, ...ACADEMIC_YEARS.map(y => ({ label: y, value: y }))]}
                            width={140}
                        />
                        <div className="desktop-only" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="btn btn-secondary btn-sm" disabled={isLoading}
                                onClick={async () => { const t = toast.loading('Preparing Excel...'); try { const params: any = { limit: 1000 }; if (classFilter) params.class = classFilter; if (yearFilter) params.academicYear = yearFilter; if (search) params.search = search; const res = await API.get('/students', { params }); exportStudentsExcel(res.data.students); toast.success('Excel exported!', { id: t }); } catch { toast.error('Export failed', { id: t }); } }}>
                                <MdFileDownload /> Excel
                            </button>
                            <button className="btn btn-secondary btn-sm" disabled={isLoading}
                                onClick={async () => { const t = toast.loading('Preparing PDF...'); try { const params: any = { limit: 1000 }; if (classFilter) params.class = classFilter; if (yearFilter) params.academicYear = yearFilter; if (search) params.search = search; const res = await API.get('/students', { params }); exportStudentsPDF(res.data.students, settings); toast.success('PDF exported!', { id: t }); } catch { toast.error('Export failed', { id: t }); } }}>
                                <MdPictureAsPdf /> PDF
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 8px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                            {[{ label: 'All Students', value: '' }, { label: 'Paid', value: 'paid' }, { label: 'Partial', value: 'partial' }, { label: 'Unpaid', value: 'unpaid' }].map(tab => (
                                <button
                                    key={tab.value}
                                    onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                                    style={{
                                        padding: '8px 16px', fontSize: 13, fontWeight: statusFilter === tab.value ? 700 : 500,
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        borderBottom: statusFilter === tab.value ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: statusFilter === tab.value ? 'var(--primary)' : '#64748b',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', paddingRight: 8 }}>
                            Showing <strong style={{ color: '#0f172a' }}>{(page - 1) * 50 + 1} – {(page - 1) * 50 + students.length}</strong> of <strong style={{ color: '#0f172a' }}>{totalStudents}</strong> students
                        </div>
                    </div>
                    <div className="desktop-only">
                        <StudentTable
                            students={sortedStudents}
                            isLoading={isLoading}
                            selectedStudents={selectedStudents}
                            onSelect={handleSelect}
                            onSelectAll={handleSelectAll}
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
                    </div>
                    <div className="mobile-only">
                        {/* Mobile filter toolbar */}
                        <div className="card-header" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <div className="filters-bar">
                                <div className="search-bar" style={{ minWidth: 220 }}>
                                    <MdSearch className="search-icon" />
                                    <input placeholder="Search students..." value={searchTerm} onChange={handleSearchChange} />
                                </div>
                                <select className="form-control" style={{ width: 130 }} value={classFilter}
                                    onChange={e => { setClassFilter(e.target.value); setPage(1); }}>
                                    <option value="">All Classes</option>
                                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select className="form-control" style={{ width: 130 }} value={yearFilter}
                                    onChange={e => { setYearFilter(e.target.value); setPage(1); }}>
                                    <option value="">All Years</option>
                                    {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="btn-group">
                                {selectedStudents.length > 0 && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-success btn-sm" onClick={() => toast.success('Sent bulk reminders!')}><FaWhatsapp /> {selectedStudents.length} Reminders</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => setShowBulkDeleteConfirm(true)}>Delete {selectedStudents.length}</button>
                                    </div>
                                )}
                                <button className="btn btn-secondary btn-sm" disabled={isLoading}
                                    onClick={async () => { const t = toast.loading('Preparing Excel...'); try { const params: any = { limit: 1000 }; if (classFilter) params.class = classFilter; if (yearFilter) params.academicYear = yearFilter; if (search) params.search = search; const res = await API.get('/students', { params }); exportStudentsExcel(res.data.students); toast.success('Excel exported!', { id: t }); } catch { toast.error('Export failed', { id: t }); } }}>
                                    <FaFileExcel /> Excel
                                </button>
                                <button className="btn btn-secondary btn-sm" disabled={isLoading}
                                    onClick={async () => { const t = toast.loading('Preparing PDF...'); try { const params: any = { limit: 1000 }; if (classFilter) params.class = classFilter; if (yearFilter) params.academicYear = yearFilter; if (search) params.search = search; const res = await API.get('/students', { params }); exportStudentsPDF(res.data.students, settings); toast.success('PDF exported!', { id: t }); } catch { toast.error('Export failed', { id: t }); } }}>
                                    <FaFilePdf /> PDF
                                </button>
                                {(isAdmin || isOwner) && (
                                    <button className="btn btn-sm btn-warning" onClick={() => { setPromoteResult(null); setShowPromote(true); }}><MdTrendingUp /> Promote</button>
                                )}
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)}><MdUploadFile /> Bulk Import</button>
                                <button className="btn btn-primary btn-sm students-add-btn" onClick={() => { setEditStudent(null); setFormData(emptyStudent); setShowForm(true); }}><MdAdd /> Add Student</button>
                            </div>
                        </div>
                        <div style={{ padding: '6px 16px', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
                            Showing <strong>{(page - 1) * 50 + 1} – {(page - 1) * 50 + students.length}</strong> of <strong>{totalStudents}</strong> students
                        </div>
                        <StudentCards
                            students={sortedStudents}
                            isLoading={isLoading}
                            onEdit={(s) => { setEditStudent(s); setFormData({ ...s as any }); setShowForm(true); }}
                            onDelete={(s) => setShowDeleteConfirm(s)}
                            onRecordPayment={(s) => setShowPayment(s)}
                            onViewHistory={openHistory}
                            onViewProfile={(s) => setShowProfileStudent(s)}
                            onWhatsApp={handleWhatsApp}
                        />
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderRadius: '0 0 16px 16px' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                style={{ fontWeight: 700 }}
                            >Previous</button>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    const pages: (number | '...')[] = [];
                                    if (totalPages <= 7) return i + 1;
                                    if (i < 3) return i + 1;
                                    if (i === 3) return '...';
                                    return totalPages - (6 - i);
                                }).map((p, i) =>
                                    p === '...' ? (
                                        <span key={i} style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
                                    ) : (
                                        <button
                                            key={i}
                                            onClick={() => setPage(p as number)}
                                            style={{
                                                width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                                                fontWeight: 700, fontSize: 13,
                                                background: page === p ? 'var(--primary)' : 'transparent',
                                                color: page === p ? '#fff' : '#475569',
                                                transition: 'all 0.15s'
                                            }}
                                        >{p}</button>
                                    )
                                )}
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                style={{ fontWeight: 700 }}
                            >Next</button>
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