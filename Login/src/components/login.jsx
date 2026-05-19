import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/homepage.css";

function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Login form submitted");
        // Handle login logic here
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
