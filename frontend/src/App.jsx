import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

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

function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="Oxford School Logo"
                        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', mixBlendMode: 'screen', marginBottom: 6 }} />
                    <h2>Oxford School</h2>
                    <p style={{ fontSize: 11, opacity: 0.75 }}>Chityala &bull; Fee &amp; Salary Management</p>
                </div>
                <nav className="sidebar-nav">
                    <span className="nav-section-title">Main Navigation</span>
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                    {user?.email === 'srimanthadep@gmail.com' && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="nav-icon"><MdAdminPanelSettings /></span>
                            Admin Panel
                        </NavLink>
                    )}
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item" onClick={logout} style={{ color: 'rgba(229,57,53,0.8)' }}>
                        <span className="nav-icon"><MdLogout /></span>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

function AdminLayout({ children, pageTitle, pageSubtitle }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-content">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
                            <MdMenu />
                        </button>
                        <div className="topbar-title">
                            <h1>{pageTitle}</h1>
                            {pageSubtitle && <p>{pageSubtitle}</p>}
                        </div>
                    </div>
                    <div className="topbar-actions">
                        <div className="user-badge">
                            <img src="/logo.png" alt="logo"
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                            <div className="user-info-text">
                                <div className="user-name">{user?.name || 'Oxford School'}</div>
                                <div className="user-role">{user?.role === 'owner' ? '👑 Owner' : 'Administrator'}</div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="content-area">{children}</main>
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
    const isAdminDomain = window.location.hostname === 'admin.oxfordschool.cc';

    if (isAdminDomain) {
        return (
            <Routes>
                <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/admin" replace />} />
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <AdminLayout pageTitle="Super Admin" pageSubtitle="System-wide access and limits">
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

export default function App() {
    return (
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
    );
}
