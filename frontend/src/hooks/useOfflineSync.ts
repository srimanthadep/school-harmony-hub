import { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

const QUEUE_KEY = 'attendance_offline_queue';

export interface QueuedAttendance {
    id: string;
    date: string;
    class?: string;
    academicYear: string;
    type: 'student' | 'staff';
    records: { studentId: string; status: string; timestamp: string }[];
    queuedAt: string;
}

function loadQueue(): QueuedAttendance[] {
    try {
        return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveQueue(queue: QueuedAttendance[]) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

let _queueIdCounter = 0;

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queue, setQueue] = useState<QueuedAttendance[]>(loadQueue);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const enqueue = useCallback((payload: Omit<QueuedAttendance, 'id' | 'queuedAt'>) => {
        _queueIdCounter++;
        const item: QueuedAttendance = {
            ...payload,
            id: `${Date.now()}-${_queueIdCounter}-${Math.random().toString(36).slice(2)}`,
            queuedAt: new Date().toISOString(),
        };
        setQueue(prev => {
            const next = [...prev, item];
            saveQueue(next);
            return next;
        });
    }, []);

    const syncAll = useCallback(async () => {
        const current = loadQueue();
        if (current.length === 0) return { synced: 0, failed: 0 };
        setSyncing(true);
        let synced = 0;
        let failed = 0;
        const remaining: QueuedAttendance[] = [];
        for (const item of current) {
            try {
                await API.post('/attendance', {
                    date: item.date,
                    class: item.class,
                    academicYear: item.academicYear,
                    type: item.type,
                    records: item.records,
                });
                synced++;
            } catch {
                failed++;
                remaining.push(item);
            }
        }
        saveQueue(remaining);
        setQueue(remaining);
        setSyncing(false);
        return { synced, failed };
    }, []);

    // Auto-sync when coming back online
    useEffect(() => {
        if (isOnline && loadQueue().length > 0) {
            syncAll();
        }
    }, [isOnline, syncAll]);

    return { isOnline, queue, enqueue, syncAll, syncing, pendingCount: queue.length };
}
