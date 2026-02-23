import React, { useEffect, useState, useMemo } from 'react';
import API from '../utils/api';
import { formatCurrency, formatDate } from '../utils/pdfUtils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { MdBarChart, MdPeople, MdSchool, MdWarning, MdTrendingUp, MdCheckCircle, MdDateRange, MdFilterList } from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { key: 'classwise', label: '📊 Class-wise Fees', icon: MdSchool },
    { key: 'pending', label: '⚠️ Pending Fees', icon: MdWarning },
    { key: 'monthly', label: '📈 Monthly Report', icon: MdTrendingUp },
    { key: 'salary', label: '💰 Salary Report', icon: MdPeople },
];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('classwise');
    const [classFilter, setClassFilter] = useState('');

    const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

    // Global dashboard stats with TanStack Query
    const { data: dashboardStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await API.get('/reports/dashboard');
            return res.data.dashboard;
        },
        staleTime: 5 * 60 * 1000
    });

    // Report data with TanStack Query
    const { data: reportData, isLoading: loading } = useQuery({
        queryKey: ['report', activeTab, classFilter],
        queryFn: async () => {
            let res;
            if (activeTab === 'classwise') res = await API.get('/reports/classwise-fees');
            else if (activeTab === 'pending') res = await API.get('/reports/pending-fees', { params: classFilter ? { class: classFilter } : {} });
            else if (activeTab === 'monthly') res = await API.get('/reports/monthly');
            else if (activeTab === 'salary') res = await API.get('/reports/salary');
            return res.data;
        }
    });

    const data = reportData;

    const renderClasswise = () => {
        if (!data?.report) return null;
        const chartData = data.report.map(r => ({
            class: r.class, collected: r.totalCollected, pending: r.totalPending, students: r.totalStudents
        }));

        return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card glass-blue">
                        <div className="stat-icon"><MdSchool /></div>
                        <div className="stat-value">{data.report.reduce((s, r) => s + r.totalStudents, 0)}</div>
                        <div className="stat-label">Total Students</div>
                    </div>
                    <div className="stat-card glass-green">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.totalCollected, 0))}</div>
                        <div className="stat-label">Total Collected</div>
                    </div>
                    <div className="stat-card glass-red">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.totalPending, 0))}</div>
                        <div className="stat-label">Total Pending</div>
                    </div>
                </div>

                <div className="card glass" style={{ marginBottom: 24 }}>
                    <div className="card-header" style={{ borderBottom: 'none' }}>
                        <h2 style={{ fontSize: 18, color: 'var(--primary)' }}>Class-wise Collection Analysis</h2>
                    </div>
                    <div className="card-body" style={{ padding: '0 24px 24px' }}>
                        <div className="chart-container" style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={v => formatCurrency(v)}
                                    />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                    <Bar dataKey="pending" name="Pending" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card glass">
                    <div className="table-container">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>Students</th>
                                    <th>Total Fee</th>
                                    <th>Collected</th>
                                    <th>Pending</th>
                                    <th>Paid Status</th>
                                    <th>Collection %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.report.map((r, idx) => (
                                    <tr key={r.class} className="hover-lift">
                                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.class}</td>
                                        <td>{r.totalStudents}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(r.totalFee)}</td>
                                        <td style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(r.totalCollected)}</td>
                                        <td style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(r.totalPending)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <span className="badge badge-paid" title="Fully Paid">{r.paidCount}</span>
                                                <span className="badge badge-partial" title="Partial">{r.partialCount}</span>
                                                <span className="badge badge-unpaid" title="Unpaid">{r.unpaidCount}</span>
                                            </div>
                                        </td>
                                        <td style={{ minWidth: 140 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${r.totalFee > 0 ? Math.min(100, (r.totalCollected / r.totalFee) * 100) : 0}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.05 }}
                                                        style={{
                                                            height: '100%',
                                                            background: 'linear-gradient(90deg, #10b981, #34d399)'
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
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
            </motion.div>
        );
    };

    const renderPending = () => {
        if (!data) return null;
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="filters-bar" style={{ marginBottom: 24 }}>
                    <div className="stat-card glass-red" style={{ flex: 1, minWidth: 200, padding: 20 }}>
                        <div className="stat-icon" style={{ fontSize: 24 }}>⚠️</div>
                        <div className="stat-value" style={{ fontSize: 24 }}>{formatCurrency(data.totalPending)}</div>
                        <div className="stat-label">Total Outstanding Dues</div>
                    </div>
                    <div className="stat-card glass-blue" style={{ flex: 1, minWidth: 240, padding: 20 }}>
                        <div className="stat-icon" style={{ fontSize: 24 }}>👥</div>
                        <div className="stat-value" style={{ fontSize: 24 }}>{data.count}</div>
                        <div className="stat-label">Students with Pending Fees</div>
                    </div>
                    <div className="search-bar glass" style={{ width: 200, padding: '4px 12px' }}>
                        <MdFilterList style={{ color: '#64748b' }} />
                        <select className="form-control" style={{ border: 'none', background: 'transparent' }} value={classFilter}
                            onChange={e => setClassFilter(e.target.value)}>
                            <option value="">All Classes</option>
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div className="card glass">
                    <div className="table-container">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>ID</th><th>Student Name</th><th>Class & Roll</th>
                                    <th>Parent Contact</th><th>Total Fee</th><th>Paid</th><th>Pending</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.pendingStudents || []).map((s, idx) => (
                                    <motion.tr
                                        key={s._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="hover-lift"
                                    >
                                        <td><code style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>{s.studentId}</code></td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>{s.academicYear}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.class}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Roll: {s.rollNo}</div>
                                        </td>
                                        <td style={{ fontSize: 12, fontWeight: 500 }}>{s.parentPhone}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(s.totalFee)}</td>
                                        <td style={{ color: '#10b981', fontWeight: 700 }}>{formatCurrency(s.totalPaid)}</td>
                                        <td style={{ fontWeight: 800, color: '#ef4444' }}>{formatCurrency(s.pendingAmount)}</td>
                                        <td><span className={`badge ${s.paymentStatus === 'partial' ? 'badge-partial' : 'badge-unpaid'}`}>{s.paymentStatus}</span></td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderMonthly = () => {
        if (!data?.report) return null;
        const chartData = data.report.map(r => ({ ...r, profit: r.income - r.expense }));

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="stats-grid" style={{ gap: 20, marginBottom: 24 }}>
                    <div className="stat-card glass-green">
                        <div className="stat-icon">📥</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.income, 0))}</div>
                        <div className="stat-label">Total Fee Income</div>
                    </div>
                    <div className="stat-card glass-red">
                        <div className="stat-icon">📤</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.expense, 0))}</div>
                        <div className="stat-label">Total Salary Expense</div>
                    </div>
                    <div className="stat-card glass-blue">
                        <div className="stat-icon">🏦</div>
                        <div className="stat-value">{formatCurrency(data.report.reduce((s, r) => s + r.net, 0))}</div>
                        <div className="stat-label">Net Operating Balance</div>
                    </div>
                </div>

                <div className="card glass" style={{ marginBottom: 24 }}>
                    <div className="card-header" style={{ borderBottom: 'none' }}>
                        <h2 style={{ fontSize: 18, color: 'var(--primary)' }}>Income vs Expense Breakdown</h2>
                    </div>
                    <div className="card-body" style={{ padding: '0 24px 24px' }}>
                        <div className="chart-container" style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={v => formatCurrency(v)}
                                    />
                                    <Legend iconType="circle" />
                                    <Area type="monotone" dataKey="income" name="Fee Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="expense" name="Salary Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card glass">
                    <div className="table-container">
                        <table className="students-table">
                            <thead>
                                <tr><th>Month</th><th>Income (Received)</th><th>Expense (Paid)</th><th>Net Profit/Loss</th></tr>
                            </thead>
                            <tbody>
                                {data.report.map((r, i) => (
                                    <tr key={i} className="hover-lift">
                                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.month}</td>
                                        <td style={{ color: '#10b981', fontWeight: 700 }}>{formatCurrency(r.income)}</td>
                                        <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatCurrency(r.expense)}</td>
                                        <td style={{ fontWeight: 800, color: r.net >= 0 ? '#10b981' : '#ef4444' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {r.net >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(r.net))}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderSalary = () => {
        if (!data) return null;
        return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card glass-blue">
                        <div className="stat-icon">💰</div>
                        <div className="stat-value">{formatCurrency(data.totalMonthlySalary)}</div>
                        <div className="stat-label">Monthly Salary Promise</div>
                    </div>
                    <div className="stat-card glass-green">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{formatCurrency(data.totalPaid)}</div>
                        <div className="stat-label">Total Salaries Paid</div>
                    </div>
                </div>
                <div className="card glass">
                    <div className="table-container">
                        <table className="students-table">
                            <thead>
                                <tr><th>ID</th><th>Staff Name</th><th>Designation</th><th>Monthly Salary</th><th>Total Paid</th><th>Slip Count</th></tr>
                            </thead>
                            <tbody>
                                {(data.staff || []).map(s => (
                                    <tr key={s._id} className="hover-lift">
                                        <td><code style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>{s.staffId}</code></td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>{s.qualification}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-admin glass" style={{ textTransform: 'capitalize' }}>
                                                {(s.role || '').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{formatCurrency(s.monthlySalary)}</td>
                                        <td style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(s.totalSalaryPaid)}</td>
                                        <td>
                                            <span className="badge glass" style={{ color: 'var(--primary)' }}>
                                                {s.payments?.length || 0} Slips
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderers = { classwise: renderClasswise, pending: renderPending, monthly: renderMonthly, salary: renderSalary };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {dashboardStats && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="stats-grid" style={{ marginBottom: 24, gap: 20 }}>
                    <div className="stat-card glass-green">
                        <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><MdCheckCircle /></div>
                        <div className="stat-value" style={{ color: '#1e293b' }}>{dashboardStats.studentsFullyPaid ?? 0}</div>
                        <div className="stat-label">Fully Paid Students</div>
                    </div>
                    <div className="stat-card glass-blue">
                        <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><MdTrendingUp /></div>
                        <div className="stat-value" style={{ color: '#1e293b' }}>{dashboardStats.collectionRate ?? 0}%</div>
                        <div className="stat-label">Overall Collection Rate</div>
                        <div style={{ marginTop: 12, background: '#f1f5f9', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dashboardStats.collectionRate ?? 0}%` }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', height: '100%', borderRadius: 99 }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="card glass" style={{ marginBottom: 24, padding: '8px 12px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
                    {TABS.map(t => (
                        <button key={t.key}
                            className={`btn ${activeTab === t.key ? 'btn-primary shadow-sm' : 'btn-ghost'} btn-sm hover-lift`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 18px',
                                borderRadius: 10
                            }}
                            onClick={() => setActiveTab(t.key)}>
                            <t.icon /> {t.label.split(' ')[1]} {t.label.split(' ')[2] || ''}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="loading-spinner"
                    >
                        <div className="spinner" />
                    </motion.div>
                ) : (
                    <div key={activeTab}>
                        {renderers[activeTab]?.()}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
