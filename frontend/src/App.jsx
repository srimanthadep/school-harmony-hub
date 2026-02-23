import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/StudentsPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import StaffPortal from './pages/StaffPortal';
import StudentPortal from './pages/StudentPortal';

// Icons
import {
    MdDashboard, MdPeople, MdSchool,
    MdBarChart, MdSettings, MdLogout, MdMenu, MdAdminPanelSettings
} from 'react-icons/md';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { path: '/students', label: 'Students', icon: <MdSchool /> },
    { path: '/staff', label: 'Staff', icon: <MdPeople /> },
    { path: '/reports', label: 'Reports', icon: <MdBarChart /> },
    { path: '/settings', label: 'Settings', icon: <MdSettings /> },
];

function Sidebar({ isOpen, onClose, isAdminDomain }) {
    const { user, logout } = useAuth();

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sidebar-overlay active"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <motion.img
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        src="/logo.png"
                        alt="Oxford School Logo"
                        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', mixBlendMode: 'screen', marginBottom: 6 }}
                    />
                    <h2>Oxford School</h2>
                    <p style={{ fontSize: 11, opacity: 0.75 }}>Chityala &bull; Fee &amp; Salary Management</p>
                </div>
                <nav className="sidebar-nav">
                    {!isAdminDomain && (
                        <>
                            <span className="nav-section-title">Main Navigation</span>
                            {NAV_ITEMS.map((item, idx) => (
                                <motion.div
                                    key={item.path}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 + idx * 0.05 }}
                                >
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) => `nav-item ${isActive ? 'active shadow-sm' : ''}`}
                                        onClick={onClose}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        {item.label}
                                    </NavLink>
                                </motion.div>
                            ))}
                            {user?.email === 'srimanthadep@gmail.com' && (
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <NavLink
                                        to="/admin"
                                        className={({ isActive }) => `nav-item ${isActive ? 'active shadow-sm' : ''}`}
                                        onClick={onClose}
                                    >
                                        <span className="nav-icon"><MdAdminPanelSettings /></span>
                                        Admin Panel
                                    </NavLink>
                                </motion.div>
                            )}
                        </>
                    )}
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item hover-lift" onClick={logout} style={{ color: '#ef4444', width: '100%', textAlign: 'left' }}>
                        <span className="nav-icon"><MdLogout /></span>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

function AdminLayout({ children, pageTitle, pageSubtitle, isAdminDomain }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdminDomain={isAdminDomain} />
            <div className="main-content">
                <header className="topbar glass">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
                            <MdMenu />
                        </button>
                        <div className="topbar-title">
                            <motion.h1
                                key={pageTitle}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                style={{ fontSize: 20, fontWeight: 700 }}
                            >
                                {pageTitle}
                            </motion.h1>
                            {pageSubtitle && <p style={{ fontSize: 12, color: '#64748b' }}>{pageSubtitle}</p>}
                        </div>
                    </div>
                    <div className="topbar-actions">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="user-badge glass shadow-sm"
                            style={{ padding: '6px 12px', borderRadius: 12 }}
                        >
                            <img src="/logo.png" alt="logo"
                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            <div className="user-info-text">
                                <div className="user-name" style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'School Admin'}</div>
                                <div className="user-role" style={{ fontSize: 10, color: '#64748b' }}>{user?.role === 'owner' ? '👑 Main Admin' : 'Staff Access'}</div>
                            </div>
                        </motion.div>
                    </div>
                </header>
                <main className="content-area">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/login" replace />;

    // Only specified roles allowed
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'staff') return <Navigate to="/portal/staff" replace />;
        if (user.role === 'student') return <Navigate to="/portal/student" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function AppRoutes() {
    const { user } = useAuth();
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const isAdminDomain = hostname === 'admin.oxfordschool.cc';

    if (isAdminDomain || (isLocal && window.location.pathname.startsWith('/admin'))) {
        return (
            <Routes>
                <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/admin" replace />} />
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <AdminLayout pageTitle="Super Admin" pageSubtitle="System-wide access and limits" isAdminDomain={isAdminDomain || (isLocal && window.location.pathname.startsWith('/admin'))}>
                            <AdminPage />
                        </AdminLayout>
                    </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to={user ? '/admin' : '/login'} replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'staff' ? '/portal/staff' : user.role === 'student' ? '/portal/student' : '/dashboard'} replace />} />

            <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout pageTitle="Dashboard" pageSubtitle="Overview of school finances">
                        <Dashboard />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/students" element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout pageTitle="Students" pageSubtitle="Manage student records and fees">
                        <StudentsPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff" element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout pageTitle="Staff" pageSubtitle="Manage staff and salaries">
                        <StaffPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout pageTitle="Reports" pageSubtitle="Financial reports and analytics">
                        <ReportsPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayout pageTitle="Settings" pageSubtitle="School configuration">
                        <SettingsPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />

            <Route path="/portal/staff" element={
                <ProtectedRoute allowedRoles={['staff']}>
                    <StaffPortal />
                </ProtectedRoute>
            } />

            <Route path="/portal/student" element={
                <ProtectedRoute allowedRoles={['student']}>
                    <StudentPortal />
                </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to={user ? (user.role === 'staff' ? '/portal/staff' : user.role === 'student' ? '/portal/student' : '/dashboard') : '/login'} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes cache
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3500,
                            style: { fontFamily: "'Inter', sans-serif", fontSize: 14, borderRadius: 10 }
                        }}
                    />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}
