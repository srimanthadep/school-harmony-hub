import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const u = localStorage.getItem('sfm_user');
        try {
            return u ? JSON.parse(u) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('sfm_token');
        if (token) {
            API.get('/auth/me')
                .then((res: { data: { user: User } }) => {
                    setUser(res.data.user);
                    localStorage.setItem('sfm_user', JSON.stringify(res.data.user));
                })
                .catch(() => {
                    localStorage.removeItem('sfm_token');
                    localStorage.removeItem('sfm_user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Fix #21: Listen for the auth:logout event dispatched by the API interceptor
    useEffect(() => {
        const handleAuthLogout = () => {
            setUser(null);
            // Navigate to /login via React Router — see App.tsx for how this is handled
            window.location.href = '/login'; // fallback since we can't access navigate() here
        };
        window.addEventListener('auth:logout', handleAuthLogout);
        return () => window.removeEventListener('auth:logout', handleAuthLogout);
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
        const res = await API.post('/auth/login', { email, password });
        const { token, user: loggedUser } = res.data;
        localStorage.setItem('sfm_token', token);
        localStorage.setItem('sfm_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return loggedUser;
    };

    const logout = () => {
        localStorage.removeItem('sfm_token');
        localStorage.removeItem('sfm_user');
        setUser(null);
    };

    // Fix #26: refreshUser re-fetches user data from API, fixing stale data after profile updates
    const refreshUser = useCallback(async () => {
        try {
            const res = await API.get('/auth/me');
            const freshUser = res.data.user;
            setUser(freshUser);
            localStorage.setItem('sfm_user', JSON.stringify(freshUser));
        } catch {
            // Silently fail — don't log out user just because refresh failed
        }
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
        refreshUser, // Fix #26
        isAdmin: (user?.role === 'admin' || user?.role === 'owner') || false,
        isOwner: (user?.role === 'owner') || false,
        isStudent: (user?.role === 'student') || false,
        isStaff: (user?.role === 'staff') || false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
