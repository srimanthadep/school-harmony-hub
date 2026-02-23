import React from 'react';
import { MdPayment, MdClose } from 'react-icons/md';
import { formatCurrency } from '../../utils/pdfUtils';
import { Staff } from '../../types';

interface SalaryModalProps {
    show: Staff | null;
    salaryForm: any;
    salaryLoading: boolean;
    months: string[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    setSalaryForm: (data: any) => void;
    roleDisplay: (r: string) => string;
}

export default function SalaryModal({
    show,
    salaryForm,
    salaryLoading,
    months,
    onClose,
    onSubmit,
    setSalaryForm,
    roleDisplay
}: SalaryModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h3><MdPayment /> Pay Salary - {show.name}</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">
                        <div className="highlight-box" style={{ marginBottom: 16 }}>
                            <strong>{show.name}</strong> · {roleDisplay(show.role)}
                            {show.subject && ` · ${show.subject}`}
                            <div style={{ marginTop: 6, fontSize: 14 }}>
                                Monthly Salary: <strong style={{ color: '#1a237e' }}>{formatCurrency(show.monthlySalary)}</strong>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Month <span className="required">*</span></label>
                                <select className="form-control" value={salaryForm.month}
                                    onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })}>
                                    {months.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Base Amount (₹) <span className="required">*</span></label>
                                <input type="number" className="form-control" value={salaryForm.baseAmount}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => {
                                        const baseAmount = e.target.value;
                                        const cuttings = salaryForm.cuttings || 0;
                                        setSalaryForm({
                                            ...salaryForm,
                                            baseAmount,
                                            amount: Math.max(0, Number(baseAmount) - Number(cuttings))
                                        });
                                    }} min={0} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cuttings (₹)</label>
                                <input type="number" className="form-control" value={salaryForm.cuttings}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => {
                                        const cuttings = e.target.value;
                                        const baseAmount = salaryForm.baseAmount || 0;
                                        setSalaryForm({
                                            ...salaryForm,
                                            cuttings,
                                            amount: Math.max(0, Number(baseAmount) - Number(cuttings))
                                        });
                                    }} min={0} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Final Amount (₹) <span className="required">*</span></label>
                                <input type="number" className="form-control" value={salaryForm.amount}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => setSalaryForm({ ...salaryForm, amount: e.target.value })} min={0} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Date</label>
                                <input type="date" className="form-control" value={salaryForm.paymentDate}
                                    onChange={e => setSalaryForm({ ...salaryForm, paymentDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Mode</label>
                                <select className="form-control" value={salaryForm.paymentMode}
                                    onChange={e => setSalaryForm({ ...salaryForm, paymentMode: e.target.value })}>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Remarks</label>
                                <input className="form-control" value={salaryForm.remarks}
                                    onChange={e => setSalaryForm({ ...salaryForm, remarks: e.target.value })}
                                    placeholder="Optional remarks" />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-success" disabled={salaryLoading}>
                            {salaryLoading ? 'Processing...' : '✓ Pay Salary'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
