import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [bannerKey, setBannerKey] = useState(0);
  const hoverCooldown = { current: false };

  function handleBannerHover() {
    if (hoverCooldown.current) return;
    hoverCooldown.current = true;
    setBannerKey(k => k + 1);
    setTimeout(() => { hoverCooldown.current = false; }, 1500);
  }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="login-loading-overlay">
          <div className="page-spinner__ring">
            <div /><div /><div /><div />
          </div>
          <p className="page-spinner__text">Logging in...</p>
        </div>
      )}

      {/* Split Layout Container */}
      <div className="login-split-card">
        
        {/* Left Side: Welcome Panel */}
        <div className="login-welcome-panel">
          <img
            src={`/welcome-banner.svg?v=5&t=${bannerKey}`}
            alt="Welcome to UniPathway"
            onMouseEnter={handleBannerHover}
            className="login-banner-img"
          />
        </div>

        {/* Right Side: The Form */}
        <form onSubmit={handleSubmit} noValidate>
          
          <div className="login-logo-wrap">
            <img 
              src="/logo.svg"
              alt="UniPathway Logo" 
              className="login-logo"
            />
          </div>
          
          <p>
            Sign in to continue
          </p>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.email && <span role="alert">{fieldErrors.email}</span>}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="btn-ghost login-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && <span role="alert">{fieldErrors.password}</span>}
          </div>

          {serverError && <p role="alert" className="login-error">{serverError}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
      </div>
    </div>
  );
}