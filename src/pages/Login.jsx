// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ── Shared eye-toggle SVG icons ──────────────────────────────────────────────
function EyeOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitchToSignup }) {
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <form onSubmit={handleSubmit} noValidate>
      <div className="login-logo-wrap">
        <img src="/logo.svg" alt="UniPathway Logo" className="login-logo" />
      </div>

      <p>Sign in to continue</p>

      <div>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.email && <span role="alert">{fieldErrors.email}</span>}
      </div>

      <div>
        <label htmlFor="login-password">Password</label>
        <div className="login-password-wrap">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSubmitting}
            className="btn-ghost login-password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
          </button>
        </div>
        {fieldErrors.password && <span role="alert">{fieldErrors.password}</span>}
      </div>

      {serverError && <p role="alert" className="login-error">{serverError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>

      <p className="login-switch">
        Don&apos;t have an account?{' '}
        <button type="button" className="btn-link" onClick={onSwitchToSignup}>
          Sign up
        </button>
      </p>
    </form>
  );
}

// ── Signup form ───────────────────────────────────────────────────────────────
function SignupForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errors = {};

    if (!firstName.trim() || firstName.trim().length < 2)
      errors.firstName = 'First name must be at least 2 characters.';

    if (!lastName.trim() || lastName.trim().length < 2)
      errors.lastName = 'Last name must be at least 2 characters.';

    if (!USERNAME_REGEX.test(username))
      errors.username = 'Username must be 3-20 characters (letters, numbers, underscores).';

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

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      await register(firstName.trim(), lastName.trim(), username.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="login-logo-wrap">
        <img src="/logo.svg" alt="UniPathway Logo" className="login-logo" />
      </div>

      <p>Create your account</p>

      <div className="login-name-row">
        <div>
          <label htmlFor="signup-firstName">First Name</label>
          <input
            id="signup-firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.firstName && <span role="alert">{fieldErrors.firstName}</span>}
        </div>
        <div>
          <label htmlFor="signup-lastName">Last Name</label>
          <input
            id="signup-lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.lastName && <span role="alert">{fieldErrors.lastName}</span>}
        </div>
      </div>

      <div>
        <label htmlFor="signup-username">Username</label>
        <input
          id="signup-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          placeholder="3-20 chars, letters/numbers/underscores"
        />
        {fieldErrors.username && <span role="alert">{fieldErrors.username}</span>}
      </div>

      <div>
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.email && <span role="alert">{fieldErrors.email}</span>}
      </div>

      <div>
        <label htmlFor="signup-password">Password</label>
        <div className="login-password-wrap">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            placeholder="At least 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSubmitting}
            className="btn-ghost login-password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
          </button>
        </div>
        {fieldErrors.password && <span role="alert">{fieldErrors.password}</span>}
      </div>

      <div>
        <label htmlFor="signup-confirmPassword">Confirm Password</label>
        <div className="login-password-wrap">
          <input
            id="signup-confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isSubmitting}
            className="btn-ghost login-password-toggle"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
          </button>
        </div>
        {fieldErrors.confirmPassword && <span role="alert">{fieldErrors.confirmPassword}</span>}
      </div>

      {serverError && <p role="alert" className="login-error">{serverError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>

      <p className="login-switch">
        Already have an account?{' '}
        <button type="button" className="btn-link" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </form>
  );
}

// ── Page shell (shared layout + mode toggle) ──────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  const [bannerKey, setBannerKey] = useState(0);
  const hoverCooldown = { current: false };

  function handleBannerHover() {
    if (hoverCooldown.current) return;
    hoverCooldown.current = true;
    setBannerKey(k => k + 1);
    setTimeout(() => { hoverCooldown.current = false; }, 1500);
  }

  return (
    <div className="login-page">
      <div className="login-split-card">

        {/* Left: Welcome panel */}
        <div className="login-welcome-panel">
          <img
            src={`/welcome-banner.svg?v=5&t=${bannerKey}`}
            alt="Welcome to UniPathway"
            onMouseEnter={handleBannerHover}
            className="login-banner-img"
          />
        </div>

        {/* Right: form — swaps between login and signup */}
        {mode === 'login'
          ? <LoginForm  onSwitchToSignup={() => setMode('signup')} />
          : <SignupForm onSwitchToLogin={()  => setMode('login')}  />
        }

      </div>
    </div>
  );
}
