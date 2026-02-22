import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { MdAdd, MdEdit, MdSecurity, MdClose, MdAdminPanelSettings, MdLockOutline, MdDelete, MdRestore, MdUndo } from 'react-icons/md';

export default function AdminPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [newUserForm, setNewUserForm] = useState({
        name: '', email: '', password: '', role: 'staff'
    });

    const [showPasswordModal, setShowPasswordModal] = useState(null); // User object
    const [newPassword, setNewPassword] = useState('');

    const [showEditForm, setShowEditForm] = useState(null); // User object
    const [editUserForm, setEditUserForm] = useState({ name: '', email: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // User object

    const [activeTab, setActiveTab] = useState('users');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (user?.email === 'srimanthadep@gmail.com') {
            fetchUsers();
            fetchHistory();
        }
    }, [user, activeTab]);

    const fetchUsers = async () => {
        if (activeTab !== 'users') return;
        setLoading(true);
        try {
            const res = await API.get('/auth/users');
            setUsers(res.data.users);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (activeTab !== 'history') return;
        setLoadingHistory(true);
        try {
            const res = await API.get('/auth/deleted-history');
            setHistory(res.data.records);
        } catch (err) {
            toast.error('Failed to load history log');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await API.post('/auth/users', newUserForm);
            toast.success('User created successfully');
            setShowAddForm(false);
            setNewUserForm({ name: '', email: '', password: '', role: 'staff' });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await API.put(`/auth/users/${userId}/role`, { role: newRole });
            toast.success('Role updated successfully');
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
            fetchUsers();
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        try {
            await API.put(`/auth/users/${userId}/status`, { isActive: !currentStatus });
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

        try {
            await API.put(`/auth/users/${showPasswordModal._id}/password`, { password: newPassword });
            toast.success('Password updated successfully');
            setShowPasswordModal(null);
            setNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await API.put(`/auth/users/${showEditForm._id}`, editUserForm);
            toast.success('User updated successfully');
            setShowEditForm(null);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        try {
            await API.delete(`/auth/users/${showDeleteConfirm._id}`);
            toast.success('User deleted successfully');
            setShowDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleRevertDelete = async (recordId) => {
        try {
            await API.post(`/auth/deleted-history/${recordId}/revert`);
            toast.success('Record reverted successfully');
            fetchHistory();
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to revert record');
        }
    };

    const handleUndoRevert = async (recordId) => {
        try {
            await API.post(`/auth/deleted-history/${recordId}/undo-revert`);
            toast.success('Revert undone successfully');
            fetchHistory();
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to undo revert');
        }
    };

    const renderRecordDetails = (record) => {
        const { recordType, data } = record;
        if (!data) return <div style={{ color: 'var(--text-secondary)' }}>No details available</div>;

        switch (recordType) {
            case 'Student':
                return (
                    <>
                        <div style={{ fontWeight: 600 }}>{data.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Class: {data.class || 'N/A'} | Roll: {data.rollNo || 'N/A'}</div>
                    </>
                );
            case 'Staff':
                return (
                    <>
                        <div style={{ fontWeight: 600 }}>{data.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Role: {data.role || 'N/A'}</div>
                    </>
                );
            case 'User':
                return (
                    <>
                        <div style={{ fontWeight: 600 }}>{data.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Email: {data.email || 'N/A'} | Role: {data.role}</div>
                    </>
                );
            case 'Fee Payment':
                return (
                    <>
                        <div style={{ fontWeight: 600 }}>Amount: ₹{data.amount}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Receipt: {data.receiptNo || 'N/A'}</div>
                    </>
                );
            case 'Salary Payment':
                return (
                    <>
                        <div style={{ fontWeight: 600 }}>Amount: ₹{data.amount}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Slip: {data.slipNo || 'N/A'}</div>
                    </>
                );
            case 'Leave':
                return (
                    <>
                        <div style={{ fontWeight: 600 }}>{data.leaveType || 'Leave'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Date: {new Date(data.date).toLocaleDateString()}</div>
                    </>
                );
            default:
                return <div style={{ color: 'var(--text-secondary)' }}>-</div>;
        }
    };

    if (user?.email !== 'srimanthadep@gmail.com') {
        return (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <MdSecurity style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }} />
                <h3>Access Denied</h3>
                <p style={{ color: '#6b7280' }}>This area is strictly restricted to the Super Admin.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header" style={{ paddingBottom: 0 }}>
                    <div style={{ paddingBottom: 16 }}>
                        <h2 style={{ fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MdAdminPanelSettings style={{ color: '#4f46e5', fontSize: 24 }} />
                            Super Admin Control Panel
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                            Full operational control of user accounts and global system history
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', gap: 20 }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{ padding: '12px 4px', background: 'none', border: 'none', borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 14 }}
                    >
                        User Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{ padding: '12px 4px', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600, color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 14 }}
                    >
                        Deletion Audit Stack
                    </button>
                </div>
            </div>

            <div className="card">
                {activeTab === 'users' ? (
                    <>
                        <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
                                <MdAdd /> Add User
                            </button>
                        </div>
                        {loading ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id}>
                                                <td style={{ fontWeight: 600 }}>{u.name}</td>
                                                <td>{u.email}</td>
                                                <td>
                                                    <select
                                                        className="form-control"
                                                        style={{ width: 'auto', padding: '4px 8px', fontSize: 13, minHeight: 32 }}
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                    >
                                                        <option value="student">Student</option>
                                                        <option value="staff">Staff</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="owner">Owner</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button
                                                        className={`badge ${u.isActive ? 'badge-paid' : 'badge-unpaid'}`}
                                                        style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                                        onClick={() => handleStatusToggle(u._id, u.isActive)}
                                                    >
                                                        {u.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        <button
                                                            className="btn btn-sm"
                                                            title="Edit User"
                                                            style={{
                                                                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none',
                                                                borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                                            }}
                                                            onClick={() => {
                                                                setShowEditForm(u);
                                                                setEditUserForm({ name: u.name, email: u.email });
                                                            }}
                                                        >
                                                            <MdEdit /> Edit
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            title="Reset Password"
                                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
                                                            onClick={() => setShowPasswordModal(u)}
                                                        >
                                                            <MdLockOutline /> Reset PW
                                                        </button>
                                                        {user?.email !== u.email && (
                                                            <button
                                                                className="btn btn-sm btn-icon"
                                                                title="Delete User"
                                                                style={{ color: '#ef4444' }}
                                                                onClick={() => setShowDeleteConfirm(u)}
                                                            >
                                                                <MdDelete />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: 16 }}>Globally Deleted Records</h3>
                        </div>
                        {loadingHistory ? (
                            <div className="loading-spinner"><div className="spinner" /></div>
                        ) : history.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <div className="empty-state-icon">🛡️</div>
                                <h3>No operations found</h3>
                                <p>There is no deletion history recorded yet.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Record Type</th>
                                            <th>Deleted Entity Details</th>
                                            <th>Detailed Description</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(record => (
                                            <tr key={record._id}>
                                                <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(record.deletedAt).toLocaleString()}</td>
                                                <td><span className="badge badge-unpaid">{record.recordType}</span></td>
                                                <td>
                                                    {renderRecordDetails(record)}
                                                </td>
                                                <td style={{ fontSize: 13 }}>{record.description}</td>
                                                <td>
                                                    {!record.reverted ? (
                                                        <button
                                                            className="btn btn-sm"
                                                            title="Revert Action"
                                                            style={{
                                                                background: '#10b981', color: '#fff', border: 'none',
                                                                borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                                            }}
                                                            onClick={() => handleRevertDelete(record._id)}
                                                        >
                                                            <MdRestore /> Revert
                                                        </button>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <MdRestore /> Reverted
                                                            </span>
                                                            <button
                                                                className="btn btn-sm"
                                                                title="Undo Revert"
                                                                style={{
                                                                    background: '#ef4444', color: '#fff', border: 'none',
                                                                    borderRadius: 6, padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                                    fontSize: 11
                                                                }}
                                                                onClick={() => handleUndoRevert(record._id)}
                                                            >
                                                                <MdUndo /> Undo
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add User Modal */}
            {
                showAddForm && (
                    <div className="modal-overlay">
                        <div className="modal" style={{ maxWidth: 450 }}>
                            <div className="modal-header">
                                <h3><MdAdd /> Create New User</h3>
                                <button className="btn-close" onClick={() => setShowAddForm(false)}><MdClose /></button>
                            </div>
                            <form onSubmit={handleAddUser}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Name <span className="required">*</span></label>
                                        <input required className="form-control" value={newUserForm.name}
                                            onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email <span className="required">*</span></label>
                                        <input required type="email" className="form-control" value={newUserForm.email}
                                            onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value.toLowerCase() })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password <span className="required">*</span></label>
                                        <input required type="password" minLength={6} className="form-control" value={newUserForm.password}
                                            onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-control" value={newUserForm.role}
                                            onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}>
                                            <option value="student">Student</option>
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                            <option value="owner">Owner</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                        {formLoading ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Reset Password Modal */}
            {
                showPasswordModal && (
                    <div className="modal-overlay">
                        <div className="modal" style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h3><MdLockOutline /> Reset Password</h3>
                                <button className="btn-close" onClick={() => { setShowPasswordModal(null); setNewPassword(''); }}><MdClose /></button>
                            </div>
                            <form onSubmit={handlePasswordReset}>
                                <div className="modal-body">
                                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                                        Setting a new password for <strong>{showPasswordModal.name}</strong> ({showPasswordModal.email}).
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <input required type="password" minLength={6} className="form-control" autoFocus
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowPasswordModal(null); setNewPassword(''); }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Password</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit User Modal */}
            {
                showEditForm && (
                    <div className="modal-overlay">
                        <div className="modal" style={{ maxWidth: 450 }}>
                            <div className="modal-header">
                                <h3><MdEdit /> Edit User Details</h3>
                                <button className="btn-close" onClick={() => setShowEditForm(null)}><MdClose /></button>
                            </div>
                            <form onSubmit={handleEditUser}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Name <span className="required">*</span></label>
                                        <input required className="form-control" value={editUserForm.name}
                                            onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email <span className="required">*</span></label>
                                        <input required type="email" className="form-control" value={editUserForm.email}
                                            onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value.toLowerCase() })} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                        {formLoading ? 'Saving...' : 'Update User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete User Confirmation */}
            {
                showDeleteConfirm && (
                    <div className="modal-overlay">
                        <div className="modal" style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h3>Confirm Delete</h3>
                                <button className="btn-close" onClick={() => setShowDeleteConfirm(null)}><MdClose /></button>
                            </div>
                            <div className="modal-body">
                                <div className="confirm-dialog">
                                    <div className="confirm-icon">🗑️</div>
                                    <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Delete {showDeleteConfirm.name}?</p>
                                    <p style={{ fontSize: 13, color: '#6b7280' }}>
                                        This will permanently remove the user account with the email <strong>{showDeleteConfirm.email}</strong>. This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDeleteUser}>Delete Account</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
