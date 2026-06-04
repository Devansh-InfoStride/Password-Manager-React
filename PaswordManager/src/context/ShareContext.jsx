import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/auth';
import { generateKeyPair, encryptPrivateKey, decryptPrivateKey } from '../utils/cryptoUtils';

const ShareContext = createContext();

export const useShare = () => useContext(ShareContext);

export const ShareProvider = ({ children }) => {
    const [privateKey, setPrivateKey] = useState(null);
    const [publicKey, setPublicKey] = useState(null);
    const [hasKeys, setHasKeys] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [loading, setLoading] = useState(true);

    const API_URL = '/api/keys';

    useEffect(() => {
        checkKeys();
    }, []);

    const checkKeys = async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/me`);
            if (response && response.ok) {
                const data = await response.json();
                if (data.publicKey && data.encryptedPrivateKey) {
                    setHasKeys(true);
                    setPublicKey(data.publicKey);
                }
            }
        } catch (error) {
            console.error('Error checking keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupVault = async (masterPassword) => {
        try {
            const { publicKey, privateKey } = await generateKeyPair();
            const encryptedPrivateKey = await encryptPrivateKey(privateKey, masterPassword);
            
            const response = await fetchWithAuth(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicKey, encryptedPrivateKey })
            });

            if (response && response.ok) {
                setPrivateKey(privateKey);
                setPublicKey(publicKey);
                setHasKeys(true);
                setIsLocked(false);
                return { success: true };
            }
        } catch (error) {
            console.error('Error setting up vault:', error);
            return { success: false, error: error.message };
        }
    };

    const unlockVault = async (masterPassword) => {
        try {
            const response = await fetchWithAuth(`${API_URL}/me`);
            if (response && response.ok) {
                const data = await response.json();
                const decryptedKey = await decryptPrivateKey(data.encryptedPrivateKey, masterPassword);
                setPrivateKey(decryptedKey);
                setPublicKey(data.publicKey);
                setIsLocked(false);
                return { success: true };
            }
        } catch (error) {
            console.error('Error unlocking vault:', error);
            return { success: false, error: error.message };
        }
    };

    const lockVault = () => {
        setPrivateKey(null);
        setIsLocked(true);
    };

    return (
        <ShareContext.Provider value={{ 
            privateKey, 
            publicKey, 
            hasKeys, 
            isLocked, 
            loading, 
            setupVault, 
            unlockVault, 
            lockVault 
        }}>
            {children}
        </ShareContext.Provider>
    );
};
