import React, { useState, useEffect } from 'react';
import { fetchWithAuth, logout } from '../../utils/auth';
import '../../styles/userProfile.css';

const AVATAR_STYLES = [
    { id: 'bottts', name: '🤖 Robots' },
    { id: 'pixel-art', name: '👾 Pixel Art' },
    { id: 'fun-emoji', name: '🎭 Emojis' },
    { id: 'shapes', name: '🎨 Abstract Shapes' },
    { id: 'identicon', name: '🌀 Identicons' },
    { id: 'rings', name: '💫 Rings' }
];

const parseDicebearUrl = (url, fallbackEmail) => {
    try {
        if (url && url.startsWith('https://api.dicebear.com/')) {
            const parts = url.split('/');
            const style = parts[4]; // https://api.dicebear.com/9.x/{style}/svg
            const urlObj = new URL(url);
            const seed = urlObj.searchParams.get('seed') || fallbackEmail || 'user';
            return { style, seed };
        }
    } catch (e) {
        console.error("Error parsing avatar URL:", e);
    }
    return { style: 'bottts', seed: fallbackEmail || 'user' };
};

const UserProfile = () => {
    const [profile, setProfile] = useState({
        _id: '',
        name: '',
        email: ''
    });
    const [name, setName] = useState('');
    const [avatarStyle, setAvatarStyle] = useState('bottts');
    const [avatarSeed, setAvatarSeed] = useState('');
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetchWithAuth('/api/profile');
            if (response && response.ok) {
                const data = await response.json();
                setProfile(data);
                setName(data.name);

                const { style, seed } = parseDicebearUrl(data.profilePhoto, data.email);
                setAvatarStyle(style);
                setAvatarSeed(seed);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetchWithAuth('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name,
                    profilePhoto: avatarUrl
                })
            });
            if (response && response.ok) {
                setMessage({ text: 'Profile updated successfully! Reloading...', type: 'success' });
                // Hard reload to ensure all components see the changes
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else if (response) {
                const data = await response.json();
                setMessage({ text: data.error, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Failed to update profile', type: 'error' });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            return;
        }

        try {
            const response = await fetchWithAuth('/api/profile/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });
            if (response && response.ok) {
                setMessage({ text: 'Password changed successfully!', type: 'success' });
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else if (response) {
                const data = await response.json();
                setMessage({ text: data.error, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Failed to change password', type: 'error' });
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2>User Profile</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="profile-info">
                <div className="profile-photo-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', height: 'auto', width: 'auto' }}>
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '3px solid var(--accent)', padding: '5px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img 
                            src={avatarUrl} 
                            alt="Avatar Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px' }}>
                        <select 
                            value={avatarStyle} 
                            onChange={(e) => setAvatarStyle(e.target.value)}
                            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none' }}
                        >
                            {AVATAR_STYLES.map(style => (
                                <option key={style.id} value={style.id}>{style.name}</option>
                            ))}
                        </select>
                        
                        <button 
                            type="button" 
                            onClick={() => setAvatarSeed(Math.random().toString(36).substring(2, 9))}
                            style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            title="Randomize Avatar Seed"
                        >
                            🎲 Random
                        </button>
                    </div>

                    <div className="info-group" style={{ width: '100%', maxWidth: '320px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avatar Custom Seed</label>
                        <input 
                            type="text" 
                            value={avatarSeed} 
                            onChange={(e) => setAvatarSeed(e.target.value)}
                            placeholder="Type custom text..."
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                        />
                    </div>
                </div>

                <div className="info-group">
                    <label>User ID</label>
                    <input type="text" value={profile._id} disabled />
                </div>

                <div className="info-group">
                    <label>Email</label>
                    <input type="text" value={profile.email} disabled />
                </div>

                <div className="info-group">
                    <label>Profile Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                    />
                </div>

                <button type="submit" className="save-button">Save Profile Changes</button>
            </form>

            <form onSubmit={handleChangePassword} className="change-password-section">
                <h3>Change Password</h3>
                <div className="profile-info">
                    <div className="info-group">
                        <label>Current Password</label>
                        <input 
                            type="password" 
                            value={passwords.currentPassword} 
                            onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="info-group">
                        <label>New Password</label>
                        <input 
                            type="password" 
                            value={passwords.newPassword} 
                            onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="info-group">
                        <label>Confirm New Password</label>
                        <input 
                            type="password" 
                            value={passwords.confirmPassword} 
                            onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} 
                            required 
                        />
                    </div>
                    <button type="submit" className="password-button">Change Password</button>
                </div>
            </form>

            <button onClick={handleLogout} className="logout-button">Logout</button>

            {message.text && (
                <p className={message.type === 'success' ? 'success-message' : 'error-message'}>
                    {message.text}
                </p>
            )}
        </div>
    );
};

export default UserProfile;

