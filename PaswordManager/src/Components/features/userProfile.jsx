import React, { useState, useEffect } from 'react';
import { fetchWithAuth, logout } from '../../utils/auth';
import '../../styles/userProfile.css';

const UserProfile = () => {
    const [profile, setProfile] = useState({
        _id: '',
        name: '',
        email: '',
        profilePhoto: ''
    });
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
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
            const response = await fetchWithAuth('http://localhost:5000/api/profile');
            if (response && response.ok) {
                const data = await response.json();
                setProfile(data);
                setName(data.name);
                setPhotoPreview(data.profilePhoto ? `http://localhost:5000${data.profilePhoto}` : null);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        if (photo) {
            formData.append('profilePhoto', photo);
        }

        try {
            const response = await fetchWithAuth('http://localhost:5000/api/profile', {
                method: 'PUT',
                body: formData
            });
            if (response && response.ok) {
                setMessage({ text: 'Profile updated successfully! Reloading...', type: 'success' });
                // Hard reload to ensure all components (Header, etc.) see the changes
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
            const response = await fetchWithAuth('http://localhost:5000/api/profile/change-password', {
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
                <div className="profile-photo-section">
                    <img 
                        src={photoPreview || 'https://via.placeholder.com/150'} 
                        alt="Profile" 
                        className="profile-photo" 
                    />
                    <label className="photo-upload-label">
                        📷
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoChange} 
                        />
                    </label>
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
