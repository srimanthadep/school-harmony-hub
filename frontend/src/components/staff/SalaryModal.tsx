import React from 'react';
import { MdPayment, MdClose, MdPerson } from 'react-icons/md';
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

    const netPay = Number(salaryForm.amount) || 0;
    const baseAmount = Number(salaryForm.baseAmount) || 0;
    const cuttings = Number(salaryForm.cuttings) || 0;

    return (
        <div className="bottom-sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bottom-sheet">
                <button className="bottom-sheet-handle-btn" onClick={onClose} aria-label="Close">
                    <div className="bottom-sheet-handle" />
                </button>
                <div className="bottom-sheet-scroll">
                    <div className="bottom-sheet-header">
                        <h3 className="bottom-sheet-title"><MdPayment /> Pay Salary</h3>
                        <button className="btn-close" onClick={onClose}><MdClose /></button>
                    </div>
                    <form onSubmit={onSubmit}>
                        <div className="bottom-sheet-body">
                            {/* Staff Member Card */}
                            <div className="form-group">
                                <label className="form-label">Staff Member</label>
                                <div className="salary-staff-card">
                                    <div className="salary-staff-avatar"><MdPerson size={22} /></div>
                                    <div>
                                        <div className="salary-staff-name">{show.name}</div>
                                        <div className="salary-staff-meta">
                                            {roleDisplay(show.role)}{show.subject ? ` · ${show.subject}` : ''} · ID: {show.staffId}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Payment Month <span className="required">*</span></label>
                                    <select className="form-control" value={salaryForm.month}
                                        onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })}>
                                        {months.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Base Salary (₹) <span className="required">*</span></label>
                                    <input type="number" className="form-control" value={salaryForm.baseAmount}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        onChange={e => {
                                            const baseAmount = e.target.value;
                                            const deductions = salaryForm.cuttings || 0;
                                            setSalaryForm({
                                                ...salaryForm,
                                                baseAmount,
                                                amount: Math.max(0, Number(baseAmount) - Number(deductions))
                                            });
                                        }} min={0} placeholder="0" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deductions (₹)</label>
                                    <input type="number" className="form-control" value={salaryForm.cuttings}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        onChange={e => {
                                            const deductions = e.target.value;
                                            const baseAmount = salaryForm.baseAmount || 0;
                                            setSalaryForm({
                                                ...salaryForm,
                                                cuttings: deductions,
                                                amount: Math.max(0, Number(baseAmount) - Number(deductions))
                                            });
                                        }} min={0} placeholder="0" />
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
                            </div>

                            {/* Net Pay Calculation */}
                            <div className="net-pay-box">
                                <div className="net-pay-row">
                                    <span className="net-pay-label">Base Salary</span>
                                    <span className="net-pay-value">{formatCurrency(baseAmount)}</span>
                                </div>
                                <div className="net-pay-row" style={{ color: 'var(--danger)' }}>
                                    <span>Total Deductions</span>
                                    <span>-{formatCurrency(cuttings)}</span>
                                </div>
                                <hr className="net-pay-divider" />
                                <div className="net-pay-row net-pay-total">
                                    <span>Net Pay</span>
                                    <span className="net-pay-amount">{formatCurrency(netPay)}</span>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="form-group">
                                <label className="form-label">Payment Note (Optional)</label>
                                <textarea className="form-control" value={salaryForm.remarks} rows={2}
                                    onChange={e => setSalaryForm({ ...salaryForm, remarks: e.target.value })}
                                    placeholder="e.g. Performance bonus included" />
                            </div>
                        </div>

                        <div className="bottom-sheet-footer">
                            <button type="submit" className="btn btn-success btn-block" disabled={salaryLoading}>
                                <MdPayment /> {salaryLoading ? 'Processing...' : 'Confirm Payment'}
                            </button>
                            <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}