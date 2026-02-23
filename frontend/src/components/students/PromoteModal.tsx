import React from 'react';
import { MdClose } from 'react-icons/md';

interface PromoteModalProps {
    show: boolean;
    promoteLoading: boolean;
    promoteResult: any;
    promoteForm: { fromYear: string; toYear: string };
    academicYears: string[];
    onClose: () => void;
    onFormChange: (field: string, value: string) => void;
    onPromote: () => void;
}

export default function PromoteModal({
    show,
    promoteLoading,
    promoteResult,
    promoteForm,
    academicYears,
    onClose,
    onFormChange,
    onPromote
}: PromoteModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !promoteLoading && onClose()}>
            <div className="modal" style={{ maxWidth: 500 }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '12px 12px 0 0' }}>
                    <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>🎓 Promote Students</h3>
                    <button className="btn-close" style={{ color: '#fff' }} onClick={onClose} disabled={promoteLoading}><MdClose /></button>
                </div>
                <div className="modal-body">
                    {promoteResult ? (
                        <div>
                            <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #86efac', marginBottom: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d' }}>Promotion Complete!</div>
                                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>{promoteResult.message}</div>
                            </div>
                            <div className="promote-result-grid" style={{ gap: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div style={{ textAlign: 'center', padding: 12, background: '#eff6ff', borderRadius: 8 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{promoteResult.promoted}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Promoted</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: 12, background: '#fef3c7', borderRadius: 8 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{promoteResult.graduated}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Graduated (10th)</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#6b7280' }}>{promoteResult.skipped}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Skipped</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, marginBottom: 20 }}>
                                <div style={{ fontWeight: 700, color: '#c2410c', fontSize: 14, marginBottom: 6 }}>⚠️ Important — Read before proceeding</div>
                                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
                                    <li>All active students from <strong>{promoteForm.fromYear}</strong> will be moved to <strong>{promoteForm.toYear}</strong></li>
                                    <li>Each student is promoted to the <strong>next class</strong> (Nursery→LKG, 1st→2nd, etc.)</li>
                                    <li>Fee payment history is <strong>cleared</strong> — fresh start for the new year</li>
                                    <li>Fees are updated from the new year's fee structure (if set)</li>
                                    <li>10th class students are <strong>graduated</strong> (marked inactive)</li>
                                    <li style={{ color: '#dc2626', fontWeight: 600 }}>This action cannot be undone!</li>
                                </ul>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">From Academic Year (current)</label>
                                    <select className="form-control" value={promoteForm.fromYear}
                                        onChange={e => onFormChange('fromYear', e.target.value)}>
                                        {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">To Academic Year (new)</label>
                                    <select className="form-control" value={promoteForm.toYear}
                                        onChange={e => onFormChange('toYear', e.target.value)}>
                                        {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={promoteLoading}>
                        {promoteResult ? 'Close' : 'Cancel'}
                    </button>
                    {!promoteResult && (
                        <button className="btn" disabled={promoteLoading || promoteForm.fromYear === promoteForm.toYear}
                            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff' }}
                            onClick={onPromote}>
                            {promoteLoading ? '⏳ Processing...' : '🎓 Confirm & Promote'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
