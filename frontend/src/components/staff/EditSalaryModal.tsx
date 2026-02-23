import React from 'react';
import { MdEdit, MdClose } from 'react-icons/md';

interface EditSalaryModalProps {
    show: any;
    editForm: any;
    loading: boolean;
    months: string[];
    onClose: () => void;
    onFormChange: (form: any) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function EditSalaryModal({
    show,
    editForm,
    loading,
    months,
    onClose,
    onFormChange,
    onSubmit
}: EditSalaryModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h3><MdEdit /> Edit Salary Payment</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Month <span className="required">*</span></label>
                                <select className="form-control" value={editForm.month}
                                    onChange={e => onFormChange({ ...editForm, month: e.target.value })}>
                                    {months.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Base Amount (₹) <span className="required">*</span></label>
                                <input type="number" className="form-control"
                                    value={editForm.baseAmount}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => {
                                        const baseAmount = e.target.value;
                                        const cuttings = editForm.cuttings || 0;
                                        onFormChange({
                                            ...editForm,
                                            baseAmount,
                                            amount: Math.max(0, Number(baseAmount) - Number(cuttings))
                                        });
                                    }} min={0} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cuttings (₹)</label>
                                <input type="number" className="form-control"
                                    value={editForm.cuttings}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => {
                                        const cuttings = e.target.value;
                                        const baseAmount = editForm.baseAmount || 0;
                                        onFormChange({
                                            ...editForm,
                                            cuttings,
                                            amount: Math.max(0, Number(baseAmount) - Number(cuttings))
                                        });
                                    }} min={0} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Final Amount (₹) <span className="required">*</span></label>
                                <input type="number" className="form-control"
                                    value={editForm.amount}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => onFormChange({ ...editForm, amount: e.target.value })} min={0} disabled />
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
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Remarks</label>
                                <textarea className="form-control" rows={2}
                                    value={editForm.remarks}
                                    onChange={e => onFormChange({ ...editForm, remarks: e.target.value })}
                                    placeholder="Update remarks..." />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Update Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
