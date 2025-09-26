import React from 'react';
import { AppBar, Button, Toolbar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Button component={Link} to="/" color="inherit">Home</Button>
        {isAuthenticated ? (
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        ) : (
          <Button component={Link} to="/login" color="inherit">Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;