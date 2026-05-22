const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // OTP expires in 5 minutes (300 seconds)
    }
});

// Add index for userId (remove unique to avoid TTL race conditions)
otpSchema.index({ userId: 1 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
