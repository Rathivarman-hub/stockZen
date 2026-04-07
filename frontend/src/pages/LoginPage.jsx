import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5 mt-5 d-flex justify-content-center">
        <div className="glass-panel p-5 animate-fade-up" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">Welcome Back</h2>
            <p className="text-muted">Sign in to manage your inventory</p>
          </div>
          
          {error && <div className="alert alert-danger py-2 bg-transparent text-danger border-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted fs-6 mb-1">Email Address</label>
              <input 
                type="email" 
                className="form-control form-control-glass w-100" 
                placeholder="admin@syncstock.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted fs-6 mb-1">Password</label>
              <input 
                type="password" 
                className="form-control form-control-glass w-100" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary-glow w-100 py-2 d-flex align-items-center justify-content-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>
          
          <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'var(--panel-border) !important' }}>
            <p className="text-muted fs-6 mb-0">
              Don't have an account? <Link to="/register" className="text-primary text-decoration-none">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
