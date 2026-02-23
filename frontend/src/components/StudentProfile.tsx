import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { formatCurrency, formatDate, generateFeeReceiptPDF } from '../utils/pdfUtils';
import {
    MdClose, MdPerson, MdSchool, MdPayment, MdHistory,
    MdPhone, MdEmail, MdHome, MdCalendarToday,
    MdDownload, MdPrint
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface StudentProfileProps {
    student: any;
    settings: any;
    onClose: () => void;
}

export default function StudentProfile({ student, settings, onClose }: StudentProfileProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tuition' | 'books' | 'timeline'>('overview');

    useEffect(() => {
        if (student?._id) {
            API.get(`/students/${student._id}/payments`)
                .then(res => setPayments(res.data.payments || []))
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [student?._id]);

    if (!student) return null;

    const tuitionPayments = payments.filter(p => p.feeType !== 'book');
    const bookPayments = payments.filter(p => p.feeType === 'book');

    const tuitionPaid = student.totalPaid || 0;
    const tuitionTotal = student.totalFee || 0;
    const tuitionPending = student.pendingAmount || 0;
    const tuitionPercent = tuitionTotal > 0 ? Math.round((tuitionPaid / tuitionTotal) * 100) : 0;

    const bookPaid = student.totalBookPaid || 0;
    const bookTotal = student.totalBookFee || 0;
    const bookPending = student.pendingBookAmount || 0;
    const bookPercent = bookTotal > 0 ? Math.round((bookPaid / bookTotal) * 100) : 0;

    const allPayments = [...payments].sort((a, b) =>
        new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime()
    );

    const handlePrint = (payment: any) => {
        generateFeeReceiptPDF(
            { ...student, totalPaid: tuitionPaid, pendingAmount: tuitionPending },
            payment,
            settings
        );
    };

    const ProgressBar = ({ percent, color }: { percent: number; color: string }) => (
        <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percent, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: color, borderRadius: 8 }}
            />
        </div>
    );

    const tabs = [
        { key: 'overview', label: '📊 Overview', shortLabel: '📊' },
        { key: 'tuition', label: '🎓 Tuition', shortLabel: '🎓' },
        { key: 'books', label: '📚 Books', shortLabel: '📚' },
        { key: 'timeline', label: '📅 Timeline', shortLabel: '📅' }
    ];

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="modal modal-lg"
                style={{ maxWidth: 720, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)', color: '#fff', borderRadius: '16px 16px 0 0', padding: '24px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800
                        }}>
                            {student.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{student.name}</h3>
                            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>
                                {student.class} · Roll {student.rollNo} · {student.academicYear}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                                ID: {student.studentId}
                            </div>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose} style={{ color: '#fff' }}><MdClose /></button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', gap: 0, borderBottom: '1px solid var(--border, #e2e8f0)',
                    background: 'var(--bg-secondary, #f8fafc)'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            style={{
                                flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 600,
                                background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: activeTab === tab.key ? '2px solid #1a237e' : '2px solid transparent',
                                color: activeTab === tab.key ? '#1a237e' : '#64748b',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span className="tab-label-full">{tab.label}</span>
                            <span className="tab-label-short">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
                    {/* --- OVERVIEW --- */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Contact Info */}
                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>👤 Personal & Contact</h4>
                                <div className="profile-2col-grid" style={{ display: 'grid', gap: 12 }}>
                                    <div className="highlight-box" style={{ padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>Parent/Guardian</div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{student.parentName || '-'}</div>
                                    </div>
                                    <div className="highlight-box" style={{ padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>Phone</div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                                            <a href={`tel:${student.parentPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                📞 {student.parentPhone || '-'}
                                            </a>
                                        </div>
                                    </div>
                                    {student.parentEmail && (
                                        <div className="highlight-box" style={{ padding: 12 }}>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>Email</div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{student.parentEmail}</div>
                                        </div>
                                    )}
                                    {student.address && (
                                        <div className="highlight-box" style={{ padding: 12 }}>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>Address</div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{student.address}</div>
                                        </div>
                                    )}
                                    {student.dateOfBirth && (
                                        <div className="highlight-box" style={{ padding: 12 }}>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>Date of Birth</div>
                                            <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(student.dateOfBirth)}</div>
                                        </div>
                                    )}
                                    <div className="highlight-box" style={{ padding: 12 }}>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>Gender</div>
                                        <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{student.gender || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Fee Summary Cards */}
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>💰 Fee Summary</h4>
                            <div className="profile-2col-grid" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                                {/* Tuition Card */}
                                <div style={{
                                    padding: 20, borderRadius: 14,
                                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                    border: '1px solid #bfdbfe'
                                }}>
                                    <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, marginBottom: 8 }}>🎓 TUITION FEE</div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#1e40af' }}>{formatCurrency(tuitionTotal)}</div>
                                    <ProgressBar percent={tuitionPercent} color="#3b82f6" />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                                        <span style={{ color: '#22c55e', fontWeight: 700 }}>Paid: {formatCurrency(tuitionPaid)}</span>
                                        <span style={{ color: tuitionPending > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                                            Due: {formatCurrency(tuitionPending)}
                                        </span>
                                    </div>
                                </div>

                                {/* Book Card */}
                                <div style={{
                                    padding: 20, borderRadius: 14,
                                    background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
                                    border: '1px solid #fde68a'
                                }}>
                                    <div style={{ fontSize: 12, color: '#ca8a04', fontWeight: 700, marginBottom: 8 }}>📚 BOOK FEE</div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#92400e' }}>{formatCurrency(bookTotal)}</div>
                                    <ProgressBar percent={bookPercent} color="#eab308" />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                                        <span style={{ color: '#22c55e', fontWeight: 700 }}>Paid: {formatCurrency(bookPaid)}</span>
                                        <span style={{ color: bookPending > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                                            Due: {formatCurrency(bookPending)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Payments */}
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>⏳ Recent Payments</h4>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>Loading...</div>
                            ) : allPayments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>No payments recorded</div>
                            ) : (
                                <div>
                                    {allPayments.slice(0, 5).map((p, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '10px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)'
                                        }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: p.feeType === 'book' ? '#fef9c3' : '#dbeafe',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 16
                                            }}>
                                                {p.feeType === 'book' ? '📚' : '🎓'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                    {formatCurrency(p.amount)}
                                                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6, textTransform: 'capitalize' }}>
                                                        {(p.paymentMode || 'cash').replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#6b7280' }}>{formatDate(p.paymentDate)}</div>
                                            </div>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handlePrint(p)}
                                                title="Download Receipt"
                                                style={{ fontSize: 14, padding: '4px 8px' }}
                                            >
                                                <MdDownload />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* --- TUITION TAB --- */}
                    {activeTab === 'tuition' && (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Tuition Fee Progress</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e40af' }}>
                                    {formatCurrency(tuitionPaid)} <span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>/ {formatCurrency(tuitionTotal)}</span>
                                </div>
                                <ProgressBar percent={tuitionPercent} color="#3b82f6" />
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{tuitionPercent}% completed</div>
                            </div>
                            {tuitionPayments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No tuition payments yet</div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>#</th><th>Amount</th><th>Date</th><th>Mode</th><th>Receipt</th></tr>
                                        </thead>
                                        <tbody>
                                            {tuitionPayments.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td style={{ fontWeight: 700, color: '#22c55e' }}>{formatCurrency(p.amount)}</td>
                                                    <td style={{ fontSize: 12 }}>{formatDate(p.paymentDate)}</td>
                                                    <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{(p.paymentMode || '').replace('_', ' ')}</td>
                                                    <td>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handlePrint(p)} style={{ fontSize: 12 }}>
                                                            <MdDownload /> Receipt
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* --- BOOKS TAB --- */}
                    {activeTab === 'books' && (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Book Fee Progress</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#92400e' }}>
                                    {formatCurrency(bookPaid)} <span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>/ {formatCurrency(bookTotal)}</span>
                                </div>
                                <ProgressBar percent={bookPercent} color="#eab308" />
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{bookPercent}% completed</div>
                            </div>
                            {bookPayments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No book fee payments yet</div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>#</th><th>Amount</th><th>Date</th><th>Mode</th><th>Receipt</th></tr>
                                        </thead>
                                        <tbody>
                                            {bookPayments.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td style={{ fontWeight: 700, color: '#22c55e' }}>{formatCurrency(p.amount)}</td>
                                                    <td style={{ fontSize: 12 }}>{formatDate(p.paymentDate)}</td>
                                                    <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{(p.paymentMode || '').replace('_', ' ')}</td>
                                                    <td>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handlePrint(p)} style={{ fontSize: 12 }}>
                                                            <MdDownload /> Receipt
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* --- TIMELINE TAB --- */}
                    {activeTab === 'timeline' && (
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📅 Complete Payment Timeline</h4>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>Loading...</div>
                            ) : allPayments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No payment history</div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: 32 }}>
                                    {/* Timeline line */}
                                    <div style={{
                                        position: 'absolute', left: 12, top: 0, bottom: 0,
                                        width: 2, background: 'var(--border, #e2e8f0)'
                                    }} />
                                    {allPayments.map((p, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{ position: 'relative', marginBottom: 20 }}
                                        >
                                            {/* Timeline dot */}
                                            <div style={{
                                                position: 'absolute', left: -26, top: 6,
                                                width: 12, height: 12, borderRadius: '50%',
                                                background: p.feeType === 'book' ? '#eab308' : '#3b82f6',
                                                border: '2px solid #fff',
                                                boxShadow: '0 0 0 2px ' + (p.feeType === 'book' ? '#fde68a' : '#bfdbfe')
                                            }} />
                                            <div style={{
                                                padding: '12px 16px', borderRadius: 12,
                                                background: 'var(--bg-secondary, #f8fafc)',
                                                border: '1px solid var(--border-light, #f1f5f9)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <span style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>
                                                            {formatCurrency(p.amount)}
                                                        </span>
                                                        <span className="badge" style={{
                                                            marginLeft: 8, fontSize: 10,
                                                            background: p.feeType === 'book' ? '#fef9c3' : '#dbeafe',
                                                            color: p.feeType === 'book' ? '#92400e' : '#1e40af'
                                                        }}>
                                                            {p.feeType === 'book' ? '📚 Book' : '🎓 Tuition'}
                                                        </span>
                                                    </div>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handlePrint(p)} style={{ fontSize: 12, padding: '2px 8px' }}>
                                                        <MdDownload />
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                                                    {formatDate(p.paymentDate)} · <span style={{ textTransform: 'capitalize' }}>{(p.paymentMode || 'cash').replace('_', ' ')}</span>
                                                    {p.remarks && <span> · {p.remarks}</span>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </motion.div>
        </div>
    );
}
