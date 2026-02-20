import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { formatCurrency, formatDate } from '../utils/pdfUtils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { MdBarChart, MdPeople, MdSchool, MdWarning, MdTrendingUp } from 'react-icons/md';

const TABS = [
    { key: 'classwise', label: '📊 Class-wise Fees', icon: MdSchool },
    { key: 'pending', label: '⚠️ Pending Fees', icon: MdWarning },
    { key: 'monthly', label: '📈 Monthly Report', icon: MdTrendingUp },
    { key: 'salary', label: '💰 Salary Report', icon: MdPeople },
];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('classwise');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [classFilter, setClassFilter] = useState('');

    const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

    const fetchReport = async () => {
        setLoading(true);
        setData(null);
        try {
            let res;
            if (activeTab === 'classwise') res = await API.get('/reports/classwise-fees');
            else if (activeTab === 'pending') res = await API.get('/reports/pending-fees', { params: classFilter ? { class: classFilter } : {} });
            else if (activeTab === 'monthly') res = await API.get('/reports/monthly');
            else if (activeTab === 'salary') res = await API.get('/reports/salary');
            setData(res.data);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReport(); }, [activeTab, classFilter]);

    const renderClasswise = () => {
        if (!data?.report) return null;
        const chartData = data.report.map(r => ({
            class: r.class, collected: r.totalCollected, pending: r.totalPending, students: r.totalStudents
        }));

        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div className="stat-card blue">
                        <div className="stat-icon"><MdSchool /></div>
                        <div className="stat-value">{data.report.reduce((s, r) => s + r.totalStudents, 0)}</div>
                        <div className="stat-label">Total Students</div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.totalCollected, 0))}</div>
                        <div className="stat-label">Total Collected</div>
                    </div>
                    <div className="stat-card red">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.totalPending, 0))}</div>
                        <div className="stat-label">Total Pending</div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h2>Class-wise Collection</h2></div>
                    <div className="card-body" style={{ padding: '16px 24px' }}>
                        <div className="chart-container" style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={v => formatCurrency(v)} />
                                    <Legend />
                                    <Bar dataKey="collected" name="Collected" fill="#00897b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="pending" name="Pending" fill="#e53935" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>Students</th>
                                    <th>Total Fee</th>
                                    <th>Collected</th>
                                    <th>Pending</th>
                                    <th>Fully Paid</th>
                                    <th>Partial</th>
                                    <th>Unpaid</th>
                                    <th>Collection %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.report.map(r => (
                                    <tr key={r.class}>
                                        <td style={{ fontWeight: 700 }}>{r.class}</td>
                                        <td>{r.totalStudents}</td>
                                        <td>{formatCurrency(r.totalFee)}</td>
                                        <td style={{ fontWeight: 600, color: '#43a047' }}>{formatCurrency(r.totalCollected)}</td>
                                        <td style={{ fontWeight: 600, color: '#e53935' }}>{formatCurrency(r.totalPending)}</td>
                                        <td><span className="badge badge-paid">{r.paidCount}</span></td>
                                        <td><span className="badge badge-partial">{r.partialCount}</span></td>
                                        <td><span className="badge badge-unpaid">{r.unpaidCount}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 3,
                                                        width: `${r.totalFee > 0 ? Math.min(100, (r.totalCollected / r.totalFee) * 100) : 0}%`,
                                                        background: '#00897b'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 600 }}>
                                                    {r.totalFee > 0 ? ((r.totalCollected / r.totalFee) * 100).toFixed(0) : 0}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderPending = () => {
        if (!data) return null;
        return (
            <div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="highlight-box" style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Total Pending</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#e53935' }}>{formatCurrency(data.totalPending)}</div>
                    </div>
                    <div className="highlight-box" style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Students with Dues</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a237e' }}>{data.count}</div>
                    </div>
                    <select className="form-control" style={{ width: 160 }} value={classFilter}
                        onChange={e => setClassFilter(e.target.value)}>
                        <option value="">All Classes</option>
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th><th>Name</th><th>Class</th><th>Roll</th>
                                    <th>Parent Phone</th><th>Total Fee</th><th>Paid</th><th>Pending</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.pendingStudents || []).map(s => (
                                    <tr key={s._id}>
                                        <td><code style={{ fontSize: 11, color: '#1a237e' }}>{s.studentId}</code></td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.class}</td>

                                        <td>{s.rollNo}</td>
                                        <td style={{ fontSize: 12 }}>{s.parentPhone}</td>
                                        <td>{formatCurrency(s.totalFee)}</td>
                                        <td style={{ color: '#43a047', fontWeight: 600 }}>{formatCurrency(s.totalPaid)}</td>
                                        <td style={{ fontWeight: 700, color: '#e53935' }}>{formatCurrency(s.pendingAmount)}</td>
                                        <td><span className={`badge ${s.paymentStatus === 'partial' ? 'badge-partial' : 'badge-unpaid'}`}>{s.paymentStatus}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderMonthly = () => {
        if (!data?.report) return null;
        const chartData = data.report.map(r => ({ ...r, profit: r.income - r.expense }));

        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div className="stat-card green">
                        <div className="stat-icon">📥</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.income, 0))}</div>
                        <div className="stat-label">Total Income</div>
                    </div>
                    <div className="stat-card red">
                        <div className="stat-icon">📤</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.expense, 0))}</div>
                        <div className="stat-label">Total Expense (Salary)</div>
                    </div>
                    <div className="stat-card blue">
                        <div className="stat-icon">🏦</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.net, 0))}</div>
                        <div className="stat-label">Net Balance</div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header"><h2>Monthly Income vs Expense</h2></div>
                    <div className="card-body">
                        <div className="chart-container" style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                    <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={v => formatCurrency(v)} />
                                    <Legend />
                                    <Line type="monotone" dataKey="income" name="Fee Income" stroke="#00897b" strokeWidth={2} dot />
                                    <Line type="monotone" dataKey="expense" name="Salary Expense" stroke="#e53935" strokeWidth={2} dot />
                                    <Line type="monotone" dataKey="profit" name="Net" stroke="#1a237e" strokeWidth={2} strokeDasharray="5 5" dot />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Month</th><th>Fee Income</th><th>Salary Expense</th><th>Net</th></tr>
                            </thead>
                            <tbody>
                                {data.report.map((r, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{r.month}</td>
                                        <td style={{ color: '#43a047', fontWeight: 600 }}>{formatCurrency(r.income)}</td>
                                        <td style={{ color: '#e53935', fontWeight: 600 }}>{formatCurrency(r.expense)}</td>
                                        <td style={{ fontWeight: 700, color: r.net >= 0 ? '#43a047' : '#e53935' }}>{formatCurrency(r.net)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderSalary = () => {
        if (!data) return null;
        return (
            <div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    <div className="highlight-box" style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Total Monthly Salary Commitment</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a237e' }}>{formatCurrency(data.totalMonthlySalary)}</div>
                    </div>
                    <div className="highlight-box" style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Total Salary Paid To Date</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#43a047' }}>{formatCurrency(data.totalPaid)}</div>
                    </div>
                </div>
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>ID</th><th>Name</th><th>Role</th><th>Monthly Salary</th><th>Total Paid</th><th>Payment Count</th></tr>
                            </thead>
                            <tbody>
                                {(data.staff || []).map(s => (
                                    <tr key={s._id}>
                                        <td><code style={{ fontSize: 11, color: '#1a237e' }}>{s.staffId}</code></td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{(s.role || '').replace('_', ' ')}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(s.monthlySalary)}</td>
                                        <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(s.totalSalaryPaid)}</td>
                                        <td>{s.payments?.length || 0} payments</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderers = { classwise: renderClasswise, pending: renderPending, monthly: renderMonthly, salary: renderSalary };

    return (
        <div>
            {/* Tab Navigation */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 4, padding: '16px 20px', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                    {TABS.map(t => (
                        <button key={t.key}
                            className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setActiveTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
            ) : (
                renderers[activeTab]?.()
            )}
        </div>
    );
}
