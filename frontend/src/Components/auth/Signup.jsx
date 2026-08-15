import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheckIcon, AlertIcon, CheckIcon } from "../ui/icons";
import "../../styles/homepage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState(null); // { type, text }
  const [submitting, setSubmitting] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
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
          navigate('/login', { state: { justSignedUp: true } });
        }
      } else {
        setNotice({ type: 'error', text: data.error || 'Signup failed. Please try again.' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setNotice({ type: 'error', text: 'Signup failed. Is the server running?' });
    } finally {
      setSubmitting(false);
    }
  };

  const NoticeIcon = notice?.type === 'error' ? AlertIcon : notice?.type === 'success' ? CheckIcon : ShieldCheckIcon;

  return (
    <div className="auth-page">
      <div className="container">
        <div className="heading">
          <span className="auth-brand"><ShieldCheckIcon size={24} /></span>
          <h1>Create your PassGuard account</h1>
          <p>Manage every password behind end-to-end encryption.</p>
          <h2>Sign Up</h2>
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
            <button type="submit" disabled={submitting}>
              {submitting ? 'Please wait…' : otpSent ? 'Verify OTP' : 'Sign Up'}
            </button>
          </form>
          <p>
            Existing user? <Link to="/login">Login here</Link>
          </p>
        </div>
        <p className="auth-reassure">
          <ShieldCheckIcon size={14} /> Your data is encrypted before it leaves your device
        </p>
      </div>
    </div>
  );
}

export default Signup;
