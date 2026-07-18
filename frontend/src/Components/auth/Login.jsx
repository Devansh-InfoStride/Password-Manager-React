import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/homepage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

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
                    alert('OTP sent to your email!');
                } else {
                    localStorage.setItem('token', data.token);
                    navigate('/', { replace: true });
                }
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Is the server running?');
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="heading">
                    <h1>Welcome to Password Manager</h1>
                    <p>Create an account to manage your passwords securely.</p>
                    <h2>Login</h2>
                </div>
                <div className="signupForm">
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
                        <button type="submit">{otpSent ? "Verify OTP" : "Login"}</button>
                    </form>
                    <p>
                        Don't have an account? <Link to="/signup">Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
