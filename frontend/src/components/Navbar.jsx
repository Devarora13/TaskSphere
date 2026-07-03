import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaRocket } from "react-icons/fa";

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass-effect">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaRocket className="logo-icon" aria-hidden="true" />
          <span className="logo-text">TaskSphere</span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/" className="nav-link">
                Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className="nav-link admin-link-badge">
                  Admin Panel
                </Link>
              )}
              
              <div className="nav-user-info">
                <span className="user-name">{user.name}</span>
                <span className={`user-role-badge ${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </div>
              
              <button onClick={handleLogout} className="btn btn-outline btn-sm logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
