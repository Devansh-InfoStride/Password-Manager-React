import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/homepage.css";

function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                alert('Login successful! Redirecting to Password Manager...');
                // Redirecting to Password Manager application and pass token so
                // the other app can save it to its own origin's localStorage.
                // Password Manager app reads `token` from query params.
                const redirectUrl = `http://localhost:5174/?token=${encodeURIComponent(
                    data.token
                )}`;
                window.location.href = redirectUrl;
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
                    <input type="email" name="email" placeholder="Email" required />
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="Enter a strong password"
                        required
                    />
                    <label htmlFor="password" className="formHeading">
                        <input 
                            type="checkbox" 
                            checked={showPassword} 
                            onChange={togglePassword} 
                        /> Show Password
                    </label>
                    <button type="submit">Login</button>
                </form>
                <p>
                    Don't have an account? <Link to="/">Sign up here</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
