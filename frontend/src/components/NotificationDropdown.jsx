import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification();

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClose = (event) => {
      // For clicks, check if it's outside. For scrolls, just close.
      if (event.type === 'scroll') {
        setIsOpen(false);
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClose);
      window.addEventListener('scroll', handleClose, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [isOpen]);

  const getIcon = (type) => {
    switch (type) {
      case 'error': return <XCircle size={18} className="text-danger" />;
      case 'warning': return <AlertTriangle size={18} className="text-warning" />;
      case 'success': return <CheckCircle size={18} className="text-success" />;
      default: return <Info size={18} className="text-info" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMin = Math.round((now - date) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline-glass position-relative d-flex align-items-center justify-content-center p-2 rounded-circle border-0"
        style={{ width: '40px', height: '40px' }}
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-white' : 'text-muted'} />
        {unreadCount > 0 && (
          <span className="position-absolute translate-middle badge rounded-pill bg-danger shadow pulse-badge" style={{ top: '8px', right: '-8px' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="position-absolute mt-3 glass-panel animate-fade-up shadow-lg overflow-hidden dropdown-aligned"
          style={{ width: '380px', zIndex: 1050, transformOrigin: 'top right' }}
        >
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ borderColor: 'var(--panel-border)' }}>
            <h6 className="fw-bold mb-0" style={{ color: 'var(--text-main)' }}>Notifications</h6>
            <div className="d-flex gap-2">
              <button onClick={markAllAsRead} className="btn btn-sm btn-link text-muted text-decoration-none p-0 d-flex align-items-center gap-1" title="Mark all read">
                <Check size={14} /> Read All
              </button>
              <button onClick={clearAll} className="btn btn-sm btn-link text-danger text-decoration-none p-0 d-flex align-items-center gap-1 ms-2" title="Clear read">
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          <div className="overflow-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <Bell size={24} className="opacity-25 mb-2" />
                <p className="mb-0 fs-6">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`p-3 border-bottom d-flex align-items-start gap-3 position-relative ${notif.read ? 'opacity-75' : 'bg-primary bg-opacity-10'}`}
                  style={{ borderColor: 'var(--panel-border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => { if (!notif.read) e.currentTarget.classList.add('bg-opacity-25'); }}
                  onMouseLeave={(e) => { if (!notif.read) e.currentTarget.classList.remove('bg-opacity-25'); }}
                  onClick={() => { if (!notif.read) markAsRead(notif._id); }}
                >
                  {!notif.read && <div className="position-absolute bg-primary rounded-circle" style={{ width: '6px', height: '6px', left: '8px', top: '24px' }}></div>}
                  <div className="mt-1">{getIcon(notif.type)}</div>
                  <div className="flex-grow-1">
                    <p className={`mb-1 fs-6 lh-sm fw-medium ${notif.read ? 'text-muted' : ''}`} style={notif.read ? {} : { color: 'var(--text-main)' }}>{notif.message}</p>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{formatTime(notif.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 text-center border-top" style={{ borderColor: 'var(--panel-border)' }}>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Real-time sync active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
