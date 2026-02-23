import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { formatCurrency, formatDate, generateSalarySlipPDF } from '../utils/pdfUtils';
import { MdDownload, MdLogout } from 'react-icons/md';
import toast from 'react-hot-toast';

const ROLE_DISPLAY = (r) => (r || '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function StaffPortal() {
    const { user, logout } = useAuth();
    const [staff, setStaff] = useState(null);
    const [salaryData, setSalaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        if (!user?.profileId) { setLoading(false); return; }
        Promise.all([
            API.get(`/staff/${user.profileId}`),
            API.get(`/staff/${user.profileId}/salaries`),
            API.get('/settings').catch(() => ({ data: { settings: {} } }))
        ]).then(([s, sal, st]) => {
            setStaff(s.data.staff);
            setSalaryData(sal.data);
            setSettings(st.data.settings);
        }).catch(() => toast.error('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;

    if (!staff) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}>👨‍🏫</div>
                <h2 style={{ marginTop: 16, color: 'var(--primary)' }}>Welcome, {user?.name}</h2>
                <p style={{ color: '#6b7280' }}>No staff profile linked to your account.</p>
                <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={logout}><MdLogout /> Logout</button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 20 }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div className="portal-header" style={{ marginBottom: 24 }}>
                    <div className="portal-avatar">{staff.name.charAt(0)}</div>
                    <div>
                        <h2>{staff.name}</h2>
                        <p>{ROLE_DISPLAY(staff.role)}{staff.subject ? ` · ${staff.subject}` : ''}</p>
                        <p style={{ marginTop: 4 }}>{staff.staffId} · Joined {formatDate(staff.joiningDate)}</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={logout}>
                        <MdLogout /> Logout
                    </button>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card blue">
                        <div className="stat-icon">💼</div>
                        <div className="stat-value">{formatCurrency(staff.monthlySalary)}</div>
                        <div className="stat-label">Monthly Salary</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">{formatCurrency(salaryData?.totalSalaryPaid || 0)}</div>
                        <div className="stat-label">Total Received</div>
                    </div>
                    <div className="stat-card gold">
                        <div className="stat-icon">📊</div>
                        <div className="stat-value">{salaryData?.salaryPayments?.length || 0}</div>
                        <div className="stat-label">Payments Made</div>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h2>👤 Profile Details</h2></div>
                    <div className="card-body">
                        <div className="portal-info-grid">
                            <div className="info-row"><span className="label">Email</span><span className="value">{staff.email}</span></div>
                            <div className="info-row"><span className="label">Phone</span><span className="value">{staff.phone}</span></div>
                            {staff.qualification && <div className="info-row"><span className="label">Qualification</span><span className="value">{staff.qualification}</span></div>}
                            {staff.experience && <div className="info-row"><span className="label">Experience</span><span className="value">{staff.experience} years</span></div>}
                            {staff.bankAccount && <div className="info-row"><span className="label">Bank A/C</span><span className="value">{staff.bankAccount}</span></div>}
                            {staff.bankName && <div className="info-row"><span className="label">Bank</span><span className="value">{staff.bankName}</span></div>}
                        </div>
                    </div>
                </div>

                {/* Salary History */}
                <div className="card">
                    <div className="card-header"><h2>💰 Salary History</h2></div>
                    {!salaryData?.salaryPayments?.length ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <div className="empty-state-icon">📄</div>
                            <h3>No salary payments recorded yet</h3>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Slip No</th><th>Month</th><th>Amount</th>
                                        <th>Date</th><th>Mode</th><th>Download</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaryData.salaryPayments.map((p, i) => (
                                        <tr key={i}>
                                            <td><code style={{ color: '#1a237e', fontSize: 12 }}>{p.slipNo || '-'}</code></td>
                                            <td style={{ fontWeight: 600 }}>{p.month}</td>
                                            <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(p.amount)}</td>
                                            <td style={{ fontSize: 13 }}>{formatDate(p.paymentDate)}</td>
                                            <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{(p.paymentMode || '').replace('_', ' ')}</td>
                                            <td>
                                                <button className="btn btn-primary btn-sm"
                                                    onClick={() => generateSalarySlipPDF(staff, p, settings)}>
                                                    <MdDownload /> Slip
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Leave History */}
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header"><h2>📅 Leave History</h2></div>
                    {!staff.leaves?.length ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <div className="empty-state-icon">✅</div>
                            <h3>No leaves present</h3>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th><th>Reason</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.leaves.map((leave, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{formatDate(leave.date)}</td>
                                            <td>{leave.reason || '-'}</td>
                                            <td><span className="badge badge-paid" style={{ textTransform: 'capitalize' }}>{leave.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
