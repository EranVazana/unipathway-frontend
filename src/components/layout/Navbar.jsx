import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../services/usersService';

function navClass({ isActive }) {
  return isActive ? 'nav-link nav-link--active' : 'nav-link';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Spec requires the Navbar to pull user info from GET /api/users/me.
  // We seed with the context user (from login) so there's no empty flash,
  // then refresh from the backend in case it changed since login.
  const [currentUser, setCurrentUser] = useState(user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    usersService
      .getCurrentUser()
      .then((data) => {
        if (isMounted) setCurrentUser(data);
      })
      .catch(() => {
        // If /me fails, just keep showing the cached login user; not worth blocking the navbar
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav>
      <NavLink to="/about" className="nav-brand">
        <img
          src="/logo.svg?v=2"
          alt="UniPathway Logo"
          style={{ width: 'auto', height: '50px' }}
        />
      </NavLink>

      <NavLink to="/home" className={navClass}>Home</NavLink>
      <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
      {currentUser?.userRole === 'admin' && (
        <NavLink to="/users" className={navClass}>Users</NavLink>
      )}
      <NavLink to="/settings" className={navClass}>Settings</NavLink>

      <span>{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}</span>

      <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </nav>
  );
}