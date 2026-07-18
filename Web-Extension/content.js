/**
 * Content script to handle smart autofilling, security overlays, and interaction blocking
 */

// Inject CSS for the blur overlay and interaction blocker
const style = document.createElement('style');
style.textContent = `
    .pass-guard-overlay {
        position: absolute;
        pointer-events: none;
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        border: 1px solid rgba(37, 99, 235, 0.3);
        transition: opacity 0.3s;
    }
    .pass-guard-overlay::after {
        content: '🔒 Protected';
        font-size: 10px;
        color: #2563eb;
        font-weight: bold;
        background: white;
        padding: 2px 6px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .pass-guard-hidden {
        opacity: 0 !important;
    }
    .pass-guard-blocker {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 255, 255, 0.01);
        z-index: 2147483647;
        cursor: wait;
        pointer-events: all;
    }
`;
document.head.appendChild(style);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fill_credentials') {
        const { username, password } = request;
        const success = fillForm(username, password);
        sendResponse({ success });
    }
});

function fillForm(username, password) {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    if (passwordFields.length === 0) return false;

    // 1. Show interaction blocker
    const blocker = document.createElement('div');
    blocker.className = 'pass-guard-blocker';
    document.body.appendChild(blocker);

    const passwordField = passwordFields[0];
    const usernameField = findUsernameField(passwordField);

    if (passwordField) {
        passwordField.value = password;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        applyProtection(passwordField);
    }

    if (usernameField && username) {
        usernameField.value = username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    setTimeout(() => {
        const submitBtn = findSubmitButton(passwordField);
        if (submitBtn) {
            submitBtn.click();
        } else {
            const form = passwordField.closest('form');
            if (form) form.submit();
        }
        // Safety removal
        setTimeout(() => blocker.remove(), 2000);
    }, 500);

    return true;
}

function findSubmitButton(passwordField) {
    const form = passwordField.closest('form');
    if (form) {
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) return submitBtn;
        const buttons = form.querySelectorAll('button, input[type="button"]');
        for (const btn of buttons) {
            const text = (btn.innerText || btn.value || '').toLowerCase();
            if (text.includes('log') || text.includes('sign') || text.includes('submit') || text.includes('enter')) return btn;
        }
    }
    const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
    const passRect = passwordField.getBoundingClientRect();
    let closestBtn = null;
    let minDistance = Infinity;
    allButtons.forEach(btn => {
        const btnRect = btn.getBoundingClientRect();
        if (btnRect.top >= passRect.bottom && btnRect.top <= passRect.bottom + 200) {
            const distance = Math.sqrt(Math.pow(btnRect.left - passRect.left, 2) + Math.pow(btnRect.top - passRect.top, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestBtn = btn;
            }
        }
    });
    return closestBtn;
}

function applyProtection(field) {
    const existing = field.getAttribute('data-pass-guard-id');
    if (existing) {
        const oldOverlay = document.getElementById(existing);
        if (oldOverlay) oldOverlay.remove();
    }
    const overlay = document.createElement('div');
    const id = 'pg-' + Math.random().toString(36).substr(2, 9);
    overlay.id = id;
    overlay.className = 'pass-guard-overlay';
    field.setAttribute('data-pass-guard-id', id);
    const updatePosition = () => {
        const rect = field.getBoundingClientRect();
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        if (rect.width === 0 || rect.height === 0 || getComputedStyle(field).display === 'none') {
            overlay.classList.add('pass-guard-hidden');
        } else {
            overlay.classList.remove('pass-guard-hidden');
        }
    };
    document.body.appendChild(overlay);
    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    const observer = new MutationObserver(() => {
        if (!document.body.contains(field)) {
            overlay.remove();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function findUsernameField(passwordField) {
    const form = passwordField.closest('form');
    if (form) {
        const inputs = form.querySelectorAll('input:not([type="password"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])');
        for (const input of inputs) if (isUsernameField(input)) return input;
    }
    const allInputs = Array.from(document.querySelectorAll('input'));
    const passIdx = allInputs.indexOf(passwordField);
    if (passIdx > 0) {
        for (let i = passIdx - 1; i >= 0; i--) {
            const input = allInputs[i];
            if (input.type !== 'password' && isUsernameField(input)) return input;
        }
    }
    return null;
}

function isUsernameField(input) {
    const type = input.getAttribute('type') || 'text';
    if (type !== 'text' && type !== 'email') return false;
    const name = (input.getAttribute('name') || '').toLowerCase();
    const id = (input.getAttribute('id') || '').toLowerCase();
    const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const indicators = ['user', 'email', 'login', 'account', 'handle', 'member', 'id'];
    return indicators.some(ind => name.includes(ind) || id.includes(ind) || placeholder.includes(ind) || ariaLabel.includes(ind)) || type === 'email';
}
