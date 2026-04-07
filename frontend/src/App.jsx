import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { InventoryProvider } from './context/InventoryContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ScrollToTop from './components/ScrollToTop';
import BackToTopButton from './components/BackToTopButton';
import Chatbot from './components/Chatbot';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary" role="status"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InventoryProvider>
          <NotificationProvider>
            <Router>
              <ScrollToTop />
              <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Home />} />
          </Routes>
          <BackToTopButton />
          <Chatbot />
        </Router>
          </NotificationProvider>
        </InventoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
