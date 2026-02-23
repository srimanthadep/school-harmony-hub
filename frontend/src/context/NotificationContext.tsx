import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Notification } from '../types';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const stored = localStorage.getItem('sfm_notifications');
            if (stored) return JSON.parse(stored);
        } catch { }
        return [];
    });

    const persist = (notifs: Notification[]) => {
        // Keep only last 50 notifications
        const capped = notifs.slice(0, 50);
        localStorage.setItem('sfm_notifications', JSON.stringify(capped));
        return capped;
    };

    const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotif: Notification = {
            ...n,
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            timestamp: new Date(),
            read: false
        };
        setNotifications(prev => persist([newNotif, ...prev]));
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => persist(prev.map(n => n.id === id ? { ...n, read: true } : n)));
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => persist(prev.map(n => ({ ...n, read: true }))));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem('sfm_notifications');
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
}
