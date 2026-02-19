import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function LoginPage() {
    const [form, setForm] = useState({ email: 'admin@school.edu', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error('Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role !== 'admin') {
                toast.error('Only admin login is allowed.');
                return;
            }
            toast.success(`Welcome back, ${user.name}!`);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <img src="/logo.png" alt="Oxford School Logo"
                        style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, boxShadow: '0 4px 20px rgba(26,35,126,0.25)' }} />
                    <h1>Oxford School</h1>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Chityala &bull; Fee &amp; Salary Management System</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="search-bar" style={{ padding: '10px 14px' }}>
                            <MdEmail className="search-icon" />
                            <input
                                type="email"
                                placeholder="Enter admin email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="search-bar" style={{ padding: '10px 14px' }}>
                            <MdLock className="search-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                autoComplete="current-password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}
                        style={{ marginTop: 8 }}>
                        {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : '🔐 Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 24 }}>
                    🔒 Oxford School — Admin Access Only
                </p>
            </div>
        </div>
    );
}
