import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Activity, LayoutDashboard, LogIn, LogOut, User, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClose = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClose);
    }

    return () => {
      document.removeEventListener('mousedown', handleClose);
    };
  }, [menuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleNavigate = (forceTop) => {
    setMenuOpen(false);
    if (forceTop === true) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav ref={navRef} className={`navbar navbar-expand-lg ${theme === 'light' ? 'navbar-light' : 'navbar-dark'} navbar-glass py-3`}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/" onClick={() => handleNavigate(true)}>
          <div className="bg-primary rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            <Package size={20} className="text-white" />
          </div>
          <span className="fs-4" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>StockZen <span className="text-primary">IMS</span></span>
        </Link>

        <div className="d-flex align-items-center gap-2 gap-lg-3 ms-auto me-2 me-lg-0 order-lg-3">
          <button
            onClick={toggleTheme}
            className="btn btn-outline-glass d-flex align-items-center justify-content-center p-2 rounded-circle border-0"
            title="Switch Theme"
            style={{ width: '40px', height: '40px', transition: 'all 0.3s' }}
          >
            {theme === 'dark' ? <Sun size={20} className="text-warning" /> : <Moon size={20} className="text-primary" />}
          </button>
          
          {user && <NotificationDropdown />}
        </div>

        {/* Custom hamburger — toggles open/closed */}
        <button
          className="navbar-toggler shadow-none border-0 order-lg-4"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          style={{ width: '40px', height: '40px', padding: '0' }}
        >
          <div className="d-flex align-items-center justify-content-center h-100 w-100">
            {menuOpen ? <X size={24} style={{ color: 'var(--text-main)' }} /> : <Menu size={24} style={{ color: 'var(--text-main)' }} />}
          </div>
        </button>

        {/* Controlled collapse using React state */}
        <div className={`navbar-collapse order-lg-2 ${menuOpen ? 'show d-block' : 'collapse d-none d-lg-flex'}`} id="navbarNav">
          {/* Main Links - centered */}
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-2 gap-lg-4 text-center align-items-center">
            <li className="nav-item position-relative w-100">
              <Link className={`nav-link pb-1 ${location.pathname === '/' && location.hash !== '#features' ? 'nav-tab-active' : ''}`} to="/" onClick={() => handleNavigate(true)}>Home</Link>
            </li>
            <li className="nav-item position-relative w-100">
              <Link className={`nav-link pb-1 ${location.hash === '#features' ? 'nav-tab-active' : ''}`} to="/#features" onClick={() => handleNavigate(false)}>Features</Link>
            </li>
            <li className="nav-item position-relative w-100">
              <Link className={`nav-link pb-1 ${location.pathname === '/dashboard' ? 'nav-tab-active' : ''}`} to="/dashboard" onClick={() => handleNavigate(true)}>Dashboard</Link>
            </li>
          </ul>

          {/* Auth Actions */}
          <div className="d-flex flex-column flex-lg-row align-items-center gap-3 mt-4 mt-lg-0 pb-3 pb-lg-0">
            {user ? (
              <>
                <div className="nav-link d-flex align-items-center gap-2 cursor-pointer px-0" style={{ color: 'var(--text-main)' }}>
                  <User size={18} />
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="badge bg-primary ms-1" style={{ fontSize: '0.65rem' }}>
                      ADMIN
                    </span>
                  )}
                  {user.role === 'user' && (
                    <span className="badge bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25 ms-1" style={{ fontSize: '0.65rem' }}>
                      USER
                    </span>
                  )}
                </div>

                <button onClick={() => { logout(); handleNavigate(); }} className="btn btn-outline-glass d-flex align-items-center gap-2 px-3 py-2 border-0 opacity-75 hover-opacity-100">
                  <LogOut size={18} /> <span className="d-lg-none">Logout</span>
                </button>

                <Link to="/dashboard" className="btn btn-primary-glow d-flex align-items-center justify-content-center gap-2" onClick={handleNavigate}>
                  <LayoutDashboard size={18} />
                  App
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link d-flex align-items-center gap-2 px-0" onClick={handleNavigate}>
                  <LogIn size={18} />
                  <span>Login</span>
                </Link>
                <Link to="/login" className="btn btn-primary-glow d-flex align-items-center justify-content-center gap-2" onClick={handleNavigate}>
                  <LayoutDashboard size={18} />
                  Open App
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

