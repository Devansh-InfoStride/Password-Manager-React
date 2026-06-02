import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/homepage.css";

function Login() {
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
            const response = await fetch('http://localhost:5000/api/login', {
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
                    alert('Login successful! Redirecting to Password Manager...');
                    const redirectUrl = `http://localhost:5173/?token=${encodeURIComponent(data.token)}`;
                    window.location.href = redirectUrl;
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
                    Don't have an account? <Link to="/">Sign up here</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
