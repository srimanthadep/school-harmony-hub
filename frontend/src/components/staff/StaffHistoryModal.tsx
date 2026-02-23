import React from 'react';
import { MdHistory, MdClose, MdDownload, MdEdit, MdDelete } from 'react-icons/md';
import { formatCurrency, formatDate } from '../../utils/pdfUtils';
import { Staff, SalaryPayment } from '../../types';

interface StaffHistoryModalProps {
    show: Staff | null;
    historyData: any;
    userRole: string | undefined;
    onClose: () => void;
    onDownloadSlip: (p: SalaryPayment) => void;
    onEditSalary: (p: SalaryPayment) => void;
    onDeleteSalary: (id: string) => void;
    onReverseHistory: () => void;
}

export default function StaffHistoryModal({
    show,
    historyData,
    userRole,
    onClose,
    onDownloadSlip,
    onEditSalary,
    onDeleteSalary,
    onReverseHistory
}: StaffHistoryModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h3><MdHistory /> Salary History - {show.name}</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <div className="modal-body">
                    {historyData ? (
                        <>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                <div className="highlight-box" style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Monthly Salary</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1a237e' }}>{formatCurrency(historyData.monthlySalary)}</div>
                                </div>
                                <div className="highlight-box" style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Total Paid</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#43a047' }}>{formatCurrency(historyData.totalSalaryPaid)}</div>
                                </div>
                            </div>
                            {historyData.salaryPayments?.length === 0 ? (
                                <div className="empty-state" style={{ padding: 30 }}>
                                    <p style={{ color: '#9ca3af' }}>No salary payments recorded yet</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Sort:</span>
                                        <button
                                            className="btn btn-sm"
                                            onClick={onReverseHistory}
                                            style={{ padding: '4px 12px', fontSize: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
                                        >
                                            🔼 Newest First &nbsp;↔&nbsp; 🔽 Oldest First
                                        </button>
                                    </div>
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Slip No</th>
                                                    <th>Month</th>
                                                    <th>Amount</th>
                                                    <th>Date</th>
                                                    <th>Mode</th>
                                                    <th>Download</th>
                                                    {userRole === 'owner' && (
                                                        <>
                                                            <th>Edit</th>
                                                            <th>Delete</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historyData.salaryPayments?.map((p: SalaryPayment, i: number) => (
                                                    <tr key={i}>
                                                        <td><code style={{ fontSize: 12, color: '#1a237e' }}>{p.slipNo || '-'}</code></td>
                                                        <td style={{ fontWeight: 600 }}>{p.month}</td>
                                                        <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(p.amount)}</td>
                                                        <td style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(p.paymentDate)}</td>
                                                        <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{(p.paymentMode || '').replace('_', ' ')}</td>
                                                        <td>
                                                            <button className="btn btn-secondary btn-sm" title="Download Slip"
                                                                onClick={() => onDownloadSlip(p)}>
                                                                <MdDownload />
                                                            </button>
                                                        </td>
                                                        {userRole === 'owner' && (
                                                            <>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        title="Edit Payment"
                                                                        style={{
                                                                            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                                                                            color: '#fff', border: 'none', borderRadius: 6,
                                                                            padding: '4px 10px', cursor: 'pointer',
                                                                            display: 'flex', alignItems: 'center', gap: 4
                                                                        }}
                                                                        onClick={() => onEditSalary(p)}
                                                                    >
                                                                        <MdEdit style={{ fontSize: 14 }} /> Edit
                                                                    </button>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        title="Delete Payment"
                                                                        style={{
                                                                            background: '#ef4444',
                                                                            color: '#fff', border: 'none', borderRadius: 6,
                                                                            padding: '4px 10px', cursor: 'pointer',
                                                                            display: 'flex', alignItems: 'center', gap: 4
                                                                        }}
                                                                        onClick={() => onDeleteSalary(p._id)}
                                                                    >
                                                                        <MdDelete style={{ fontSize: 14 }} /> Delete
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </>
                    ) : <div className="loading-spinner"><div className="spinner" /></div>}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
