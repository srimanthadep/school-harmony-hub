import React from 'react';
import { MdClose } from 'react-icons/md';

interface DeleteConfirmModalProps {
    show: any;
    title: string;
    message: string;
    confirmText: string;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    danger?: boolean;
}

export default function DeleteConfirmModal({
    show,
    title,
    message,
    confirmText,
    loading,
    onClose,
    onConfirm,
    danger = true
}: DeleteConfirmModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !loading && onClose()}>
            <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-header" style={danger ? { background: '#ef4444', color: '#fff' } : {}}>
                    <h3>{danger && '⚠️ '}{title}</h3>
                    <button className="btn-close" style={danger ? { color: '#fff' } : {}} onClick={onClose} disabled={loading}><MdClose /></button>
                </div>
                <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
                    <div style={{ fontSize: 50, marginBottom: 15 }}>{danger ? '🗑️' : '❓'}</div>
                    {typeof message === 'string' ? <p>{message}</p> : message}
                    {danger && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 10 }}>This action cannot be undone.</p>}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                        disabled={loading}
                        onClick={onConfirm}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
