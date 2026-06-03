/**
 * Cryptographic utilities for the Pass Guard Extension
 */

const RSA_ALGO = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

const AES_ALGO = "AES-GCM";

function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
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

export async function decryptPrivateKey(encryptedStr, password) {
    const combined = new Uint8Array(base64ToBuffer(encryptedStr));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);
    
    const key = await deriveKey(password, salt);
    
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: AES_ALGO, iv: iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        throw new Error("Invalid Master Password");
    }
}

export async function decryptWithPrivateKey(encryptedStr, privateKeyStr) {
    const privateKeyBuffer = base64ToBuffer(privateKeyStr);
    const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        RSA_ALGO,
        true,
        ["decrypt"]
    );
    
    const encryptedData = base64ToBuffer(encryptedStr);
    const decrypted = await crypto.subtle.decrypt(
        RSA_ALGO,
        privateKey,
        encryptedData
    );
    
    return new TextDecoder().decode(decrypted);
}
