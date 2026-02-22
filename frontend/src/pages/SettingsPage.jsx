import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { MdSave, MdSettings, MdAccountBalance, MdMenuBook } from 'react-icons/md';

const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

export default function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [feeStructures, setFeeStructures] = useState([]);
    const [bookFeeStructures, setBookFeeStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [editFee, setEditFee] = useState(null);
    const [feeForm, setFeeForm] = useState({});
    const [editBookFee, setEditBookFee] = useState(null);
    const [bookFeeForm, setBookFeeForm] = useState({});

    useEffect(() => {
        Promise.all([
            API.get('/settings'),
            API.get('/settings/fee-structures'),
            API.get('/settings/book-fee-structures')
        ]).then(([s, f, b]) => {
            setSettings(s.data.settings);
            setFeeStructures(f.data.structures);
            setBookFeeStructures(b.data.structures);
        }).catch(() => toast.error('Failed to load settings'))
            .finally(() => setLoading(false));
    }, []);

    const saveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await API.put('/settings', settings);
            toast.success('Settings saved!');
        } catch { toast.error('Save failed'); }
        finally { setSaving(false); }
    };

    const saveFeeStructure = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/settings/fee-structures', { ...feeForm, class: editFee });
            toast.success(res.data.message || `Fee structure for ${editFee} saved!`);
            const updated = await API.get('/settings/fee-structures');
            setFeeStructures(updated.data.structures);
            setEditFee(null);
        } catch { toast.error('Failed to save fee structure'); }
    };

    const saveBookFeeStructure = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/settings/book-fee-structures', { ...bookFeeForm, class: editBookFee });
            toast.success(res.data.message || `Book's Fee structure for ${editBookFee} saved!`);
            const updated = await API.get('/settings/book-fee-structures');
            setBookFeeStructures(updated.data.structures);
            setEditBookFee(null);
        } catch { toast.error('Failed to save book fee structure'); }
    };

    const openFeeEdit = (cls) => {
        const existing = feeStructures.find(f => f.class === cls) || {};
        setFeeForm({
            class: cls, academicYear: '2024-25',
            tuitionFee: existing.tuitionFee || 0,
            admissionFee: existing.admissionFee || 0,
            examFee: existing.examFee || 0,
            libraryFee: existing.libraryFee || 0,
            sportsFee: existing.sportsFee || 0,
            transportFee: existing.transportFee || 0,
            miscFee: existing.miscFee || 0
        });
        setEditFee(cls);
    };

    const openBookFeeEdit = (cls) => {
        const existing = bookFeeStructures.find(f => f.class === cls) || {};
        setBookFeeForm({
            class: cls, academicYear: '2025-26',
            readingBookFee: existing.readingBookFee || 0,
            textBooksFee: existing.textBooksFee || 0,
            practiceWorkBookFee: existing.practiceWorkBookFee || 0,
            funWithDotBookFee: existing.funWithDotBookFee || 0,
            dairyFee: existing.dairyFee || 0,
            idCardFee: existing.idCardFee || 0,
            coversFee: existing.coversFee || 0,
            noteBooksFee: existing.noteBooksFee || 0,
            miscFee: existing.miscFee || 0
        });
        setEditBookFee(cls);
    };

    const getBookFeeFields = (cls) => {
        if (cls === 'Nursery') {
            return [
                { key: 'readingBookFee', label: 'READING BOOK' },
                { key: 'practiceWorkBookFee', label: 'PRACTICE WORK BOOK' },
                { key: 'funWithDotBookFee', label: 'FUN WITH DOT BOOK' },
                { key: 'idCardFee', label: 'ID CARD' },
                { key: 'coversFee', label: 'Books Covers' }
            ];
        }
        if (cls === 'LKG') {
            return [
                { key: 'textBooksFee', label: '10 TEXT BOOKS' },
                { key: 'dairyFee', label: 'DAIRY' },
                { key: 'idCardFee', label: 'ID CARD' },
                { key: 'coversFee', label: 'Books Covers' },
                { key: 'noteBooksFee', label: 'NOTE BOOKS (2)' }
            ];
        }
        if (cls === 'UKG') {
            return [
                { key: 'textBooksFee', label: '12 TEXT BOOKS' },
                { key: 'dairyFee', label: 'DAIRY' },
                { key: 'idCardFee', label: 'ID CARD' },
                { key: 'coversFee', label: 'Books Covers' },
                { key: 'noteBooksFee', label: 'NOTE BOOKS (5)' }
            ];
        }
        if (['1st', '2nd', '3rd', '4th', '5th'].includes(cls)) {
            return [
                { key: 'textBooksFee', label: '11 TEXT BOOKS With ABACUS' },
                { key: 'dairyFee', label: 'DAIRY' },
                { key: 'idCardFee', label: 'ID CARD' },
                { key: 'coversFee', label: 'Books Covers' },
                { key: 'noteBooksFee', label: 'NOTE BOOKS (11)' }
            ];
        }
        return [
            { key: 'textBooksFee', label: 'TEXT BOOKS' },
            { key: 'dairyFee', label: 'DAIRY' },
            { key: 'idCardFee', label: 'ID CARD' },
            { key: 'coversFee', label: 'Books Covers' },
            { key: 'noteBooksFee', label: 'NOTE BOOKS' },
            { key: 'miscFee', label: 'Misc' }
        ];
    };

    const calcTotal = () => Object.entries(feeForm)
        .filter(([k]) => k.endsWith('Fee') && k !== 'totalFee')
        .reduce((s, [, v]) => s + Number(v || 0), 0);

    const calcBookTotal = () => Object.entries(bookFeeForm)
        .filter(([k]) => k.endsWith('Fee') && k !== 'totalFee')
        .reduce((s, [, v]) => s + Number(v || 0), 0);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div>
            {/* Tabs */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="settings-tabs" style={{ display: 'flex', gap: 4, padding: '16px 20px' }}>
                    <button className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setActiveTab('general')}>⚙️ School Settings</button>
                    <button className={`btn ${activeTab === 'fees' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setActiveTab('fees')}>💰 Fee Structures</button>
                    <button className={`btn ${activeTab === 'books' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setActiveTab('books')}>📚 Book's Fee Structures</button>
                </div>
            </div>

            {activeTab === 'general' && settings && (
                <div className="card">
                    <div className="card-header"><h2><MdSettings /> School Configuration</h2></div>
                    <form onSubmit={saveSettings}>
                        <div className="card-body">
                            <div className="form-section-title">School Information</div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">School Name</label>
                                    <input className="form-control" value={settings.schoolName || ''}
                                        onChange={e => setSettings({ ...settings, schoolName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Principal Name</label>
                                    <input className="form-control" value={settings.principalName || ''}
                                        onChange={e => setSettings({ ...settings, principalName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-control" value={settings.schoolPhone || ''}
                                        onChange={e => setSettings({ ...settings, schoolPhone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-control" value={settings.schoolEmail || ''}
                                        onChange={e => setSettings({ ...settings, schoolEmail: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Address</label>
                                    <input className="form-control" value={settings.schoolAddress || ''}
                                        onChange={e => setSettings({ ...settings, schoolAddress: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-section-title">Academic & Receipt Settings</div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Academic Year</label>
                                    <input className="form-control" value={settings.academicYear || ''}
                                        onChange={e => setSettings({ ...settings, academicYear: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Currency Symbol</label>
                                    <input className="form-control" value={settings.currency || '₹'}
                                        onChange={e => setSettings({ ...settings, currency: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Receipt Prefix</label>
                                    <input className="form-control" value={settings.receiptPrefix || 'RCPT'}
                                        onChange={e => setSettings({ ...settings, receiptPrefix: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Salary Slip Prefix</label>
                                    <input className="form-control" value={settings.salarySlipPrefix || 'SAL'}
                                        onChange={e => setSettings({ ...settings, salarySlipPrefix: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '16px 24px' }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                <MdSave /> {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'fees' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                        {CLASSES.map(cls => {
                            const fee = feeStructures.find(f => f.class === cls);
                            return (
                                <div className="card" key={cls} style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--primary)' }}>{cls}</h3>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openFeeEdit(cls)}>Edit</button>
                                    </div>
                                    {fee ? (
                                        <div>
                                            <div className="info-row"><span className="label">Tuition</span><span className="value">₹{fee.tuitionFee?.toLocaleString('en-IN')}</span></div>
                                            <div className="info-row"><span className="label">Admission</span><span className="value">₹{fee.admissionFee?.toLocaleString('en-IN')}</span></div>
                                            <div className="info-row"><span className="label">Total</span><span className="value" style={{ color: 'var(--primary)' }}>₹{fee.totalFee?.toLocaleString('en-IN')}</span></div>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: 12, color: '#9ca3af' }}>No fee structure set</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Edit Fee Modal */}
                    {editFee && (
                        <div className="modal-overlay">
                            <div className="modal" style={{ maxWidth: 520 }}>
                                <div className="modal-header">
                                    <h3><MdAccountBalance /> Fee Structure - {editFee}</h3>
                                    <button className="btn-close" onClick={() => setEditFee(null)}>✕</button>
                                </div>
                                <form onSubmit={saveFeeStructure}>
                                    <div className="modal-body">
                                        <div className="form-grid">
                                            {['tuitionFee', 'admissionFee', 'examFee', 'libraryFee', 'sportsFee', 'transportFee', 'miscFee'].map(field => (
                                                <div className="form-group" key={field}>
                                                    <label className="form-label">{field.replace('Fee', ' Fee').replace(/\b\w/g, c => c.toUpperCase())} (₹)</label>
                                                    <input type="number" className="form-control" min="0"
                                                        value={feeForm[field] || 0}
                                                        onWheel={(e) => e.target.blur()}
                                                        onChange={e => setFeeForm({ ...feeForm, [field]: e.target.value })} />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="highlight-box" style={{ textAlign: 'right' }}>
                                            <strong>Calculated Total: ₹{calcTotal().toLocaleString('en-IN')}</strong>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditFee(null)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary"><MdSave /> Save Structure</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'books' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                        {CLASSES.map(cls => {
                            const fee = bookFeeStructures.find(f => f.class === cls);
                            return (
                                <div className="card" key={cls} style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--primary)' }}>{cls}</h3>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openBookFeeEdit(cls)}>Edit</button>
                                    </div>
                                    {fee ? (
                                        <div>
                                            <div className="info-row"><span className="label">Text Books</span><span className="value">₹{fee.textBooksFee?.toLocaleString('en-IN')}</span></div>
                                            <div className="info-row"><span className="label">Note Books</span><span className="value">₹{fee.noteBooksFee?.toLocaleString('en-IN')}</span></div>
                                            <div className="info-row"><span className="label">Total Book's</span><span className="value" style={{ color: '#00897b', fontWeight: 'bold' }}>₹{fee.totalFee?.toLocaleString('en-IN')}</span></div>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: 12, color: '#9ca3af' }}>No book's fee structure set</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Edit Book Fee Modal */}
                    {editBookFee && (
                        <div className="modal-overlay">
                            <div className="modal" style={{ maxWidth: 520 }}>
                                <div className="modal-header">
                                    <h3><MdMenuBook /> Book's Fee Structure - {editBookFee}</h3>
                                    <button className="btn-close" onClick={() => setEditBookFee(null)}>✕</button>
                                </div>
                                <form onSubmit={saveBookFeeStructure}>
                                    <div className="modal-body">
                                        <div className="form-grid">
                                            {getBookFeeFields(editBookFee).map(field => (
                                                <div className="form-group" key={field.key}>
                                                    <label className="form-label">{field.label} (₹)</label>
                                                    <input type="number" className="form-control" min="0"
                                                        value={bookFeeForm[field.key] || 0}
                                                        onWheel={(e) => e.target.blur()}
                                                        onChange={e => setBookFeeForm({ ...bookFeeForm, [field.key]: e.target.value })} />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="highlight-box" style={{ textAlign: 'right' }}>
                                            <strong>Calculated Total: ₹{calcBookTotal().toLocaleString('en-IN')}</strong>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setEditBookFee(null)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary"><MdSave /> Save Structure</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
