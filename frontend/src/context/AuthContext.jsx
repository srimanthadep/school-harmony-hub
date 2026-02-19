import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const u = localStorage.getItem('sfm_user');
        return u ? JSON.parse(u) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('sfm_token');
        if (token) {
            API.get('/auth/me')
                .then(res => setUser(res.data.user))
                .catch(() => { localStorage.removeItem('sfm_token'); localStorage.removeItem('sfm_user'); setUser(null); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        const { token, user } = res.data;
        localStorage.setItem('sfm_token', token);
        localStorage.setItem('sfm_user', JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('sfm_token');
        localStorage.removeItem('sfm_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin', isStudent: user?.role === 'student', isStaff: user?.role === 'staff' }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
