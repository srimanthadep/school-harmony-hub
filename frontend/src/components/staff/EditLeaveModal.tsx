import React from 'react';
import { MdEdit, MdClose } from 'react-icons/md';

interface EditLeaveModalProps {
    show: any;
    editForm: { date: string; reason: string; status: string };
    loading: boolean;
    onClose: () => void;
    onFormChange: (form: any) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function EditLeaveModal({
    show,
    editForm,
    loading,
    onClose,
    onFormChange,
    onSubmit
}: EditLeaveModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 450 }}>
                <div className="modal-header">
                    <h3><MdEdit /> Edit Leave</h3>
                    <button className="btn-close" onClick={onClose}><MdClose /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Date <span className="required">*</span></label>
                                <input type="date" className="form-control"
                                    value={editForm.date}
                                    onChange={e => onFormChange({ ...editForm, date: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Status</label>
                                <select className="form-control"
                                    value={editForm.status}
                                    onChange={e => onFormChange({ ...editForm, status: e.target.value })}>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Reason</label>
                                <textarea className="form-control" rows={2}
                                    value={editForm.reason}
                                    onChange={e => onFormChange({ ...editForm, reason: e.target.value })}
                                    placeholder="Leave reason..." />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Update Leave'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
