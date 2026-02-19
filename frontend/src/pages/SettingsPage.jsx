import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { MdSave, MdSettings, MdAccountBalance } from 'react-icons/md';

const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

export default function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [feeStructures, setFeeStructures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [editFee, setEditFee] = useState(null);
    const [feeForm, setFeeForm] = useState({});

    useEffect(() => {
        Promise.all([
            API.get('/settings'),
            API.get('/settings/fee-structures')
        ]).then(([s, f]) => {
            setSettings(s.data.settings);
            setFeeStructures(f.data.structures);
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
            toast.success(`Fee structure for ${editFee} saved!`);
            const updated = await API.get('/settings/fee-structures');
            setFeeStructures(updated.data.structures);
            setEditFee(null);
        } catch { toast.error('Failed to save fee structure'); }
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

    const calcTotal = () => Object.entries(feeForm)
        .filter(([k]) => k.endsWith('Fee') && k !== 'totalFee')
        .reduce((s, [, v]) => s + Number(v || 0), 0);

    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

    return (
        <div>
            {/* Tabs */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 4, padding: '16px 20px' }}>
                    <button className={`btn ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setActiveTab('general')}>⚙️ School Settings</button>
                    <button className={`btn ${activeTab === 'fees' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setActiveTab('fees')}>💰 Fee Structures</button>
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
        </div>
    );
}
