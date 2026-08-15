import { useState } from 'react'
import { useShare } from '../../context/ShareContext'
import { VisibilityIcon, LockIcon, ShieldCheckIcon } from '../ui/icons'
import '../../styles/modal.css'
import '../../styles/vault.css'

const VaultModal = () => {
    const { hasKeys, isLocked, setupVault, unlockVault, loading } = useShare();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                <div className="confirm-icon confirm-icon-primary">
                    {hasKeys ? <LockIcon size={22} /> : <ShieldCheckIcon size={22} />}
                </div>
                <h2>{hasKeys ? 'Unlock Sharing Vault' : 'Set Up Secure Sharing'}</h2>
                <p>
                    {hasKeys
                        ? 'Enter your master password to decrypt your sharing keys for this session.'
                        : 'Create a master password to encrypt your sharing keys. It never leaves your device and cannot be recovered if lost.'}
                </p>
                <form onSubmit={handleSubmit} className="stacked-form">
                    <label htmlFor="master-password">Master Password</label>
                    <div className="password-input-wrap">
                        <input
                            id="master-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter master password"
                            autoFocus
                            required
                        />
                        <button
                            type="button"
                            className="icon-toggle"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                        >
                            <VisibilityIcon visible={showPassword} />
                        </button>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isPending} style={{ marginTop: '4px' }}>
                        {isPending ? 'Processing…' : hasKeys ? 'Unlock' : 'Create & Continue'}
                    </button>
                </form>
                <p className="vault-section-hint" style={{ justifyContent: 'center', marginTop: '18px', marginBottom: 0 }}>
                    <ShieldCheckIcon size={14} /> Zero-knowledge — we never see your master password
                </p>
            </div>
        </div>
    );
};

export default VaultModal;
