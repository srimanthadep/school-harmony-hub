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

// Icons
import {
    MdDashboard, MdPeople, MdSchool,
    MdBarChart, MdSettings, MdLogout, MdMenu
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
                </nav>
                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 4px' }}>
                        <img src="/logo.png" alt="logo"
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', mixBlendMode: 'screen', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Oxford School</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Administrator</div>
                        </div>
                    </div>
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
                                <div className="user-name">Oxford School</div>
                                <div className="user-role">Administrator</div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="content-area">{children}</main>
            </div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    // Only admin role allowed — any other role gets redirected to login
    if (user.role !== 'admin') return <Navigate to="/login" replace />;
    return children;
}

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <AdminLayout pageTitle="Dashboard" pageSubtitle="Overview of school finances">
                        <Dashboard />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/students" element={
                <ProtectedRoute>
                    <AdminLayout pageTitle="Students" pageSubtitle="Manage student records and fees">
                        <StudentsPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff" element={
                <ProtectedRoute>
                    <AdminLayout pageTitle="Staff" pageSubtitle="Manage staff and salaries">
                        <StaffPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/reports" element={
                <ProtectedRoute>
                    <AdminLayout pageTitle="Reports" pageSubtitle="Financial reports and analytics">
                        <ReportsPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute>
                    <AdminLayout pageTitle="Settings" pageSubtitle="School configuration">
                        <SettingsPage />
                    </AdminLayout>
                </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
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
