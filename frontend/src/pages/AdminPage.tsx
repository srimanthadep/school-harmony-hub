import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
    MdAdd, MdEdit, MdSecurity, MdClose, MdAdminPanelSettings,
    MdLockOutline, MdDelete, MdRestore, MdUndo, MdPeople,
    MdHistory, MdShield, MdVerifiedUser, MdFilterList, MdDownload, MdTimeline
} from 'react-icons/md';

const S = {
    page: {
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: '#1c232f',
        minHeight: '100vh',
        background: '#f5f6fa',
    },
    /* ── Top header bar ── */
    header: {
        background: 'linear-gradient(135deg, #1c232f 0%, #2d3748 100%)',
        borderRadius: 12,
        padding: 'clamp(12px, 4vw, 20px) clamp(16px, 4vw, 28px)',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(28,35,47,0.25)',
        gap: 16
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    headerIcon: {
        width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg,#7267ef,#4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        boxShadow: '0 4px 12px rgba(114,103,239,0.4)',
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 },
    headerSub: { color: '#adb5c3', fontSize: 13, margin: '2px 0 0' },
    badge: {
        background: 'rgba(114,103,239,0.18)', color: '#a89bf5',
        border: '1px solid rgba(114,103,239,0.3)',
        borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6,
    },
    /* ── Stats row ── */
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 },
    statCard: (accent) => ({
        background: '#fff', borderRadius: 12, padding: 'clamp(12px, 4vw, 20px) clamp(16px, 4vw, 24px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${accent}`,
        display: 'flex', alignItems: 'center', gap: 16,
    }),
    statIcon: (accent) => ({
        width: 44, height: 44, borderRadius: 10,
        background: accent + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, color: accent,
    }),
    statVal: { fontSize: 26, fontWeight: 800, color: '#1c232f', lineHeight: 1 },
    statLabel: { fontSize: 12, color: '#8996a4', marginTop: 3, fontWeight: 500 },
    /* ── Tab strip ── */
    tabStrip: {
        background: '#fff', borderRadius: 12,
        padding: '0 12px', marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex', gap: 4,
        overflowX: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
    },
    tab: (active) => ({
        padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
        borderBottom: active ? '3px solid #7267ef' : '3px solid transparent',
        color: active ? '#7267ef' : '#8996a4',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
    }),
    /* ── Card ── */
    card: {
        background: '#fff', borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
    },
    cardHeader: {
        padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        alignItems: 'center',
        borderBottom: '1px solid #edf2f7',
        gap: 12
    },
    cardTitle: { fontSize: 15, fontWeight: 700, color: '#1c232f', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
    /* ── Table ── */
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        padding: '11px 16px', textAlign: 'left',
        fontSize: 11, fontWeight: 700, color: '#8996a4',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        background: '#f8f9fc', borderBottom: '1px solid #edf2f7',
    },
    td: {
        padding: '13px 16px', fontSize: 13, color: '#3e4853',
        borderBottom: '1px solid #f0f3f8',
    },
    trHover: { transition: 'background 0.15s' },
    /* ── Buttons ── */
    btnPrimary: {
        background: 'linear-gradient(135deg,#7267ef,#4f46e5)', color: '#fff',
        border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
        fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(114,103,239,0.35)',
    },
    btnSuccess: {
        background: 'linear-gradient(135deg,#17c666,#0fa854)', color: '#fff',
        border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
        fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'inherit',
    },
    btnDanger: {
        background: 'linear-gradient(135deg,#ea4d4d,#c0392b)', color: '#fff',
        border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'inherit',
    },
    btnEdit: {
        background: 'linear-gradient(135deg,#7267ef,#4f46e5)', color: '#fff',
        border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'inherit',
    },
    btnSecondary: {
        background: '#f0f3f8', color: '#5b6b79',
        border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'inherit',
    },
    btnIcon: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#ea4d4d', fontSize: 18, padding: 4, borderRadius: 6, display: 'flex',
    },
    /* ── Badges ── */
    pill: (color, bg) => ({
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: bg, color, borderRadius: 20, padding: '3px 10px',
        fontSize: 11, fontWeight: 700,
    }),
    /* ── Role select ── */
    select: {
        border: '1px solid #dbe0e5', borderRadius: 7, padding: '5px 10px',
        fontSize: 13, color: '#3e4853', background: '#f8f9fc',
        fontFamily: 'inherit', cursor: 'pointer',
    },
    /* ── Modal ── */
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(28,35,47,0.55)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
    },
    modal: {
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(28,35,47,0.3)', overflow: 'hidden',
    },
    modalHead: {
        background: 'linear-gradient(135deg,#1c232f,#2d3748)',
        padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    modalTitle: { color: '#fff', fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
    modalClose: { background: 'none', border: 'none', color: '#adb5c3', cursor: 'pointer', fontSize: 22, lineHeight: 1 },
    modalBody: { padding: 24 },
    modalFoot: { padding: '16px 24px', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'flex-end', gap: 10 },
    formGroup: { marginBottom: 16 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#5b6b79', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: {
        width: '100%', border: '1px solid #dbe0e5', borderRadius: 8, padding: '9px 12px',
        fontSize: 14, color: '#1c232f', background: '#f8f9fc', boxSizing: 'border-box',
        fontFamily: 'inherit', outline: 'none',
    },
    /* ── Reverted stamp ── */
    revertedStamp: {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        color: '#17c666', fontSize: 12, fontWeight: 700,
    },
};

const ROLE_COLORS = {
    owner: ['#7267ef', '#f0eeff'],
    admin: ['#e67e22', '#fef6ec'],
    staff: ['#3ec9d6', '#e8fafc'],
    student: ['#17c666', '#e5fcf1'],
};

function RolePill({ role }) {
    const [c, bg] = ROLE_COLORS[role] || ['#8996a4', '#f0f3f8'];
    return <span style={S.pill(c, bg)}>{role}</span>;
}

function StatusBadge({ active }) {
    return active
        ? <span style={S.pill('#17c666', '#e5fcf1')}>● Active</span>
        : <span style={S.pill('#ea4d4d', '#fde8e8')}>○ Inactive</span>;
}

const RECORD_TYPE_COLORS = {
    User: ['#7267ef', '#f0eeff'],
    Student: ['#3ec9d6', '#e8fafc'],
    Staff: ['#e67e22', '#fef6ec'],
    'Fee Payment': ['#17c666', '#e5fcf1'],
    'Salary Payment': ['#ffa21d', '#fff8ec'],
    Leave: ['#9b59b6', '#f5eeff'],
};

function TypeBadge({ type }) {
    const [c, bg] = RECORD_TYPE_COLORS[type] || ['#8996a4', '#f0f3f8'];
    return <span style={S.pill(c, bg)}>{type}</span>;
}

function getActionColors(action: string): [string, string] {
    if (action === 'LOGIN') return ['#17c666', '#e5fcf1'];
    if (action.startsWith('DELETE')) return ['#ea4d4d', '#fde8e8'];
    if (action.startsWith('CREATE')) return ['#3ec9d6', '#e8fafc'];
    return ['#7267ef', '#f0eeff'];
}

export default function AdminPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'staff' });
    const [showPasswordModal, setShowPasswordModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showEditForm, setShowEditForm] = useState(null);
    const [editUserForm, setEditUserForm] = useState({ name: '', email: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [hoveredRow, setHoveredRow] = useState(null);

    // Activity Logs state
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logFilters, setLogFilters] = useState({ action: '', module: '', startDate: '', endDate: '' });
    const [logPage, setLogPage] = useState(1);
    const [logTotal, setLogTotal] = useState(0);
    const LOG_LIMIT = 50;

    useEffect(() => {
        if (user?.email === 'srimanthadep@gmail.com') {
            fetchUsers();
            fetchHistory();
            if (activeTab === 'logs') fetchActivityLogs();
        }
    }, [user, activeTab]);

    const fetchUsers = async () => {
        if (activeTab !== 'users') return;
        setLoading(true);
        try {
            const res = await API.get('/auth/users');
            setUsers(res.data.users);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    const fetchHistory = async () => {
        if (activeTab !== 'history') return;
        setLoadingHistory(true);
        try {
            const res = await API.get('/auth/deleted-history');
            setHistory(res.data.records);
        } catch { toast.error('Failed to load history log'); }
        finally { setLoadingHistory(false); }
    };

    const fetchActivityLogs = async (page = logPage, filters = logFilters) => {
        setLoadingLogs(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(LOG_LIMIT) });
            if (filters.action) params.append('action', filters.action);
            if (filters.module) params.append('module', filters.module);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            const res = await API.get(`/activity-logs?${params.toString()}`);
            setActivityLogs(res.data.logs);
            setLogTotal(res.data.total);
        } catch { toast.error('Failed to load activity logs'); }
        finally { setLoadingLogs(false); }
    };

    const exportActivityLogs = async () => {
        try {
            const params = new URLSearchParams();
            if (logFilters.action) params.append('action', logFilters.action);
            if (logFilters.module) params.append('module', logFilters.module);
            if (logFilters.startDate) params.append('startDate', logFilters.startDate);
            if (logFilters.endDate) params.append('endDate', logFilters.endDate);
            const token = localStorage.getItem('sfm_token');
            const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
            const url = `${baseURL}/activity-logs/export?${params.toString()}`;
            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) { toast.error('Export failed'); return; }
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'activity-logs.csv';
            a.click();
            URL.revokeObjectURL(a.href);
        } catch { toast.error('Export failed'); }
    };

    const handleAddUser = async (e) => {
        e.preventDefault(); setFormLoading(true);
        try {
            await API.post('/auth/users', newUserForm);
            toast.success('User created successfully');
            setShowAddForm(false);
            setNewUserForm({ name: '', email: '', password: '', role: 'staff' });
            fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
        finally { setFormLoading(false); }
    };

    const handleRoleChange = async (userId, newRole) => {
        try { await API.put(`/auth/users/${userId}/role`, { role: newRole }); toast.success('Role updated'); fetchUsers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); fetchUsers(); }
    };

    const handleStatusToggle = async (userId, current) => {
        try { await API.put(`/auth/users/${userId}/status`, { isActive: !current }); toast.success(`User ${!current ? 'activated' : 'deactivated'}`); fetchUsers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
        try { await API.put(`/auth/users/${showPasswordModal._id}/password`, { password: newPassword }); toast.success('Password updated'); setShowPasswordModal(null); setNewPassword(''); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleEditUser = async (e) => {
        e.preventDefault(); setFormLoading(true);
        try { await API.put(`/auth/users/${showEditForm._id}`, editUserForm); toast.success('User updated'); setShowEditForm(null); fetchUsers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setFormLoading(false); }
    };

    const handleDeleteUser = async () => {
        try { await API.delete(`/auth/users/${showDeleteConfirm._id}`); toast.success('User deleted'); setShowDeleteConfirm(null); fetchUsers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleRevertDelete = async (id) => {
        try { await API.post(`/auth/deleted-history/${id}/revert`); toast.success('Record reverted successfully'); fetchHistory(); fetchUsers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed to revert record'); }
    };

    const handleUndoRevert = async (id) => {
        try { await API.post(`/auth/deleted-history/${id}/undo-revert`); toast.success('Revert undone successfully'); fetchHistory(); fetchUsers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed to undo revert'); }
    };

    const renderRecordDetails = ({ recordType, data }) => {
        if (!data) return <span style={{ color: '#8996a4' }}>—</span>;
        switch (recordType) {
            case 'Student': return <><div style={{ fontWeight: 700 }}>{data.name}</div><div style={{ fontSize: 11, color: '#8996a4' }}>Class: {data.class || '—'} · Roll: {data.rollNo || '—'}</div></>;
            case 'Staff': return <><div style={{ fontWeight: 700 }}>{data.name}</div><div style={{ fontSize: 11, color: '#8996a4' }}>Role: {data.role || '—'}</div></>;
            case 'User': return <><div style={{ fontWeight: 700 }}>{data.name}</div><div style={{ fontSize: 11, color: '#8996a4' }}>{data.email} · {data.role}</div></>;
            case 'Fee Payment': return <><div style={{ fontWeight: 700 }}>₹{data.amount}</div><div style={{ fontSize: 11, color: '#8996a4' }}>Receipt: {data.receiptNo || '—'}</div></>;
            case 'Salary Payment': return <><div style={{ fontWeight: 700 }}>₹{data.amount}</div><div style={{ fontSize: 11, color: '#8996a4' }}>Slip: {data.slipNo || '—'}</div></>;
            case 'Leave': return <><div style={{ fontWeight: 700 }}>Leave</div><div style={{ fontSize: 11, color: '#8996a4' }}>{new Date(data.date).toLocaleDateString()}</div></>;
            default: return <span style={{ color: '#8996a4' }}>—</span>;
        }
    };

    /* Access denied */
    if (user?.email !== 'srimanthadep@gmail.com') {
        return (
            <div style={{ ...S.card, padding: 60, textAlign: 'center', marginTop: 40 }}>
                <MdSecurity style={{ fontSize: 56, color: '#ea4d4d', marginBottom: 16 }} />
                <h3 style={{ color: '#1c232f', marginBottom: 8 }}>Access Denied</h3>
                <p style={{ color: '#8996a4', maxWidth: 360, margin: '0 auto' }}>This area is strictly restricted to the Super Admin.</p>
            </div>
        );
    }

    const activeUsers = users.filter(u => u.isActive).length;
    const revertedCount = history.filter(r => r.reverted).length;

    return (
        <div style={S.page}>

            {/* ── Header ── */}
            <div style={S.header}>
                <div style={S.headerLeft}>
                    <div style={S.headerIcon}><MdShield color="#fff" /></div>
                    <div>
                        <h2 style={S.headerTitle}>Super Admin Control Panel</h2>
                        <p style={S.headerSub}>Full operational control of user accounts and global system history</p>
                    </div>
                </div>
                <div style={S.badge}><MdVerifiedUser size={14} /> Super Admin Access</div>
            </div>

            {/* ── Stats ── */}
            <div style={S.statsRow}>
                <div style={S.statCard('#7267ef')}>
                    <div style={S.statIcon('#7267ef')}><MdPeople /></div>
                    <div><div style={S.statVal}>{users.length}</div><div style={S.statLabel}>Total Users</div></div>
                </div>
                <div style={S.statCard('#17c666')}>
                    <div style={S.statIcon('#17c666')}><MdVerifiedUser /></div>
                    <div><div style={S.statVal}>{activeUsers}</div><div style={S.statLabel}>Active Accounts</div></div>
                </div>
                <div style={S.statCard('#e67e22')}>
                    <div style={S.statIcon('#e67e22')}><MdHistory /></div>
                    <div><div style={S.statVal}>{history.length}</div><div style={S.statLabel}>Deletion Logs</div></div>
                </div>
                <div style={S.statCard('#3ec9d6')}>
                    <div style={S.statIcon('#3ec9d6')}><MdRestore /></div>
                    <div><div style={S.statVal}>{revertedCount}</div><div style={S.statLabel}>Records Reverted</div></div>
                </div>
                <div style={S.statCard('#9b59b6')}>
                    <div style={S.statIcon('#9b59b6')}><MdTimeline /></div>
                    <div><div style={S.statVal}>{logTotal}</div><div style={S.statLabel}>Activity Events</div></div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div style={S.tabStrip}>
                <button style={S.tab(activeTab === 'users')} onClick={() => setActiveTab('users')}>
                    <MdPeople /> User Accounts
                </button>
                <button style={S.tab(activeTab === 'history')} onClick={() => setActiveTab('history')}>
                    <MdHistory /> Deletion Audit Stack
                </button>
                <button style={S.tab(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
                    <MdTimeline /> Activity Logs
                </button>
            </div>

            {/* ── Content card ── */}
            <div style={S.card}>
                {activeTab === 'users' ? (
                    <>
                        <div style={S.cardHeader}>
                            <span style={S.cardTitle}><MdPeople color="#7267ef" /> Registered Users</span>
                            <button style={S.btnPrimary} onClick={() => setShowAddForm(true)}>
                                <MdAdd /> Add User
                            </button>
                        </div>
                        {loading ? (
                            <div style={{ padding: 48, textAlign: 'center', color: '#8996a4' }}>Loading…</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={S.table}>
                                    <thead>
                                        <tr>
                                            {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                                                <th key={h} style={S.th}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id}
                                                onMouseEnter={() => setHoveredRow(u._id)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                                style={{ background: hoveredRow === u._id ? '#f8f9fc' : 'transparent', transition: 'background 0.15s' }}>
                                                <td style={S.td}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 34, height: 34, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg,#7267ef,#4f46e5)',
                                                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: 14, flexShrink: 0
                                                        }}>
                                                            {u.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600, color: '#1c232f' }}>{u.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ ...S.td, color: '#8996a4' }}>{u.email}</td>
                                                <td style={S.td}>
                                                    <select
                                                        style={S.select}
                                                        value={u.role}
                                                        onChange={e => handleRoleChange(u._id, e.target.value)}>
                                                        {['student', 'staff', 'admin', 'owner'].map(r => (
                                                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td style={S.td}>
                                                    <button
                                                        style={{ ...S.pill(u.isActive ? '#17c666' : '#ea4d4d', u.isActive ? '#e5fcf1' : '#fde8e8'), border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                                        onClick={() => handleStatusToggle(u._id, u.isActive)}>
                                                        {u.isActive ? '● Active' : '○ Inactive'}
                                                    </button>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <button style={S.btnEdit} onClick={() => { setShowEditForm(u); setEditUserForm({ name: u.name, email: u.email }); }}>
                                                            <MdEdit size={13} /> Edit
                                                        </button>
                                                        <button style={S.btnSecondary} onClick={() => setShowPasswordModal(u)}>
                                                            <MdLockOutline size={13} /> Reset PW
                                                        </button>
                                                        {user?.email !== u.email && (
                                                            <button style={S.btnIcon} onClick={() => setShowDeleteConfirm(u)}>
                                                                <MdDelete />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : activeTab === 'history' ? (
                    <>
                        <div style={S.cardHeader}>
                            <span style={S.cardTitle}><MdHistory color="#7267ef" /> Globally Deleted Records</span>
                        </div>
                        {loadingHistory ? (
                            <div style={{ padding: 48, textAlign: 'center', color: '#8996a4' }}>Loading…</div>
                        ) : history.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center' }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
                                <h3 style={{ color: '#1c232f' }}>No operations found</h3>
                                <p style={{ color: '#8996a4' }}>There is no deletion history recorded yet.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={S.table}>
                                    <thead>
                                        <tr>
                                            {['Timestamp', 'Record Type', 'Deleted Entity', 'Description', 'Actions'].map(h => (
                                                <th key={h} style={S.th}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(record => (
                                            <tr key={record._id}
                                                onMouseEnter={() => setHoveredRow(record._id)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                                style={{ background: hoveredRow === record._id ? '#f8f9fc' : 'transparent', transition: 'background 0.15s' }}>
                                                <td style={{ ...S.td, whiteSpace: 'nowrap', color: '#8996a4', fontSize: 12 }}>
                                                    {new Date(record.deletedAt).toLocaleString()}
                                                </td>
                                                <td style={S.td}><TypeBadge type={record.recordType} /></td>
                                                <td style={S.td}>{renderRecordDetails(record)}</td>
                                                <td style={{ ...S.td, fontSize: 12, maxWidth: 260 }}>{record.description}</td>
                                                <td style={S.td}>
                                                    {!record.reverted ? (
                                                        <button style={S.btnSuccess} onClick={() => handleRevertDelete(record._id)}>
                                                            <MdRestore size={14} /> Revert
                                                        </button>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                            <span style={S.revertedStamp}><MdRestore size={14} /> Reverted</span>
                                                            <button style={S.btnDanger} onClick={() => handleUndoRevert(record._id)}>
                                                                <MdUndo size={13} /> Undo
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    /* ── Activity Logs Panel ── */
                    <>
                        <div style={S.cardHeader}>
                            <span style={S.cardTitle}><MdTimeline color="#9b59b6" /> Activity Logs</span>
                            <button style={{ ...S.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }} onClick={exportActivityLogs}>
                                <MdDownload size={15} /> Export CSV
                            </button>
                        </div>

                        {/* Filters */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid #edf2f7', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                            <MdFilterList color="#8996a4" size={18} />
                            <input
                                placeholder="Filter by action (e.g. LOGIN)"
                                style={{ ...S.input, width: 200, padding: '6px 10px', fontSize: 12 }}
                                value={logFilters.action}
                                onChange={e => setLogFilters(f => ({ ...f, action: e.target.value }))}
                            />
                            <select
                                style={{ ...S.select, fontSize: 12, padding: '6px 10px' }}
                                value={logFilters.module}
                                onChange={e => setLogFilters(f => ({ ...f, module: e.target.value }))}>
                                <option value="">All Modules</option>
                                {['AUTH', 'STUDENTS', 'STAFF', 'FINANCE', 'SETTINGS', 'SALARIES'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <input type="date" style={{ ...S.input, width: 150, padding: '6px 10px', fontSize: 12 }}
                                value={logFilters.startDate}
                                onChange={e => setLogFilters(f => ({ ...f, startDate: e.target.value }))} />
                            <input type="date" style={{ ...S.input, width: 150, padding: '6px 10px', fontSize: 12 }}
                                value={logFilters.endDate}
                                onChange={e => setLogFilters(f => ({ ...f, endDate: e.target.value }))} />
                            <button style={S.btnPrimary} onClick={() => { setLogPage(1); fetchActivityLogs(1, logFilters); }}>
                                Apply
                            </button>
                            <button style={S.btnSecondary} onClick={() => {
                                const reset = { action: '', module: '', startDate: '', endDate: '' };
                                setLogFilters(reset); setLogPage(1); fetchActivityLogs(1, reset);
                            }}>Clear</button>
                        </div>

                        {loadingLogs ? (
                            <div style={{ padding: 48, textAlign: 'center', color: '#8996a4' }}>Loading…</div>
                        ) : activityLogs.length === 0 ? (
                            <div style={{ padding: 60, textAlign: 'center' }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                                <h3 style={{ color: '#1c232f' }}>No activity logs found</h3>
                                <p style={{ color: '#8996a4' }}>No events match the current filters.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={S.table}>
                                        <thead>
                                            <tr>
                                                {['Timestamp', 'User', 'Action', 'Module', 'Description', 'IP Address'].map(h => (
                                                    <th key={h} style={S.th}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityLogs.map(log => (
                                                <tr key={log._id}
                                                    onMouseEnter={() => setHoveredRow(log._id)}
                                                    onMouseLeave={() => setHoveredRow(null)}
                                                    style={{ background: hoveredRow === log._id ? '#f8f9fc' : 'transparent', transition: 'background 0.15s' }}>
                                                    <td style={{ ...S.td, whiteSpace: 'nowrap', color: '#8996a4', fontSize: 12 }}>
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </td>
                                                    <td style={S.td}>
                                                        {log.performedBy ? (
                                                            <>
                                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{log.performedBy.name}</div>
                                                                <div style={{ fontSize: 11, color: '#8996a4' }}>{log.performedBy.email}</div>
                                                            </>
                                                        ) : <span style={{ color: '#8996a4' }}>—</span>}
                                                    </td>
                                                    <td style={S.td}>
                                                        <span style={S.pill(...getActionColors(log.action))}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...S.td, fontSize: 12 }}>{log.module}</td>
                                                    <td style={{ ...S.td, fontSize: 12, maxWidth: 300 }}>{log.description || '—'}</td>
                                                    <td style={{ ...S.td, fontSize: 12, color: '#8996a4' }}>{log.ipAddress || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination */}
                                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf2f7' }}>
                                    <span style={{ fontSize: 12, color: '#8996a4' }}>
                                        Showing {((logPage - 1) * LOG_LIMIT) + 1}–{Math.min(logPage * LOG_LIMIT, logTotal)} of {logTotal}
                                    </span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button style={S.btnSecondary} disabled={logPage <= 1}
                                            onClick={() => { const p = logPage - 1; setLogPage(p); fetchActivityLogs(p, logFilters); }}>
                                            ← Prev
                                        </button>
                                        <button style={S.btnSecondary} disabled={logPage * LOG_LIMIT >= logTotal}
                                            onClick={() => { const p = logPage + 1; setLogPage(p); fetchActivityLogs(p, logFilters); }}>
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ── Add User Modal ── */}
            {showAddForm && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <div style={S.modalHead}>
                            <h3 style={S.modalTitle}><MdAdd /> Create New User</h3>
                            <button style={S.modalClose} onClick={() => setShowAddForm(false)}><MdClose /></button>
                        </div>
                        <form onSubmit={handleAddUser}>
                            <div style={S.modalBody}>
                                {[['Name', 'text', 'name'], ['Email', 'email', 'email'], ['Password', 'password', 'password']].map(([label, type, key]) => (
                                    <div key={key} style={S.formGroup}>
                                        <label style={S.label}>{label} <span style={{ color: '#ea4d4d' }}>*</span></label>
                                        <input required type={type} style={S.input}
                                            value={newUserForm[key]}
                                            onChange={e => setNewUserForm({ ...newUserForm, [key]: key === 'email' ? e.target.value.toLowerCase() : e.target.value })}
                                            minLength={key === 'password' ? 6 : undefined} />
                                    </div>
                                ))}
                                <div style={S.formGroup}>
                                    <label style={S.label}>Role</label>
                                    <select style={{ ...S.input }} value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}>
                                        {['student', 'staff', 'admin', 'owner'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={S.modalFoot}>
                                <button type="button" style={S.btnSecondary} onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" style={S.btnPrimary} disabled={formLoading}>{formLoading ? 'Creating…' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Reset Password Modal ── */}
            {showPasswordModal && (
                <div style={S.overlay}>
                    <div style={{ ...S.modal, maxWidth: 400 }}>
                        <div style={S.modalHead}>
                            <h3 style={S.modalTitle}><MdLockOutline /> Reset Password</h3>
                            <button style={S.modalClose} onClick={() => { setShowPasswordModal(null); setNewPassword(''); }}><MdClose /></button>
                        </div>
                        <form onSubmit={handlePasswordReset}>
                            <div style={S.modalBody}>
                                <p style={{ fontSize: 13, color: '#8996a4', marginBottom: 16 }}>
                                    Setting new password for <strong style={{ color: '#1c232f' }}>{showPasswordModal.name}</strong>
                                </p>
                                <div style={S.formGroup}>
                                    <label style={S.label}>New Password</label>
                                    <input required type="password" minLength={6} autoFocus style={S.input}
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                </div>
                            </div>
                            <div style={S.modalFoot}>
                                <button type="button" style={S.btnSecondary} onClick={() => { setShowPasswordModal(null); setNewPassword(''); }}>Cancel</button>
                                <button type="submit" style={S.btnPrimary}>Save Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit User Modal ── */}
            {showEditForm && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <div style={S.modalHead}>
                            <h3 style={S.modalTitle}><MdEdit /> Edit User Details</h3>
                            <button style={S.modalClose} onClick={() => setShowEditForm(null)}><MdClose /></button>
                        </div>
                        <form onSubmit={handleEditUser}>
                            <div style={S.modalBody}>
                                {[['Name', 'text', 'name'], ['Email', 'email', 'email']].map(([label, type, key]) => (
                                    <div key={key} style={S.formGroup}>
                                        <label style={S.label}>{label} <span style={{ color: '#ea4d4d' }}>*</span></label>
                                        <input required type={type} style={S.input}
                                            value={editUserForm[key]}
                                            onChange={e => setEditUserForm({ ...editUserForm, [key]: key === 'email' ? e.target.value.toLowerCase() : e.target.value })} />
                                    </div>
                                ))}
                            </div>
                            <div style={S.modalFoot}>
                                <button type="button" style={S.btnSecondary} onClick={() => setShowEditForm(null)}>Cancel</button>
                                <button type="submit" style={S.btnPrimary} disabled={formLoading}>{formLoading ? 'Saving…' : 'Update User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {showDeleteConfirm && (
                <div style={S.overlay}>
                    <div style={{ ...S.modal, maxWidth: 400 }}>
                        <div style={{ ...S.modalHead, background: 'linear-gradient(135deg,#c0392b,#ea4d4d)' }}>
                            <h3 style={S.modalTitle}>⚠️ Confirm Delete</h3>
                            <button style={S.modalClose} onClick={() => setShowDeleteConfirm(null)}><MdClose /></button>
                        </div>
                        <div style={S.modalBody}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: '#1c232f', marginBottom: 8 }}>
                                Delete {showDeleteConfirm.name}?
                            </p>
                            <p style={{ fontSize: 13, color: '#8996a4' }}>
                                This will permanently remove the account <strong style={{ color: '#1c232f' }}>{showDeleteConfirm.email}</strong>. This action is logged in the audit stack.
                            </p>
                        </div>
                        <div style={S.modalFoot}>
                            <button style={S.btnSecondary} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button style={S.btnDanger} onClick={handleDeleteUser}>Delete Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
