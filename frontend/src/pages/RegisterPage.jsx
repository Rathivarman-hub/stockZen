import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5 mt-4 d-flex justify-content-center">
        <div className="glass-panel p-5 animate-fade-up" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">Create Account</h2>
            <p className="text-muted">Start managing inventory in real-time</p>
          </div>
          
          {error && <div className="alert alert-danger py-2 bg-transparent text-danger border-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted fs-6 mb-1">Full Name</label>
              <input 
                type="text" 
                className="form-control form-control-glass w-100" 
                placeholder="Jane Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-muted fs-6 mb-1">Email Address</label>
              <input 
                type="email" 
                className="form-control form-control-glass w-100" 
                placeholder="you@company.com" 
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
              {isSubmitting ? 'Creating...' : <><UserPlus size={18} /> Sign Up</>}
            </button>
          </form>
          
          <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'var(--panel-border) !important' }}>
            <p className="text-muted fs-6 mb-0">
              Already have an account? <Link to="/login" className="text-primary text-decoration-none">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
