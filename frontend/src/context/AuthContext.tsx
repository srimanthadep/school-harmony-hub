import React, { createContext, useContext, useState, useEffect } from 'react';
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
                .then(res => {
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

    const value: AuthContextType = {
        user,
        loading,
        login,
        logout,
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
