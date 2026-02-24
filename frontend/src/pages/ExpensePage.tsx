import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { MdSave, MdDelete, MdElectricBolt, MdLandscape, MdAdd, MdEdit } from 'react-icons/md';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/pdfUtils';
import { getCurrentAcademicYear } from '../utils/academicYear';

interface Expense {
    _id: string;
    type: 'electricity_bill' | 'land_lease';
    amount: number;
    description?: string;
    date: string;
    paymentMode: string;
    paidBy?: string;
    academicYear: string;
}

interface ExpenseForm {
    type: string;
    amount: string | number;
    description: string;
    date: string;
    paymentMode: string;
    paidBy: string;
    academicYear: string;
}

const EXPENSE_TYPES = [
    { value: 'electricity_bill', label: 'Current Bill (Electricity)', icon: <MdElectricBolt /> },
    { value: 'land_lease', label: 'Land Lease', icon: <MdLandscape /> },
];

const PAYMENT_MODES = ['cash', 'bank_transfer', 'cheque', 'online'];

const emptyForm = {
    type: 'electricity_bill',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'cash',
    paidBy: '',
    academicYear: getCurrentAcademicYear(),
};

export default function ExpensePage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<ExpenseForm>({ ...emptyForm });
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'electricity_bill' | 'land_lease'>('electricity_bill');

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await API.get('/expenses');
            setExpenses(res.data.expenses);
        } catch {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const openAdd = (type: string) => {
        setForm({ ...emptyForm, type });
        setEditId(null);
        setShowForm(true);
    };

    const openEdit = (expense: Expense) => {
        setForm({
            type: expense.type,
            amount: expense.amount,
            description: expense.description || '',
            date: expense.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
            paymentMode: expense.paymentMode || 'cash',
            paidBy: expense.paidBy || '',
            academicYear: expense.academicYear || getCurrentAcademicYear(),
        });
        setEditId(expense._id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) {
                await API.put(`/expenses/${editId}`, form);
                toast.success('Expense updated');
            } else {
                await API.post('/expenses', form);
                toast.success('Expense recorded');
            }
            setShowForm(false);
            setEditId(null);
            fetchExpenses();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save expense');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await API.delete(`/expenses/${id}`);
            toast.success('Expense deleted');
            fetchExpenses();
        } catch {
            toast.error('Failed to delete expense');
        }
    };

    const filtered = expenses.filter(e => e.type === activeTab);
    const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
    const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

    const currentType = EXPENSE_TYPES.find(t => t.value === activeTab)!;

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Header */}
            <div className="card-header" style={{ marginBottom: 24, padding: 0, border: 'none', background: 'transparent' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, color: 'var(--primary)' }}>Expenses</h1>
                    <p style={{ color: '#64748b', fontSize: 13 }}>Track school current bills and land lease payments</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary hover-lift" onClick={() => openAdd(activeTab)} style={{ gap: 8 }}>
                        <MdAdd /> Add {currentType.label}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {EXPENSE_TYPES.map(t => {
                    const total = expenses.filter(e => e.type === t.value).reduce((s, e) => s + e.amount, 0);
                    return (
                        <div key={t.value} className="stat-card glass" style={{ cursor: 'pointer', border: activeTab === t.value ? '2px solid var(--primary)' : undefined }}
                            onClick={() => setActiveTab(t.value as any)}>
                            <div className="stat-icon">{t.icon}</div>
                            <div className="stat-value" style={{ fontSize: 20 }}>{formatCurrency(total)}</div>
                            <div className="stat-label">{t.label}</div>
                        </div>
                    );
                })}
                <div className="stat-card glass-blue">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value" style={{ fontSize: 20 }}>{formatCurrency(totalAll)}</div>
                    <div className="stat-label">Total Expenses</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8, padding: '16px 20px' }}>
                    {EXPENSE_TYPES.map(t => (
                        <button key={t.value}
                            className={`btn ${activeTab === t.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setActiveTab(t.value as any)}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Expense List */}
            <div className="card glass">
                <div className="card-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}>
                        {currentType.icon} {currentType.label} Records
                    </h2>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Total: {formatCurrency(totalFiltered)}</span>
                </div>
                <div className="table-container">
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Payment Mode</th>
                                <th>Paid By</th>
                                <th>Description</th>
                                <th>Academic Year</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 48 }}>No {currentType.label.toLowerCase()} records found</td></tr>
                            ) : filtered.map((exp: Expense) => (
                                <tr key={exp._id} className="hover-lift">
                                    <td style={{ fontWeight: 600 }}>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td style={{ fontWeight: 800, color: '#ef4444' }}>{formatCurrency(exp.amount)}</td>
                                    <td><span className="badge glass" style={{ textTransform: 'capitalize' }}>{exp.paymentMode?.replace('_', ' ')}</span></td>
                                    <td>{exp.paidBy || '-'}</td>
                                    <td style={{ fontSize: 13, color: '#64748b' }}>{exp.description || '-'}</td>
                                    <td>{exp.academicYear}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(exp)} title="Edit">
                                                <MdEdit />
                                            </button>
                                            <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(exp._id)} title="Delete">
                                                <MdDelete />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <h3>{editId ? 'Edit' : 'Add'} {EXPENSE_TYPES.find(t => t.value === form.type)?.label}</h3>
                            <button className="btn-close" onClick={() => { setShowForm(false); setEditId(null); }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Expense Type</label>
                                        <select className="form-control" value={form.type}
                                            onChange={e => setForm({ ...form, type: e.target.value })}>
                                            {EXPENSE_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount (₹)</label>
                                        <input type="number" className="form-control" min="0" required
                                            value={form.amount}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                            onChange={e => setForm({ ...form, amount: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input type="date" className="form-control" required
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Mode</label>
                                        <select className="form-control" value={form.paymentMode}
                                            onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                                            {PAYMENT_MODES.map(m => (
                                                <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Paid By</label>
                                        <input type="text" className="form-control"
                                            value={form.paidBy}
                                            onChange={e => setForm({ ...form, paidBy: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Academic Year</label>
                                        <input type="text" className="form-control"
                                            value={form.academicYear}
                                            onChange={e => setForm({ ...form, academicYear: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Description</label>
                                        <input type="text" className="form-control"
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    <MdSave /> {saving ? 'Saving...' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
