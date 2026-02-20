import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { formatCurrency } from '../utils/pdfUtils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    MdPeople, MdSchool, MdAccountBalance, MdWarning,
    MdPayments, MdTrendingUp, MdReceipt, MdCheckCircle
} from 'react-icons/md';

const COLORS = ['#1a237e', '#f9a825', '#00897b', '#e53935', '#7b1fa2'];

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/reports/dashboard')
            .then(res => setData(res.data.dashboard))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!data) return <div className="empty-state"><p>Failed to load dashboard data.</p></div>;

    const classWiseData = Object.entries(data.classWise || {}).map(([cls, vals]) => ({
        class: cls, collected: vals.collected, pending: vals.pending, students: vals.count
    }));

    const monthlyData = Object.entries(data.monthlyCollections || {})
        .map(([month, amount]) => ({ month, fees: amount, salary: data.monthlySalaryPaid?.[month] || 0 }))
        .slice(-6);

    const pieData = [
        { name: 'Collected', value: data.totalFeesCollected },
        { name: 'Pending', value: data.totalFeesPending },
    ];

    return (
        <div>
            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon"><MdSchool /></div>
                    <div className="stat-value">{data.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon"><MdPeople /></div>
                    <div className="stat-value">{data.totalStaff}</div>
                    <div className="stat-label">Total Staff</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon"><MdAccountBalance /></div>
                    <div className="stat-value">{formatCurrency(data.totalFeesCollected)}</div>
                    <div className="stat-label">Fees Collected</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon"><MdWarning /></div>
                    <div className="stat-value">{formatCurrency(data.totalFeesPending)}</div>
                    <div className="stat-label">Pending Fees</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon"><MdPayments /></div>
                    <div className="stat-value">{formatCurrency(data.totalSalaryPaid)}</div>
                    <div className="stat-label">Salary Paid</div>
                </div>
                <div className="stat-card green" style={{ background: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)' }}>
                    <div className="stat-icon" style={{ background: 'rgba(67,160,71,0.12)', color: '#2e7d32' }}><MdCheckCircle /></div>
                    <div className="stat-value" style={{ color: '#2e7d32' }}>{data.studentsFullyPaid ?? 0}</div>
                    <div className="stat-label">Fully Paid Students</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg,#e0f7fa,#e0f2f1)' }}>
                    <div className="stat-icon" style={{ background: 'rgba(0,137,123,0.12)', color: '#00796b' }}><MdTrendingUp /></div>
                    <div className="stat-value" style={{ color: '#00796b' }}>{data.collectionRate ?? 0}%</div>
                    <div className="stat-label">Collection Rate</div>
                    <div style={{ marginTop: 8, background: '#b2dfdb', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${data.collectionRate ?? 0}%`, background: '#00897b', height: '100%', borderRadius: 99, transition: 'width 0.8s ease' }} />
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Monthly income vs expense */}
                <div className="card">
                    <div className="card-header">
                        <h2><MdTrendingUp /> Monthly Overview</h2>
                    </div>
                    <div className="card-body">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={v => formatCurrency(v)} />
                                    <Legend />
                                    <Bar dataKey="fees" name="Fee Income" fill="#1a237e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="salary" name="Salary Expense" fill="#f9a825" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Fee Collection Status */}
                <div className="card">
                    <div className="card-header">
                        <h2><MdAccountBalance /> Fee Collection Status</h2>
                    </div>
                    <div className="card-body">
                        <div className="chart-container" style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                        paddingAngle={4} dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip formatter={v => formatCurrency(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, color: '#1a237e' }}>{formatCurrency(data.totalFeesCollected)}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Collected</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, color: '#e53935' }}>{formatCurrency(data.totalFeesPending)}</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Pending</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Class-wise breakdown */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h2><MdSchool /> Class-wise Overview</h2>
                </div>
                <div className="card-body" style={{ padding: '0 24px 16px' }}>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classWiseData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={v => formatCurrency(v)} />
                                <Legend />
                                <Bar dataKey="collected" name="Collected" fill="#00897b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="pending" name="Pending" fill="#ef5350" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Payments */}
            <div className="card">
                <div className="card-header">
                    <h2><MdReceipt /> Recent Fee Payments</h2>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Receipt No</th>
                                <th>Student Name</th>
                                <th>Class</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.recentPayments || []).length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>No recent payments</td></tr>
                            ) : data.recentPayments.map((p, i) => (
                                <tr key={i}>
                                    <td><code style={{ fontSize: 12, color: '#1a237e' }}>{p.receiptNo || 'N/A'}</code></td>
                                    <td style={{ fontWeight: 600 }}>{p.studentName}</td>
                                    <td><span className="badge badge-admin">{p.class}</span></td>
                                    <td style={{ fontWeight: 700, color: '#00897b' }}>{formatCurrency(p.amount)}</td>
                                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{p.paymentMode}</td>
                                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
