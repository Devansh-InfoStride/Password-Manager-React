const crypto = require('crypto');

function generateSecureOTP() {
    return crypto.randomInt(100000, 999999);
}

module.exports = { generateSecureOTP };
