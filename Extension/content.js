/**
 * Content script to handle smart autofilling
 */

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

    // Usually the first password field is the one we want
    const passwordField = passwordFields[0];
    
    // Find the username field associated with this password field
    const usernameField = findUsernameField(passwordField);

    if (passwordField) {
        passwordField.value = password;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (usernameField && username) {
        usernameField.value = username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return true;
}

function findUsernameField(passwordField) {
    // 1. Look for common username/email fields in the same form
    const form = passwordField.closest('form');
    if (form) {
        const inputs = form.querySelectorAll('input:not([type="password"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])');
        for (const input of inputs) {
            if (isUsernameField(input)) return input;
        }
    }

    // 2. Look for fields preceding the password field in the DOM
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
    
    return indicators.some(ind => 
        name.includes(ind) || 
        id.includes(ind) || 
        placeholder.includes(ind) || 
        ariaLabel.includes(ind)
    ) || type === 'email';
}
