import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTriangleExclamation } from "react-icons/fa6";

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(name.trim(), email.trim(), password, role);
      navigate('/');
    } catch (err) {
      setError(err.errors[0] || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card glass-effect animate-fade-in">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up to start tracking your tasks.</p>
        </div>

        {error && <div className="auth-error-banner"><FaTriangleExclamation aria-hidden="true" /> {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address *</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password *</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-role">Role</label>
            <div className="role-picker" role="radiogroup" aria-labelledby="reg-role">
              <button
                type="button"
                className={`role-option ${role === 'USER' ? 'active' : ''}`}
                onClick={() => setRole('USER')}
                aria-pressed={role === 'USER'}
              >
                <span className="role-option-title">User</span>
                <span className="role-option-subtitle">Standard Access</span>
              </button>

              <button
                type="button"
                className={`role-option ${role === 'ADMIN' ? 'active' : ''}`}
                onClick={() => setRole('ADMIN')}
                aria-pressed={role === 'ADMIN'}
              >
                <span className="role-option-title">Admin</span>
                <span className="role-option-subtitle">Full Control Panel</span>
              </button>
            </div>
            <small className="form-hint">
              * Note: The very first user registered is automatically assigned ADMIN privileges.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
