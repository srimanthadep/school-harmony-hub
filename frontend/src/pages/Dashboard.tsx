import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { formatCurrency } from '../utils/pdfUtils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
    MdPeople, MdSchool, MdAccountBalance, MdWarning,
    MdPayments, MdTrendingUp, MdReceipt, MdCheckCircle, MdRefresh, MdMenuBook,
    MdArrowUpward, MdArrowDownward, MdGetApp
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePWA } from '../hooks/usePWA';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export default function Dashboard() {
    const queryClient = useQueryClient();
    const { isInstallable, installApp } = usePWA();

    const { data: dashboardData, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['dashboard_stats'],
        queryFn: async () => {
            const res = await API.get('/reports/dashboard');
            return res.data.dashboard;
        },
        refetchInterval: 30000,
    });

    if (isLoading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!dashboardData) return <div className="empty-state"><p>Failed to load dashboard data.</p></div>;

    const data = dashboardData;

    const classWiseData = Object.entries(data.classWise || {}).map(([cls, vals]: [string, any]) => ({
        class: cls, collected: vals.collected, pending: vals.pending, students: vals.count
    }));

    const monthlyData = Object.entries(data.monthlyCollections || {})
        .map(([month, amount]: [string, any]) => ({
            month,
            fees: amount,
            salary: data.monthlySalaryPaid?.[month] || 0,
            net: (amount as number) - (data.monthlySalaryPaid?.[month] || 0)
        }))
        .slice(-6);

    const pieData = [
        { name: 'Collected', value: data.totalFeesCollected },
        { name: 'Pending', value: data.totalFeesPending },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div className="card-header" style={{ marginBottom: 24, padding: 0, border: 'none', background: 'transparent' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>School Analytics</h1>
                    <p style={{ color: '#64748b', fontSize: 13 }}>Real-time institution overview</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {isInstallable && (
                        <button
                            className="btn btn-secondary hover-lift"
                            onClick={installApp}
                            style={{ gap: 8, borderRadius: 12, padding: '12px 20px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none' }}
                        >
                            <MdGetApp /> Download App
                        </button>
                    )}
                    <button
                        className={`btn ${isRefetching ? 'btn-secondary' : 'btn-primary'} hover-lift`}
                        onClick={() => refetch()}
                        style={{ gap: 8, borderRadius: 12, padding: '12px 20px' }}
                    >
                        <MdRefresh className={isRefetching ? 'spin' : ''} /> {isRefetching ? 'Refreshing...' : 'Refresh Overview'}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid dashboard-stats-grid" style={{ marginBottom: 32 }}>
                <motion.div variants={itemVariants} className="stat-card glass-blue">
                    <div className="stat-icon"><MdSchool /></div>
                    <div className="stat-value">{data.totalStudents}</div>
                    <div className="stat-label">Total Enrollment</div>
                </motion.div>
                <motion.div variants={itemVariants} className="stat-card glass-gold">
                    <div className="stat-icon"><MdPeople /></div>
                    <div className="stat-value">{data.totalStaff}</div>
                    <div className="stat-label">Active Staff</div>
                </motion.div>
                <motion.div variants={itemVariants} className="stat-card glass-green">
                    <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><MdAccountBalance /></div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(data.totalFeesCollected)}</div>
                    <div className="stat-label">Fee Collection</div>
                </motion.div>
                <motion.div variants={itemVariants} className="stat-card glass-red">
                    <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><MdWarning /></div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(data.totalFeesPending)}</div>
                    <div className="stat-label">Collection Gap</div>
                </motion.div>
                <motion.div variants={itemVariants} className="stat-card glass-purple">
                    <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><MdPayments /></div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(data.totalSalaryPaid)}</div>
                    <div className="stat-label">Payroll Disbursed</div>
                </motion.div>
                <motion.div variants={itemVariants} className="stat-card glass-teal">
                    <div className="stat-icon" style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6' }}><MdMenuBook /></div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(data.libraryCollected)}</div>
                    <div className="stat-label">Books Collected</div>
                </motion.div>
                <motion.div variants={itemVariants} className="stat-card glass-orange">
                    <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}><MdMenuBook /></div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(data.libraryPending)}</div>
                    <div className="stat-label">Books Pending</div>
                </motion.div>
                <motion.div variants={itemVariants} className="stat-card glass-blue">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><MdTrendingUp /></div>
                    <div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency((data.totalFeesCollected || 0) + (data.libraryCollected || 0) - (data.totalSalaryPaid || 0))}</div>
                    <div className="stat-label">Operating Balance</div>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className="charts-grid" style={{ gap: 24, marginBottom: 24 }}>
                {/* Monthly income vs expense */}
                <motion.div variants={itemVariants} className="card glass">
                    <div className="card-header" style={{ borderBottom: 'none' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
                            <MdTrendingUp style={{ color: 'var(--primary)' }} /> Monthly Financial Performance
                        </h2>
                    </div>
                    <div className="card-body" style={{ padding: '0 20px 20px' }}>
                        <div className="chart-container" style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                                    <Area type="monotone" dataKey="fees" name="Fee Revenue" stroke="var(--primary)" fillOpacity={1} fill="url(#colorFees)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="salary" name="Staff Payroll" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSalary)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>

                {/* Fee Collection Status */}
                <motion.div variants={itemVariants} className="card glass">
                    <div className="card-header" style={{ borderBottom: 'none' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
                            <MdAccountBalance style={{ color: '#10b981' }} /> Collection Health
                        </h2>
                    </div>
                    <div className="card-body" style={{ padding: '0 20px 24px' }}>
                        <div className="chart-container" style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95}
                                        paddingAngle={8} dataKey="value"
                                        labelLine={false}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={v => formatCurrency(v)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="stat-card glass" style={{ padding: 12, minWidth: 0 }}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>COLLECTED</div>
                                <div style={{ fontWeight: 800, color: '#10b981', fontSize: 14 }}>{((data.totalFeesCollected / (data.totalFeesCollected + data.totalFeesPending)) * 100).toFixed(1)}%</div>
                            </div>
                            <div className="stat-card glass" style={{ padding: 12, minWidth: 0 }}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>PENDING</div>
                                <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 14 }}>{((data.totalFeesPending / (data.totalFeesCollected + data.totalFeesPending)) * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Class-wise breakdown */}
            <motion.div variants={itemVariants} className="card glass" style={{ marginBottom: 24 }}>
                <div className="card-header" style={{ borderBottom: 'none' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
                        <MdSchool style={{ color: 'var(--primary)' }} /> Grade-wise Performance Analysis
                    </h2>
                </div>
                <div className="card-body" style={{ padding: '0 24px 24px' }}>
                    <div className="chart-container" style={{ height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classWiseData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={v => formatCurrency(v)}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="collected" name="Total Collected" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                                <Bar dataKey="pending" name="Remaining Dues" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>

            {/* Recent Payments */}
            <motion.div variants={itemVariants} className="card glass">
                <div className="card-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18 }}>
                        <MdReceipt style={{ color: 'var(--primary)' }} /> Live Payment Feed
                    </h2>
                </div>
                <div className="table-container">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Ref No</th>
                                <th>Student Name</th>
                                <th>Grade</th>
                                <th>Amount</th>
                                <th>Channel</th>
                                <th>Transaction Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.recentPayments || []).length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 48 }}>No recent transitions found</td></tr>
                            ) : data.recentPayments.map((p: any, i: number) => (
                                <tr key={i} className="hover-lift">
                                    <td><code style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>{p.receiptNo || 'N/A'}</code></td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.studentName}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>Verified Transaction</div>
                                    </td>
                                    <td><span className="badge badge-admin glass">{p.class}</span></td>
                                    <td style={{ fontWeight: 800, color: '#10b981' }}>{formatCurrency(p.amount)}</td>
                                    <td>
                                        <span className="badge glass" style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>
                                            {p.paymentMode.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}
