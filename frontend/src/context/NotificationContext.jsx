import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';

const API_URL = import.meta.env.VITE_API_URL;
const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  
  const { token } = useAuth();
  const { socket } = useInventory(); // Reuse the socket connection from InventoryContext

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setToast(notification);
        
        // Hide toast after 4 seconds
        setTimeout(() => {
          setToast(null);
        }, 4000);
      };

      socket.on('notification', handleNewNotification);
      
      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}>
      {children}
      
      {/* Toast Popup Notification */}
      {toast && (
        <div 
          className="position-fixed animate-fade-up shadow-lg glass-panel d-flex align-items-center gap-3 p-3"
          style={{ 
            top: '24px', 
            right: '24px', 
            zIndex: 9999,
            minWidth: '300px',
            borderLeft: `4px solid ${toast.type === 'error' ? '#EF4444' : toast.type === 'warning' ? '#FBBF24' : toast.type === 'success' ? '#10B981' : '#0066FF'}` 
          }}
        >
          <div>
             <h6 className="fw-bold mb-1 text-white">{toast.type === 'error' ? 'Alert' : toast.type === 'warning' ? 'Warning' : 'Notification'}</h6>
             <p className="mb-0 fs-6 text-muted">{toast.message}</p>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
