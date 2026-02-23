import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { MdNotifications, MdClose, MdDoneAll, MdDeleteSweep } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<string, string> = {
    payment: '💰',
    salary: '💼',
    promotion: '🎓',
    info: 'ℹ️',
    warning: '⚠️',
};

function timeAgo(date: Date): string {
    const now = new Date();
    const d = new Date(date);
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(o => !o)}
                title="Notifications"
                style={{
                    width: 42, height: 42, borderRadius: '50%',
                    border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, background: 'rgba(26,35,126,0.08)',
                    position: 'relative', transition: 'background 0.3s'
                }}
            >
                <MdNotifications />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            position: 'absolute', top: 2, right: 2,
                            background: '#ef4444', color: '#fff',
                            borderRadius: '50%', width: 18, height: 18,
                            fontSize: 10, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid #fff'
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="notification-dropdown"
                        style={{
                            position: 'absolute', right: 0, top: 50,
                            width: 360, maxHeight: 460,
                            background: 'var(--bg-primary, #fff)',
                            borderRadius: 16, overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                            zIndex: 9999,
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                                Notifications {unreadCount > 0 && <span style={{ color: '#ef4444' }}>({unreadCount})</span>}
                            </h4>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} title="Mark all read"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 18, padding: 4 }}>
                                        <MdDoneAll />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button onClick={clearAll} title="Clear all"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, padding: 4 }}>
                                        <MdDeleteSweep />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                                    <p style={{ fontSize: 13 }}>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => markAsRead(n.id)}
                                        style={{
                                            padding: '12px 20px',
                                            borderBottom: '1px solid var(--border-light, #f1f5f9)',
                                            cursor: 'pointer',
                                            background: n.read ? 'transparent' : 'rgba(59,130,246,0.04)',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: 20, lineHeight: 1 }}>{ICON_MAP[n.type] || '📌'}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text-primary, #1e293b)', marginBottom: 2 }}>
                                                    {n.title}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary, #64748b)', lineHeight: 1.4 }}>
                                                    {n.message}
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted, #94a3b8)', marginTop: 4, fontWeight: 600 }}>
                                                    {timeAgo(n.timestamp)}
                                                </div>
                                            </div>
                                            {!n.read && (
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: '#3b82f6', flexShrink: 0, marginTop: 4
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
