import axios from 'axios';

const API = axios.create({
    // In production (Vercel), VITE_API_URL will be set to your Render backend URL
    // In development, it uses the Vite proxy (/api → localhost:5000)
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
});

// Request interceptor - attach token
API.interceptors.request.use(config => {
    const token = localStorage.getItem('sfm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

// Response interceptor - handle auth errors
API.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sfm_token');
            localStorage.removeItem('sfm_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
