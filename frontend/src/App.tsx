import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from './hooks/useDarkMode';
import { useTheme } from './hooks/useTheme';
import NotificationBell from './components/NotificationBell';
import InstallPromptBanner from './components/InstallPromptBanner';
import { usePWA } from './hooks/usePWA';

// Lazy Loaded Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const StaffPortal = lazy(() => import('./pages/StaffPortal'));
const StudentPortal = lazy(() => import('./pages/StudentPortal'));
const ExpensePage = lazy(() => import('./pages/ExpensePage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const GeminiChat = lazy(() => import('./components/GeminiChat'));

// Icons
import {
    MdDashboard, MdPeople, MdSchool,
    MdBarChart, MdSettings, MdLogout, MdMenu, MdAdminPanelSettings, MdReceiptLong, MdChecklist
} from 'react-icons/md';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { path: '/students', label: 'Students', icon: <MdSchool /> },
    { path: '/staff', label: 'Staff', icon: <MdPeople /> },
    { path: '/reports', label: 'Reports', icon: <MdBarChart /> },
    { path: '/expenses', label: 'Expenses', icon: <MdReceiptLong /> },
    { path: '/attendance', label: 'Attendance', icon: <MdChecklist /> },
    { path: '/settings', label: 'Settings', icon: <MdSettings /> },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
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
                    {/* Fix #25: Show Admin Panel for any 'owner' role, not just one hardcoded email */}
                    {user?.role === 'owner' && (
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

interface AdminLayoutWrapperProps {
    // No specific props needed anymore as we'll get info from current route or context
}

function AdminLayoutWrapper() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();
    const location = useLocation();
    const { isDark, toggle } = useDarkMode();
    useTheme(); // Apply persisted theme on mount
    const { isInstallable, installApp } = usePWA();

    // Mapping of paths to titles
    const routeInfo: Record<string, { title: string; subtitle: string }> = {
        '/dashboard': { title: 'Dashboard', subtitle: 'Overview of school finances' },
        '/students': { title: 'Students', subtitle: 'Manage student records and fees' },
        '/staff': { title: 'Staff', subtitle: 'Manage staff and salaries' },
        '/reports': { title: 'Reports', subtitle: 'Financial reports and analytics' },
        '/expenses': { title: 'Expenses', subtitle: 'Manage current bills and land lease payments' },
        '/attendance': { title: 'Attendance', subtitle: 'Swipe to mark student attendance' },
        '/settings': { title: 'Settings', subtitle: 'School configuration' },
        '/admin': { title: 'Super Admin', subtitle: 'System-wide access and limits' },
    };

    const { title: pageTitle, subtitle: pageSubtitle } = routeInfo[location.pathname] || { title: 'Oxford School', subtitle: '' };

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
                        {/* PWA Install Button */}
                        {isInstallable && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={installApp}
                                title="Install App"
                                style={{
                                    padding: '6px 14px', borderRadius: 8,
                                    border: '1px solid #1976d2', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 13, fontWeight: 600, color: '#1976d2',
                                    background: 'rgba(25,118,210,0.08)',
                                    transition: 'background 0.2s'
                                }}
                            >
                                ⬇️ Install App
                            </motion.button>
                        )}
                        {/* Dark Mode Toggle */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={toggle}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            style={{
                                width: 42, height: 42, borderRadius: '50%',
                                border: 'none', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: 20,
                                background: isDark ? 'rgba(249,168,37,0.15)' : 'rgba(26,35,126,0.08)',
                                transition: 'background 0.3s'
                            }}
                        >
                            <motion.span
                                key={isDark ? 'moon' : 'sun'}
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 90 }}
                                transition={{ duration: 0.25 }}
                            >
                                {isDark ? '☀️' : '🌙'}
                            </motion.span>
                        </motion.button>
                        {/* Notification Bell */}
                        <NotificationBell />
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="user-badge shadow-sm"
                            style={{
                                padding: '6px 12px',
                                borderRadius: 12,
                                backgroundColor: import.meta.env.PROD ? '#22c55e33' : '#ef444433', // Subtle green/red with alpha
                                border: `1px solid ${import.meta.env.PROD ? '#22c55e' : '#ef4444'}`,
                                backdropFilter: 'blur(12px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                cursor: 'pointer'
                            }}
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
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            {/* Mobile Bottom Nav */}
            <nav className="bottom-nav">
                {NAV_ITEMS.map(item => (
                    <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
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
                <Route element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']}>
                        <AdminLayoutWrapper />
                    </ProtectedRoute>
                }>
                    <Route path="/admin" element={<AdminPage />} />
                </Route>
                <Route path="/" element={<Navigate to={user ? '/admin' : '/login'} replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'staff' ? '/portal/staff' : user.role === 'student' ? '/portal/student' : '/dashboard'} replace />} />

            {/* Admin Layout Perspective */}
            <Route element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <AdminLayoutWrapper />
                </ProtectedRoute>
            }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/expenses" element={<ExpensePage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Fix #28 & #33: Add /admin route to regular domain for owner users */}
                <Route path="/admin" element={<AdminPage />} />
            </Route>

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

// Wrapper component to conditionally show Gemini chat only when logged in
function AuthenticatedGeminiChat() {
    const { user } = useAuth();
    return user ? <GeminiChat /> : null;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NotificationProvider>
                    <BrowserRouter>
                        <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}>
                            <AppRoutes />
                            <AuthenticatedGeminiChat />
                        </Suspense>
                        <InstallPromptBanner />
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 3500,
                                style: { fontFamily: "'Inter', sans-serif", fontSize: 14, borderRadius: 10 }
                            }}
                        />
                    </BrowserRouter>
                </NotificationProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
