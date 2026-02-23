import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { formatCurrency, formatDate, generateFeeReceiptPDF } from '../utils/pdfUtils';
import { MdDownload, MdLogout, MdSchool } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function StudentPortal() {
    const { user, logout } = useAuth();
    const [student, setStudent] = useState(null);
    const [payments, setPayments] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        if (!user?.profileId) { setLoading(false); return; }
        Promise.all([
            API.get(`/students/${user.profileId}`),
            API.get(`/students/${user.profileId}/payments`),
            API.get('/settings').catch(() => ({ data: { settings: {} } }))
        ]).then(([s, p, st]) => {
            setStudent(s.data.student);
            setPayments(p.data);
            setSettings(st.data.settings);
        }).catch(err => toast.error('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;

    if (!student) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}>🧑‍🎓</div>
                <h2 style={{ marginTop: 16, color: 'var(--primary)' }}>Welcome, {user?.name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>No student profile linked to your account.</p>
                <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={logout}><MdLogout /> Logout</button>
            </div>
        </div>
    );

    const paymentStatus = payments?.pendingAmount <= 0 ? 'paid' : payments?.totalPaid > 0 ? 'partial' : 'unpaid';
    const paidPct = student.totalFee > 0 ? Math.min(100, ((payments?.totalPaid || 0) / student.totalFee) * 100) : 0;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 20 }}>
            {/* Header */}
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div className="portal-header" style={{ marginBottom: 24 }}>
                    <div className="portal-avatar">{student.name.charAt(0)}</div>
                    <div>
                        <h2>{student.name}</h2>
                        <p>Class {student.class} | Roll No: {student.rollNo}</p>
                        <p style={{ marginTop: 4 }}>{student.studentId} · {settings.academicYear || '2024-25'}</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={logout}>
                        <MdLogout /> Logout
                    </button>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card blue">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">{formatCurrency(student.totalFee)}</div>
                        <div className="stat-label">Total Annual Fee</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{formatCurrency(payments?.totalPaid || 0)}</div>
                        <div className="stat-label">Amount Paid</div>
                    </div>
                    <div className="stat-card red">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-value">{formatCurrency(payments?.pendingAmount || 0)}</div>
                        <div className="stat-label">Pending Amount</div>
                    </div>
                </div>

                {/* Fee Progress */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <h2><MdSchool /> Fee Payment Progress</h2>
                        <span className={`badge badge-${paymentStatus}`}>{paymentStatus.toUpperCase()}</span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                            <span>Progress</span>
                            <strong>{paidPct.toFixed(1)}%</strong>
                        </div>
                        <div style={{ height: 16, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 8,
                                width: `${paidPct}%`,
                                background: paidPct >= 100 ? '#43a047' : paidPct > 50 ? '#f9a825' : '#e53935',
                                transition: 'width 0.8s ease'
                            }} />
                        </div>
                        <div className="portal-info-grid" style={{ marginTop: 16 }}>
                            <div className="highlight-box" style={{ padding: '10px 16px' }}>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Parent Name</div>
                                <div style={{ fontWeight: 600 }}>{student.parentName}</div>
                            </div>
                            <div className="highlight-box" style={{ padding: '10px 16px' }}>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Contact</div>
                                <div style={{ fontWeight: 600 }}>{student.parentPhone}</div>
                            </div>
                            <div className="highlight-box" style={{ padding: '10px 16px' }}>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Admission Date</div>
                                <div style={{ fontWeight: 600 }}>{formatDate(student.admissionDate)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="card">
                    <div className="card-header"><h2>📋 Payment History</h2></div>
                    {!payments?.payments?.length ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <div className="empty-state-icon">📄</div>
                            <h3>No payments recorded yet</h3>
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
                                        <th>Download</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.payments.map((p, i) => (
                                        <tr key={i}>
                                            <td><code style={{ color: '#1a237e', fontSize: 12 }}>{p.receiptNo || '-'}</code></td>
                                            <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(p.amount)}</td>
                                            <td style={{ fontSize: 13 }}>{formatDate(p.paymentDate)}</td>
                                            <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{p.paymentMode}</td>
                                            <td>
                                                <button className="btn btn-primary btn-sm"
                                                    onClick={() => generateFeeReceiptPDF(
                                                        { ...student, totalPaid: payments.totalPaid, pendingAmount: payments.pendingAmount },
                                                        p, settings
                                                    )}>
                                                    <MdDownload /> Receipt
                                                </button>
                                            </td>
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
