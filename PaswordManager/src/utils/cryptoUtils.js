/**
 * Cryptographic utilities for End-to-End Encrypted Password Sharing
 * Uses Web Crypto API for RSA-OAEP and AES-GCM
 */

const RSA_ALGO = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

const AES_ALGO = "AES-GCM";

// Helper: Convert ArrayBuffer to Base64
function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate a new RSA Key Pair
 */
export async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        RSA_ALGO,
        true, // extractable
        ["encrypt", "decrypt"]
    );
    
    // Export keys to string format
    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    
    return {
        publicKey: bufferToBase64(publicKey),
        privateKey: bufferToBase64(privateKey)
    };
}

/**
 * Derive an AES-GCM key from a password using PBKDF2
 */
async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: AES_ALGO, length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypt the Private Key string using a Master Password
 */
export async function encryptPrivateKey(privateKeyStr, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
        { name: AES_ALGO, iv: iv },
        key,
        enc.encode(privateKeyStr)
    );
    
    // Combine salt, iv, and encrypted data into a single string
    const result = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
    result.set(new Uint8Array(salt), 0);
    result.set(new Uint8Array(iv), salt.byteLength);
    result.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
    
    return bufferToBase64(result.buffer);
}

/**
 * Decrypt the Private Key string using a Master Password
 */
export async function decryptPrivateKey(encryptedStr, password) {
    const combined = new Uint8Array(base64ToBuffer(encryptedStr));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);
    
    const key = await deriveKey(password, salt);
    
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: AES_ALGO, iv: iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        throw new Error("Invalid Master Password");
    }
}

/**
 * Encrypt a message with a Public Key string
 */
export async function encryptWithPublicKey(text, publicKeyStr) {
    const publicKeyBuffer = base64ToBuffer(publicKeyStr);
    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        RSA_ALGO,
        true,
        ["encrypt"]
    );
    
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
        RSA_ALGO,
        publicKey,
        enc.encode(text)
    );
    
    return bufferToBase64(encrypted);
}

/**
 * Decrypt a message with a Private Key string
 */
export async function decryptWithPrivateKey(encryptedStr, privateKeyStr) {
    const privateKeyBuffer = base64ToBuffer(privateKeyStr);
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        RSA_ALGO,
        true,
        ["decrypt"]
    );
    
    const encryptedData = base64ToBuffer(encryptedStr);
    const decrypted = await window.crypto.subtle.decrypt(
        RSA_ALGO,
        privateKey,
        encryptedData
    );
    
    return new TextDecoder().decode(decrypted);
}
