const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const { sendOTPEmail } = require("./utils/mailer");
const OTP = require("./utils/otpDB");
const { generateSecureOTP } = require("./utils/otpGenerator");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer Configuration for Profile Photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Encryption Configuration
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = process.env.ENCRYPTION_KEY || "v6yB$E&H)MbQeThWmZq4t7w!z%C*F-Ja"; // 32 characters
const IV_LENGTH = 16;

const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (text) => {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, "secret_key", (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

// Healthcheck
app.get("/api/ping", (req, res) => res.json({ ok: true, pid: process.pid }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.DATABASE_URL;

mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "User" },
    profilePhoto: { type: String, default: "" }
});

const User = mongoose.model("User", userSchema);

const passwordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    site: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }, // stored as iv:encryptedData
    last_updated: { type: Date, default: Date.now }
});

const StoredPassword = mongoose.model("StoredPassword", passwordSchema);

// User Profile Routes
app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

app.put("/api/profile", authenticateToken, upload.single("profilePhoto"), async (req, res) => {
    try {
        const { name } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (req.file) updateData.profilePhoto = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");
        res.json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});

app.post("/api/profile/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid current password" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to change password" });
    }
});

// Signup Route
app.post("/api/signup", async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "Email already in use" });
        }

        if (!otp) {
            // Step 1: Send OTP
            const generatedOtp = generateSecureOTP().toString();
            await OTP.findOneAndUpdate(
                { email },
                { otp: generatedOtp, createdAt: new Date() },
                { upsert: true, new: true }
            );
            await sendOTPEmail(email, generatedOtp);
            return res.json({ message: "OTP sent to your email", otp_sent: true });
        }

        // Step 2: Verify OTP
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // OTP verified, delete it and create user
        await OTP.deleteOne({ _id: otpRecord._id });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Signup failed" });
    }
});

// Login Route
app.post("/api/login", async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        if (!otp) {
            // Step 1: Send OTP
            const generatedOtp = generateSecureOTP().toString();
            await OTP.findOneAndUpdate(
                { email },
                { otp: generatedOtp, createdAt: new Date() },
                { upsert: true, new: true }
            );
            await sendOTPEmail(email, generatedOtp);
            return res.json({ message: "OTP sent to your email", otp_sent: true });
        }

        // Step 2: Verify OTP
        const otpRecord = await OTP.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // OTP verified, delete it and return token
        await OTP.deleteOne({ _id: otpRecord._id });
        const token = jwt.sign({ id: user._id }, "secret_key", { expiresIn: "1h" });
        res.json({ token, message: "Login successful" });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// Password Management Routes
app.get("/api/passwords", authenticateToken, async (req, res) => {
    try {
        const passwords = await StoredPassword.find({ userId: req.user.id });
        const decryptedPasswords = passwords.map(p => ({
            _id: p._id,
            site: p.site,
            username: p.username,
            password: decrypt(p.password),
            last_updated: p.last_updated
        }));
        res.json(decryptedPasswords);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch passwords" });
    }
});

app.post("/api/passwords", authenticateToken, async (req, res) => {
    try {
        const { site, username, password } = req.body;
        const encryptedPassword = encrypt(password);
        const newPassword = new StoredPassword({
            userId: req.user.id,
            site,
            username,
            password: encryptedPassword,
            last_updated: new Date()
        });
        await newPassword.save();
        res.status(201).json({ 
            message: "Password saved successfully", 
            password: { 
                _id: newPassword._id, 
                site, 
                username, 
                password, 
                last_updated: newPassword.last_updated 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to save password" });
    }
});

app.delete("/api/passwords/:id", authenticateToken, async (req, res) => {
    try {
        await StoredPassword.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: "Password deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete password" });
    }
});

app.put("/api/passwords/:id", authenticateToken, async (req, res) => {
    try {
        const { site, username, password } = req.body;
        const encryptedPassword = encrypt(password);
        const updatedPassword = await StoredPassword.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { site, username, password: encryptedPassword, last_updated: new Date() },
            { new: true }
        );
        if (!updatedPassword) return res.status(404).json({ error: "Password not found" });
        res.json({ 
            message: "Password updated successfully", 
            password: { 
                _id: updatedPassword._id, 
                site, 
                username, 
                password, 
                last_updated: updatedPassword.last_updated 
            } 
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Failed to update password" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));