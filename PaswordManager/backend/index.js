const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Healthcheck
app.get('/api/ping', (req, res) => res.json({ ok: true, pid: process.pid }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.DATABASE_URL;

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Signup Route
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Check if email already exists to provide a friendly error
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        // Log error for debugging
        console.error('Signup error:', error);
        // Handle duplicate key (email already exists)
        const msg = String((error && (error.message || error)) || '');
        if (
            (error && error.code === 11000) ||
            msg.includes('E11000') ||
            msg.toLowerCase().includes('duplicate key') ||
            (error && error.keyPattern && error.keyPattern.email) ||
            (error && error.keyValue && error.keyValue.email)
        ) {
            console.error('Duplicate-email detected for signup:', msg);
            return res.status(409).json({ error: 'Email already in use' });
        }

        res.status(400).json({ error: 'Signup failed' });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
