import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LockIcon, ShieldCheckIcon, AlertIcon, CheckIcon } from "../ui/icons";
import "../../styles/homepage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [notice, setNotice] = useState(
        location.state?.justSignedUp ? { type: 'success', text: 'Account created. Please sign in.' } : null
    ); // { type, text }
    const [submitting, setSubmitting] = useState(false);

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setNotice(null);
        setSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, otp: otpSent ? otp : undefined }),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.otp_sent) {
                    setOtpSent(true);
                    setNotice({ type: 'info', text: 'We sent a one-time code to your email.' });
                } else {
                    localStorage.setItem('token', data.token);
                    navigate('/', { replace: true });
                }
            } else {
                setNotice({ type: 'error', text: data.error || 'Login failed. Please try again.' });
            }
        } catch (error) {
            console.error('Login error:', error);
            setNotice({ type: 'error', text: 'Login failed. Is the server running?' });
        } finally {
            setSubmitting(false);
        }
    };

    const NoticeIcon = notice?.type === 'error' ? AlertIcon : notice?.type === 'success' ? CheckIcon : ShieldCheckIcon;

    return (
        <div className="auth-page">
            <div className="container">
                <div className="heading">
                    <span className="auth-brand"><LockIcon size={24} /></span>
                    <h1>Welcome back to PassGuard</h1>
                    <p>Sign in to access your encrypted vault.</p>
                    <h2>Login</h2>
                </div>
                <div className="signupForm">
                    {notice && (
                        <div className={`auth-notice ${notice.type}`}>
                            <NoticeIcon size={16} />
                            <span>{notice.text}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        {!otpSent ? (
                            <>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <label className="formHeading">
                                    <input
                                        type="checkbox"
                                        checked={showPassword}
                                        onChange={togglePassword}
                                    /> Show Password
                                </label>
                            </>
                        ) : (
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        )}
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Please wait…' : otpSent ? 'Verify OTP' : 'Login'}
                        </button>
                    </form>
                    <p>
                        Don't have an account? <Link to="/signup">Sign up here</Link>
                    </p>
                </div>
                <p className="auth-reassure">
                    <ShieldCheckIcon size={14} /> End-to-end encrypted · zero-knowledge
                </p>
            </div>
        </div>
    );
}

export default Login;
