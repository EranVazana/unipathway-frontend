import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/usersService';

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
      {/* Updated Brand Section with ONLY the Logo */}
      <Link to="/home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img 
          src="/logo.svg?v=2" 
          alt="UniPathway Logo" 
          style={{ width: 'auto', height: '50px' }}
        />
      </Link>

      <Link to="/home">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      {currentUser?.userRole === 'admin' && <Link to="/users">Users</Link>}
      <Link to="/settings">Settings</Link>

      <span>{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''}</span>

      <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </nav>
  );
}