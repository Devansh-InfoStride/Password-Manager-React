import { decryptPrivateKey, decryptWithPrivateKey } from './crypto.js';

const API_BASE = 'http://localhost:5000/api';

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const otpGroup = document.getElementById('otp-group');
const otpInput = document.getElementById('otp');
const loginBtn = document.getElementById('login-btn');
const errorMsg = document.getElementById('error-msg');
const passwordList = document.getElementById('password-list');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search');

let authToken = '';
let masterPassword = '';
let sharedPasswords = [];

// Initialize
chrome.storage.local.get(['token'], (result) => {
    if (result.token) {
        authToken = result.token;
        showDashboard();
    }
});

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const otp = otpInput.value;

    if (!email || !password) {
        errorMsg.textContent = 'Please enter email and password';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, otp })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.otp_sent) {
                otpGroup.classList.remove('hidden');
                errorMsg.textContent = 'OTP sent to your email';
                errorMsg.style.color = '#2563eb';
                return;
            }

            authToken = data.token;
            masterPassword = password; // Store temporarily for decryption
            chrome.storage.local.set({ token: authToken });
            showDashboard();
        } else {
            errorMsg.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        errorMsg.textContent = 'Connection error';
    }
});

logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['token'], () => {
        authToken = '';
        masterPassword = '';
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    });
});

async function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    await fetchSharedPasswords();
}

async function fetchSharedPasswords() {
    try {
        const response = await fetch(`${API_BASE}/share/received`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            sharedPasswords = await response.json();
            renderPasswords();
        } else {
            // Probably token expired
            logoutBtn.click();
        }
    } catch (error) {
        console.error('Failed to fetch passwords', error);
    }
}

function renderPasswords(filter = '') {
    passwordList.innerHTML = '';
    const filtered = sharedPasswords.filter(p => 
        p.site.toLowerCase().includes(filter.toLowerCase()) || 
        p.username.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        passwordList.innerHTML = '<p style="text-align:center; color:#64748b;">No shared passwords found</p>';
        return;
    }

    filtered.forEach(p => {
        const item = document.createElement('div');
        item.className = 'password-item';
        item.innerHTML = `
            <div class="password-info">
                <span class="site-name">${p.site}</span>
                <span class="username">${p.username}</span>
            </div>
            <button class="fill-btn" data-id="${p._id}">Fill</button>
        `;
        item.querySelector('.fill-btn').addEventListener('click', () => handleFill(p));
        passwordList.appendChild(item);
    });
}

async function handleFill(p) {
    try {
        // 1. Fetch user's keys
        const keysRes = await fetch(`${API_BASE}/keys/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const { encryptedPrivateKey } = await keysRes.json();

        // 2. Decrypt private key with master password
        if (!masterPassword) {
            masterPassword = prompt('Please enter your Master Password to decrypt this shared password:');
            if (!masterPassword) return;
        }

        const privateKey = await decryptPrivateKey(encryptedPrivateKey, masterPassword);

        // 3. Decrypt the shared password
        const decryptedPassword = await decryptWithPrivateKey(p.encryptedPassword, privateKey);

        // 4. Send to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'fill_credentials',
                    username: p.username,
                    password: decryptedPassword
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        alert('Please refresh the page to use the extension.');
                    } else if (response && response.success) {
                        window.close(); // Close popup after filling
                    }
                });
            }
        });
    } catch (error) {
        alert(error.message);
        masterPassword = ''; // Reset if failed (maybe wrong password)
    }
}

searchInput.addEventListener('input', (e) => {
    renderPasswords(e.target.value);
});
