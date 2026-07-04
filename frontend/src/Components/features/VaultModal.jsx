import React, { useState } from 'react';
import { useShare } from '../../context/ShareContext';
import '../../styles/modal.css';

const VaultModal = () => {
    const { hasKeys, isLocked, setupVault, unlockVault, loading } = useShare();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isPending, setIsPending] = useState(false);

    if (loading || (!hasKeys && !isLocked) || (hasKeys && !isLocked)) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsPending(true);
        
        const result = hasKeys 
            ? await unlockVault(password)
            : await setupVault(password);
            
        if (!result.success) {
            setError(result.error || 'Failed to process request');
        }
        setIsPending(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{hasKeys ? 'Unlock Sharing Vault' : 'Setup Secure Sharing'}</h2>
                <p>
                    {hasKeys 
                        ? 'Enter your Master Password to unlock sharing features.' 
                        : 'Create a Master Password. This will be used to encrypt your sharing keys and cannot be recovered if lost.'}
                </p>
                <form onSubmit={handleSubmit} className="stacked-form">
                    <label htmlFor="master-password">Master Password</label>
                    <input 
                        id="master-password"
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter Master Password"
                        required 
                    />
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isPending}>
                        {isPending ? 'Processing...' : (hasKeys ? 'Unlock' : 'Setup')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VaultModal;
