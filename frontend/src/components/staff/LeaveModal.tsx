import React from 'react';
import { MdDateRange, MdClose, MdEdit, MdDelete } from 'react-icons/md';
import { formatDate } from '../../utils/pdfUtils';
import { Staff } from '../../types';

interface LeaveModalProps {
    show: Staff | null;
    leaveForm: { date: string; reason: string };
    leaveLoading: boolean;
    userRole: string | undefined;
    onClose: () => void;
    onRecordLeave: (e: React.FormEvent) => void;
    onDeleteLeave: (id: string) => void;
    onEditLeave: (leave: any) => void;
    setLeaveForm: (form: any) => void;
}

export default function LeaveModal({
    show,
    leaveForm,
    leaveLoading,
    userRole,
    onClose,
    onRecordLeave,
    onDeleteLeave,
    onEditLeave,
    setLeaveForm
}: LeaveModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <div className="modal-header">
                    <h3><MdDateRange /> Leaves - {show.name}</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <div className="modal-body">
                    <form onSubmit={onRecordLeave} style={{ marginBottom: 20, padding: 16, background: 'var(--bg-secondary, #f8fafc)', borderRadius: 8 }}>
                        <h4>Record New Leave</h4>
                        <div className="form-grid" style={{ alignItems: 'end' }}>
                            <div className="form-group">
                                <label className="form-label">Date <span className="required">*</span></label>
                                <input type="date" className="form-control" value={leaveForm.date}
                                    onChange={e => setLeaveForm({ ...leaveForm, date: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Reason</label>
                                <input className="form-control" value={leaveForm.reason}
                                    placeholder="e.g. Sick Leave, Vacation"
                                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <button type="submit" className="btn btn-primary" disabled={leaveLoading}>
                                    {leaveLoading ? 'Saving...' : 'Record Leave'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <h4>Leave History</h4>
                    {!show.leaves || show.leaves.length === 0 ? (
                        <div className="empty-state" style={{ padding: 20 }}>
                            <p style={{ color: '#9ca3af' }}>No leaves recorded</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        {userRole === 'owner' && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {show.leaves.map((leave, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{formatDate(leave.date)}</td>
                                            <td>{leave.reason || '-'}</td>
                                            <td><span className={`badge ${leave.status === 'approved' ? 'badge-paid' : leave.status === 'rejected' ? 'badge-unpaid' : ''}`} style={{ textTransform: 'capitalize' }}>{leave.status}</span></td>
                                            {userRole === 'owner' && (
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            className="btn btn-sm"
                                                            title="Edit Leave"
                                                            style={{
                                                                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                                                                color: '#fff', border: 'none', borderRadius: 6,
                                                                padding: '4px 10px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: 4
                                                            }}
                                                            onClick={() => onEditLeave(leave)}
                                                        >
                                                            <MdEdit style={{ fontSize: 13 }} /> Edit
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-icon"
                                                            title="Delete Leave"
                                                            style={{ color: '#ef4444' }}
                                                            onClick={() => onDeleteLeave(leave._id)}
                                                        >
                                                            <MdDelete />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
