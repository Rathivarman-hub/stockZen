import React, { useEffect, useState } from 'react';
import { Users, Package, RefreshCw, ShoppingCart, AlertTriangle } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
};

const LiveStats = () => {
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalProducts: 0,
    liveStockUpdates: 0,
    ordersProcessedToday: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/stats`);
        setStats(data);
      } catch (err) {
        console.error('Failed to load initial stats', err);
      }
    };
    fetchInitialStats();

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    socket.on('stats:update', (newStats) => {
      setStats(newStats);
    });

    return () => socket.disconnect();
  }, []);

  const statCards = [
    { label: 'Active Users', value: stats.activeUsers, icon: <Users size={24} className="text-primary"/>, hue: 'primary' },
    { label: 'Total Products', value: stats.totalProducts, icon: <Package size={24} className="text-success"/>, hue: 'success' },
    { label: 'Live Updates', value: stats.liveStockUpdates, icon: <RefreshCw size={24} className="text-info"/>, hue: 'info' },
    { label: 'Orders Processed', value: stats.ordersProcessedToday, icon: <ShoppingCart size={24} className="text-warning"/>, hue: 'warning' },
    { label: 'Low Stock Alerts', value: stats.lowStockItems, icon: <AlertTriangle size={24} className="text-danger"/>, hue: 'danger' }
  ];

  return (
    <section className="py-5 animate-fade-up border-top border-bottom" style={{ borderColor: 'var(--panel-border)' }}>
      <div className="container">
        <div className="d-flex align-items-center justify-content-center gap-2 mb-4 text-center">
          <span className="position-relative d-flex h-3 w-3 align-items-center justify-content-center">
            <span className="spinner-grow spinner-grow-sm text-success" role="status" style={{ width: '12px', height: '12px' }}></span>
          </span>
          <h5 className="fw-bold mb-0 text-muted text-uppercase tracking-wider fs-6">Live System Telemetry</h5>
        </div>
        
        <div className="row g-4 justify-content-center">
          {statCards.map((stat, idx) => (
            <div key={idx} className="col-6 col-md-4 col-lg-2 flex-grow-1">
              <div 
                className="glass-panel p-4 text-center h-100 d-flex flex-column align-items-center justify-content-center"
                style={{ 
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 10px 25px rgba(var(--bs-${stat.hue}-rgb), 0.15)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'var(--bs-box-shadow)';
                }}
              >
                <div className={`mb-3 p-2 rounded-circle bg-${stat.hue} bg-opacity-10 d-inline-flex`}>
                  {stat.icon}
                </div>
                <h2 className="fw-bold display-6 mb-1" style={{ color: 'var(--text-main)' }}>
                  <CountUp end={stat.value || 0} />
                </h2>
                <p className="text-muted mb-0 fs-6 fw-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
