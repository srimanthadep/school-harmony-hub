import React from 'react';
import { MdClose } from 'react-icons/md';

interface EditPaymentModalProps {
    show: any;
    editForm: any;
    loading: boolean;
    paymentModes: string[];
    onClose: () => void;
    onFormChange: (form: any) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function EditPaymentModal({
    show,
    editForm,
    loading,
    paymentModes,
    onClose,
    onFormChange,
    onSubmit
}: EditPaymentModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 500 }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: '12px 12px 0 0' }}>
                    <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        👑 Edit Fee Payment
                    </h3>
                    <button className="btn-close" style={{ color: '#fff' }} onClick={onClose}><MdClose /></button>
                </div>
                <div className="modal-body">
                    <div className="highlight-box" style={{ marginBottom: 16, background: '#f5f3ff', border: '1px solid #c4b5fd' }}>
                        <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>⚠️ Owner-only action</div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                            Editing receipt <strong>{show.payment.receiptNo}</strong>
                        </div>
                    </div>
                    <form id="edit-payment-form" onSubmit={onSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Amount (₹) <span className="required">*</span></label>
                                <input type="number" className="form-control"
                                    value={editForm.amount}
                                    onChange={e => onFormChange({ ...editForm, amount: e.target.value })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    min={0} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Date</label>
                                <input type="date" className="form-control"
                                    value={editForm.paymentDate}
                                    onChange={e => onFormChange({ ...editForm, paymentDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Mode</label>
                                <select className="form-control"
                                    value={editForm.paymentMode}
                                    onChange={e => onFormChange({ ...editForm, paymentMode: e.target.value })}>
                                    {paymentModes.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Remarks</label>
                                <input className="form-control"
                                    value={editForm.remarks}
                                    onChange={e => onFormChange({ ...editForm, remarks: e.target.value })}
                                    placeholder="Optional note" />
                            </div>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button form="edit-payment-form" type="submit"
                        className="btn"
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>
                        {loading ? 'Saving...' : '✓ Update Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}
