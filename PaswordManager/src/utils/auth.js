
export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = 'http://localhost:5174';
};

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { ...options, headers });
        
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
