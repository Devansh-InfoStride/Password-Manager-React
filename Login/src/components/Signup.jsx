import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/homepage.css";

function Signup() {
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
      const response = await fetch('http://localhost:5000/api/signup', {
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
          alert('Signup successful! Please login.');
          window.location.href = '/login';
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Is the server running?');
    }
  };

  return (
    <div className="container">
      <div className="heading">
        <h1>Welcome to Password Manager</h1>
        <p>Create an account to manage your passwords securely.</p>
        <h2>Sign Up</h2>
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
                placeholder="Enter a strong password"
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
          <button type="submit">{otpSent ? "Verify OTP" : "Sign Up"}</button>
        </form>
        <p>
          Existing user? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
