import React from 'react';
import { MdClose } from 'react-icons/md';

interface BulkImportModalProps {
    show: boolean;
    importForm: { class: string; academicYear: string; file: File | null };
    importLoading: boolean;
    classes: string[];
    academicYears: string[];
    onClose: () => void;
    onFileChange: (file: File | null) => void;
    onFormChange: (field: string, value: string) => void;
    onImport: () => void;
}

export default function BulkImportModal({
    show,
    importForm,
    importLoading,
    classes,
    academicYears,
    onClose,
    onFileChange,
    onFormChange,
    onImport
}: BulkImportModalProps) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !importLoading && onClose()}>
            <div className="modal" style={{ maxWidth: 500 }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg,#64748b,#475569)', borderRadius: '12px 12px 0 0' }}>
                    <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>📤 Bulk Import Students</h3>
                    <button className="btn-close" style={{ color: '#fff' }} onClick={onClose} disabled={importLoading}><MdClose /></button>
                </div>
                <div className="modal-body">
                    <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, color: '#475569', fontSize: 14, marginBottom: 6 }}>Instructions</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                            <li>Only <strong>Student Name</strong> is strictly required in the file.</li>
                            <li>If <strong>Class</strong> is not in the file, we'll use the one you select below.</li>
                            <li>If <strong>Parent Phone</strong> is missing, it marks as "0000000000".</li>
                            <li>Supports <strong>.csv, .xlsx, .xls</strong> formats.</li>
                        </ul>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Default Class (if not in file)</label>
                            <select className="form-control" value={importForm.class}
                                onChange={e => onFormChange('class', e.target.value)}>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Academic Year</label>
                            <select className="form-control" value={importForm.academicYear}
                                onChange={e => onFormChange('academicYear', e.target.value)}>
                                {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Select File (.csv, .xlsx)</label>
                            <div
                                onClick={() => (document.getElementById('bulk-file-input') as HTMLInputElement)?.click()}
                                style={{
                                    border: '2px dashed #cbd5e1',
                                    borderRadius: 12,
                                    padding: '24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: importForm.file ? '#f0fdf4' : '#f8fafc',
                                    borderColor: importForm.file ? '#22c55e' : '#cbd5e1'
                                }}
                            >
                                <div style={{ fontSize: 24, marginBottom: 8 }}>{importForm.file ? '📄' : '☁️'}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: importForm.file ? '#166534' : '#475569' }}>
                                    {importForm.file ? importForm.file.name : 'Click to click or drag & drop'}
                                </div>
                                <input
                                    id="bulk-file-input"
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept=".csv,.xlsx,.xls"
                                    onChange={e => {
                                        const file = e.target.files ? e.target.files[0] : null;
                                        onFileChange(file);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={importLoading}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        disabled={importLoading || !importForm.file}
                        onClick={onImport}
                    >
                        {importLoading ? 'Importing...' : '🚀 Start Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
