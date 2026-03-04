import React from 'react';
import {
    MdClose, MdPayments, MdAccountBalance, MdCreditCard,
    MdMenuBook, MdSchool, MdArrowForward, MdLock
} from 'react-icons/md';
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

const MODE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    cash:   { label: 'Cash',   icon: <MdPayments size={22} /> },
    online: { label: 'Online', icon: <MdAccountBalance size={22} /> },
    cheque: { label: 'Cheque', icon: <MdCreditCard size={22} /> },
    dd:     { label: 'DD',     icon: <MdCreditCard size={22} /> },
};

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

    const isTuition = paymentForm.feeType === 'tuition';
    const summaryTotal   = isTuition ? (show.totalFee || 0)        : (show.totalBookFee || 0);
    const summaryPaid    = isTuition ? (show.totalPaid || 0)        : (show.totalBookPaid || 0);
    const summaryPending = isTuition ? (show.pendingAmount || 0)    : (show.pendingBookAmount || 0);

    const initials = (show.name || '')
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase();

    const cardBase: React.CSSProperties = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        borderRadius: 12, border: '2px solid #e2e8f0', padding: '12px 8px',
        cursor: 'pointer', transition: 'all 0.18s', background: 'var(--bg-secondary)',
        flex: 1, textAlign: 'center',
    };
    const cardActive: React.CSSProperties = {
        borderColor: 'var(--primary)', background: 'rgba(26,35,126,0.06)',
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}>

                {/* ── Top Bar ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px 12px', borderBottom: '1px solid var(--border-light)',
                    background: 'var(--bg-secondary)',
                }}>
                    <button className="btn-close" onClick={onClose} style={{ marginLeft: 0 }}>
                        <MdClose size={20} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', flex: 1, textAlign: 'center' }}>
                        Record Fee Payment
                    </h3>
                    <div style={{ width: 32 }} />
                </div>

                <div style={{ padding: '0 20px 20px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>

                    {/* ── Student Profile ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 12px' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'rgba(26,35,126,0.1)', border: '3px solid var(--bg-secondary)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)' }}>{initials}</span>
                        </div>
                        <p style={{ margin: '10px 0 2px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{show.name}</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{show.class}</p>
                    </div>

                    {/* ── Summary Card ── */}
                    <div style={{
                        borderRadius: 16, padding: '18px 20px', background: 'var(--primary)',
                        color: '#fff', boxShadow: '0 8px 24px rgba(26,35,126,0.25)', marginBottom: 20,
                    }}>
                        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 500, opacity: 0.85 }}>
                            {isTuition ? 'Tuition Fee' : "Book's Fee"} — Amount Due
                        </p>
                        <p style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700 }}>
                            {formatCurrency(summaryPending)}
                        </p>
                        <div style={{ display: 'flex', gap: 16, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10, fontSize: 12 }}>
                            <span>Total: <strong>{formatCurrency(summaryTotal)}</strong></span>
                            <span>Paid: <strong style={{ color: '#a5d6a7' }}>{formatCurrency(summaryPaid)}</strong></span>
                            <span>Pending: <strong style={{ color: '#ef9a9a' }}>{formatCurrency(summaryPending)}</strong></span>
                        </div>
                    </div>

                    <form id="payment-form" onSubmit={onSubmit}>

                        {/* ── Fee Type ── */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>
                                Fee Type <span style={{ color: 'var(--danger)' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {[
                                    { value: 'tuition', label: 'Tuition', icon: <MdSchool size={22} /> },
                                    { value: 'book',    label: 'Book',    icon: <MdMenuBook size={22} /> },
                                ].map(opt => {
                                    const active = paymentForm.feeType === opt.value;
                                    return (
                                        <label key={opt.value} style={{ ...cardBase, ...(active ? cardActive : {}) }}>
                                            <input type="radio" name="feeType" value={opt.value} checked={active}
                                                onChange={e => setPaymentForm({ ...paymentForm, feeType: e.target.value })}
                                                style={{ display: 'none' }} />
                                            <span style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>{opt.icon}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                {opt.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Amount ── */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                                Amount (₹) <span style={{ color: 'var(--danger)' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)', fontWeight: 600, fontSize: 16,
                                }}>₹</span>
                                <input type="number" className="form-control"
                                    style={{ paddingLeft: 32, height: 52, fontSize: 18, fontWeight: 600, borderRadius: 12 }}
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    min={0} step={1} placeholder="0" />
                            </div>
                        </div>

                        {/* ── Payment Method ── */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>
                                Payment Method
                            </label>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {paymentModes.map(m => {
                                    const cfg = MODE_CONFIG[m] || { label: m.toUpperCase(), icon: <MdPayments size={22} /> };
                                    const active = paymentForm.paymentMode === m;
                                    return (
                                        <label key={m} style={{ ...cardBase, minWidth: 72, ...(active ? cardActive : {}) }}>
                                            <input type="radio" name="paymentMode" value={m} checked={active}
                                                onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                                                style={{ display: 'none' }} />
                                            <span style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>{cfg.icon}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                {cfg.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Date & Remarks ── */}
                        <div className="form-grid" style={{ marginBottom: 4 }}>
                            <div className="form-group">
                                <label className="form-label">Payment Date</label>
                                <input type="date" className="form-control"
                                    value={paymentForm.paymentDate}
                                    onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Note / Receipt No.</label>
                                <input className="form-control" value={paymentForm.remarks}
                                    onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                    placeholder="Optional" />
                            </div>
                        </div>

                    </form>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '14px 20px', borderTop: '1px solid var(--border-light)',
                    background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <button form="payment-form" type="submit"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700,
                            cursor: paymentLoading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(26,35,126,0.3)',
                            opacity: paymentLoading ? 0.75 : 1, transition: 'all 0.2s',
                        }}
                        disabled={paymentLoading}>
                        {paymentLoading ? 'Processing...' : (
                            <><span>Confirm Payment</span><MdArrowForward size={18} /></>
                        )}
                    </button>
                    <p style={{ margin: 0, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <MdLock size={11} /> Secure Transaction
                    </p>
                </div>

            </div>
        </div>
    );
}