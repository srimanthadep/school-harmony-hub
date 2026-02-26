import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [form, setForm] = useState({ email: localStorage.getItem('sfm_remember_email') || '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('sfm_remember_email'));
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error('Please enter email and password');
            return;
        }
        setLoading(true);
        if (rememberMe) {
            localStorage.setItem('sfm_remember_email', form.email);
        } else {
            localStorage.removeItem('sfm_remember_email');
        }
        try {
            const user = await login(form.email, form.password);

            // Allow admin, owner, staff, student now as we have portals
            toast.success(`Welcome back, ${user.name}!`);

            const isAdminDomain = window.location.hostname === 'admin.oxfordschool.cc';
            if (isAdminDomain) {
                navigate('/admin');
            } else if (user.role === 'staff') {
                navigate('/portal/staff');
            } else if (user.role === 'student') {
                navigate('/portal/student');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: '16px',
            width: '100vw',
            boxSizing: 'border-box'
        }}>
            {/* Animated Background Elements */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 20, repeat: Infinity }}
                style={{
                    position: 'absolute', top: '-10%', right: '-10%',
                    width: '40vw', height: '40vw', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '40%', pointerEvents: 'none'
                }}
            />
            <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                transition={{ duration: 25, repeat: Infinity }}
                style={{
                    position: 'absolute', bottom: '-10%', left: '-10%',
                    width: '50vw', height: '50vw', background: 'rgba(255,255,255,0.02)',
                    borderRadius: '45%', pointerEvents: 'none'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    width: '100%', maxWidth: 420,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: 'clamp(24px, 10vw, 48px) clamp(20px, 8vw, 40px)',
                    borderRadius: 24,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 1
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <motion.img
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                        src="/logo.png"
                        alt="Logo"
                        style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                    />
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a237e', letterSpacing: '-0.5px', marginBottom: 4 }}>Oxford School</h1>
                    <p style={{ color: '#64748b', fontSize: 14 }}>Management System Gateway</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <MdEmail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 20 }} />
                            <input
                                type="email"
                                placeholder="name@school.edu"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 14px 12px 44px',
                                    borderRadius: 12, border: '1.5px solid #e2e8f0',
                                    fontSize: 15, outline: 'none', transition: 'all 0.2s',
                                    backgroundColor: '#fff'
                                }}
                                onFocus={e => e.target.style.borderColor = '#1a237e'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <MdLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 20 }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 44px 12px 44px',
                                    borderRadius: 12, border: '1.5px solid #e2e8f0',
                                    fontSize: 15, outline: 'none', transition: 'all 0.2s',
                                    backgroundColor: '#fff'
                                }}
                                onFocus={e => e.target.style.borderColor = '#1a237e'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                                    display: 'flex', padding: 4
                                }}
                            >
                                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: '#1a237e', cursor: 'pointer' }}
                            />
                            Remember me
                        </label>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '14px',
                            background: 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)',
                            color: 'white', border: 'none', borderRadius: 12,
                            fontSize: 16, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 10px 15px -3px rgba(26, 35, 126, 0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In To Console'}
                    </motion.button>
                    <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 10 }}>Press <kbd style={{ padding: '2px 6px', fontSize: 10, background: '#e2e8f0', borderRadius: 4, fontWeight: 700, border: '1px solid #cbd5e1' }}>Enter↵</kbd> to sign in</p>
                </form>

                <div style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                    <p>Protected by Oxford Security Core</p>
                    <p style={{ marginTop: 4 }}>© {new Date().getFullYear()} Oxford School Chityala</p>
                </div>
            </motion.div>
        </div>
    );
}
