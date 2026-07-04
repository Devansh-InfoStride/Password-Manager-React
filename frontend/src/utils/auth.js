export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5174/login';

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = LOGIN_URL;
};

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    // Ensure URL is absolute if it doesn't start with http
    const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = url.startsWith('http') ? url : `${cleanBaseUrl}${cleanPath}`;

    try {
        const response = await fetch(fullUrl, { ...options, headers });
        
        if (response.status === 401 || response.status === 403) {
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};
