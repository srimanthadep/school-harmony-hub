import React from 'react';
import { MdHistory, MdClose, MdDownload, MdEdit, MdDelete } from 'react-icons/md';
import { formatCurrency, formatDate } from '../../utils/pdfUtils';
import { Student, PaymentHistoryResponse } from '../../types';

interface PaymentHistoryModalProps {
    show: Student | null;
    historyData: PaymentHistoryResponse | null;
    isOwner: boolean;
    settings: any;
    onClose: () => void;
    onDownload: (student: Student, payment: any) => void;
    onEdit: (payment: any) => void;
    onDelete: (id: string) => void;
}

export default function PaymentHistoryModal({
    show,
    historyData,
    isOwner,
    settings,
    onClose,
    onDownload,
    onEdit,
    onDelete
}: PaymentHistoryModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h3><MdHistory /> Payment History - {show.name}</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <div className="modal-body">
                    {historyData ? (
                        <>
                            <div className="mobile-stack" style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                <div className="highlight-box" style={{ flex: 1, borderLeft: '4px solid #3b82f6' }}>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Tuition Total / Paid / Pending</div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                                        {formatCurrency(show.totalFee)} / <span style={{ color: '#43a047' }}>{formatCurrency(historyData.totalPaid)}</span> / <span style={{ color: '#e53935' }}>{formatCurrency(historyData.pendingAmount)}</span>
                                    </div>
                                </div>
                                <div className="highlight-box" style={{ flex: 1, borderLeft: '4px solid #8b5cf6' }}>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Book's Total / Paid / Pending</div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                                        {formatCurrency(show.totalBookFee || 0)} / <span style={{ color: '#43a047' }}>{formatCurrency(historyData.totalBookPaid || 0)}</span> / <span style={{ color: '#e53935' }}>{formatCurrency(historyData.pendingBookAmount || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            {historyData.payments.length === 0 ? (
                                <div className="empty-state" style={{ padding: 30 }}>
                                    <p style={{ color: '#9ca3af' }}>No payments recorded yet</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Receipt No</th>
                                                <th>Amount</th>
                                                <th>Type</th>
                                                <th>Date</th>
                                                <th>Mode</th>
                                                <th>Remarks</th>
                                                <th>Download</th>
                                                {isOwner && (
                                                    <>
                                                        <th>Edit</th>
                                                        <th>Delete</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historyData.payments.map((p, i) => (
                                                <tr key={i}>
                                                    <td><code style={{ fontSize: 12, color: '#1a237e' }}>{p.receiptNo || '-'}</code></td>
                                                    <td style={{ fontWeight: 700, color: '#43a047' }}>{formatCurrency(p.amount)}</td>
                                                    <td style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 600 }}>{p.feeType || 'tuition'}</td>
                                                    <td style={{ fontSize: 13 }}>{formatDate(p.paymentDate)}</td>
                                                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{p.paymentMode}</td>
                                                    <td style={{ fontSize: 12, color: '#6b7280' }}>{p.remarks || '-'}</td>
                                                    <td>
                                                        <button className="btn btn-secondary btn-sm" title="Download Receipt"
                                                            onClick={() => onDownload(show, p)}>
                                                            <MdDownload />
                                                        </button>
                                                    </td>
                                                    {isOwner && (
                                                        <>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    title="Edit Payment"
                                                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                    onClick={() => onEdit(p)}
                                                                >
                                                                    <MdEdit style={{ fontSize: 14 }} /> Edit
                                                                </button>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    title="Delete Payment"
                                                                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                    onClick={() => onDelete(p._id)}
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
                            )}
                        </>
                    ) : (
                        <div className="loading-spinner"><div className="spinner" /></div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
