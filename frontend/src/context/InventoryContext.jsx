import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL;
const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [outgoingEvents, setOutgoingEvents] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setInventory([]);
      setLiveEvents([]);
      return;
    }

    // Initial data fetch
    const fetchInventory = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInventory(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setLoading(false);
      }
    };

    fetchInventory();

    // Setup Socket.IO connection with transport priority
    const newSocket = io(API_URL, {
      withCredentials: true,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    // Socket Event Listeners
    newSocket.on('product_added', (product) => {
      setInventory((prev) => [product, ...prev]);
    });

    newSocket.on('stock_updated', (updatedProduct) => {
      setInventory((prev) =>
        prev.map((item) =>
          item._id === updatedProduct._id ? updatedProduct : item
        )
      );
    });

    newSocket.on('product_deleted', (productId) => {
      setInventory((prev) => prev.filter((item) => item._id !== productId));
    });

    newSocket.on('product_updated', (updatedProduct) => {
      setInventory((prev) =>
        prev.map((item) =>
          item._id === updatedProduct._id ? updatedProduct : item
        )
      );
    });

    newSocket.on('notification', (event) => {
      // Use the notification as a live event for the feed
      const feedItem = {
        id: event._id || Date.now(),
        message: event.message,
        type: event.type === 'success' ? 'add' : event.type === 'warning' ? 'delete' : 'update',
        time: event.createdAt || new Date()
      };
      setLiveEvents((prev) => [feedItem, ...prev].slice(0, 50)); 
    });

    newSocket.on('stock_out_event', (event) => {
      setOutgoingEvents((prev) => [event, ...prev].slice(0, 20));
    });

    return () => {
      if (newSocket) {
        newSocket.off();
        newSocket.disconnect();
      }
    };
  }, [token]);

  const addProduct = async (productData) => {
    const { data } = await axios.post(`${API_URL}/api/products`, productData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  };

  const updateProduct = async (id, productData) => {
    const { data } = await axios.put(`${API_URL}/api/products/${id}`, productData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  };

  const updateStock = async (id, changeAmount) => {
    const { data } = await axios.put(`${API_URL}/api/products/${id}/stock`, { changeAmount }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  };

  const deleteProduct = async (id) => {
    await axios.delete(`${API_URL}/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const bulkImport = async (products) => {
    const { data } = await axios.post(`${API_URL}/api/products/bulk`, { products }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        liveEvents,
        outgoingEvents,
        loading,
        addProduct,
        updateStock,
        updateProduct,
        deleteProduct,
        bulkImport,
        socket
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
