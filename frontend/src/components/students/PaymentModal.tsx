import React from 'react';
import { MdPayment, MdClose } from 'react-icons/md';
import { formatCurrency } from '../../utils/pdfUtils';

interface PaymentModalProps {
    show: any;
    paymentForm: any;
    paymentLoading: boolean;
    paymentModes: string[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    setPaymentForm: (form: any) => void;
}

export default function PaymentModal({
    show,
    paymentForm,
    paymentLoading,
    paymentModes,
    onClose,
    onSubmit,
    setPaymentForm
}: PaymentModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h3><MdPayment /> Record Fee Payment</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <div className="modal-body">
                    <div className="highlight-box" style={{ marginBottom: 16 }}>
                        <strong>{show.name}</strong> - {show.class}
                        <div style={{ marginTop: 12, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tuition Fee:</div>
                            <div style={{ display: 'flex', gap: 20 }}>
                                <span style={{ fontSize: 13 }}>Total: <strong>{formatCurrency(show.totalFee)}</strong></span>
                                <span style={{ fontSize: 13 }}>Paid: <strong style={{ color: '#43a047' }}>{formatCurrency(show.totalPaid)}</strong></span>
                                <span style={{ fontSize: 13 }}>Pending: <strong style={{ color: '#e53935' }}>{formatCurrency(show.pendingAmount)}</strong></span>
                            </div>
                        </div>
                        <div style={{ marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Book's Fee:</div>
                            <div style={{ display: 'flex', gap: 20 }}>
                                <span style={{ fontSize: 13 }}>Total: <strong>{formatCurrency(show.totalBookFee || 0)}</strong></span>
                                <span style={{ fontSize: 13 }}>Paid: <strong style={{ color: '#43a047' }}>{formatCurrency(show.totalBookPaid || 0)}</strong></span>
                                <span style={{ fontSize: 13 }}>Pending: <strong style={{ color: '#e53935' }}>{formatCurrency(show.pendingBookAmount || 0)}</strong></span>
                            </div>
                        </div>
                    </div>
                    <form id="payment-form" onSubmit={onSubmit}>
                        <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Payment For <span className="required">*</span></label>
                                <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="radio" name="feeType" value="tuition" checked={paymentForm.feeType === 'tuition'} onChange={e => setPaymentForm({ ...paymentForm, feeType: e.target.value })} />
                                        Tuition Fee
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="radio" name="feeType" value="book" checked={paymentForm.feeType === 'book'} onChange={e => setPaymentForm({ ...paymentForm, feeType: e.target.value })} />
                                        Book's Fee
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (₹) <span className="required">*</span></label>
                                <input type="number" className="form-control"
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    min={0} step={1} placeholder="Enter amount" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Date</label>
                                <input type="date" className="form-control"
                                    value={paymentForm.paymentDate}
                                    onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Mode</label>
                                <select className="form-control" value={paymentForm.paymentMode}
                                    onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}>
                                    {paymentModes.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Remarks</label>
                                <input className="form-control" value={paymentForm.remarks}
                                    onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                    placeholder="Optional note" />
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button form="payment-form" type="submit" className="btn btn-success" disabled={paymentLoading}>
                        {paymentLoading ? 'Processing...' : '✓ Record Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
