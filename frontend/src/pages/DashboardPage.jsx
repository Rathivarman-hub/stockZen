import React, { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import InventoryChart from '../components/InventoryChart';
import CountUp from '../components/Common/CountUp';
import { Plus, Minus, Trash2, AlertCircle, Activity, Clock, Search, Filter, Download, Edit3, DollarSign, Tag, Box, User } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { inventory, liveEvents, loading, addProduct, updateStock, deleteProduct, updateProduct } = useInventory();

  // State for adding/editing product
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    price: 0,
    category: 'General',
    description: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Categories list for filter and dropdown
  const categories = useMemo(() => {
    const cats = ['General', ...new Set(inventory.map(item => item.category))];
    return Array.from(new Set(cats));
  }, [inventory]);

  // Computed analytics
  const totalProducts = inventory.length;
  const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;
  const criticalStockItems = inventory.filter((item) => item.quantity > 0 && item.quantity < 5);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, filterCategory, filterStatus]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setIsEditing(true);
      setCurrentId(product._id);
      setFormData({
        name: product.name,
        quantity: product.quantity,
        price: product.price || 0,
        category: product.category || 'General',
        description: product.description || ''
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData({
        name: '',
        quantity: '',
        price: '',
        category: 'General',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);
    try {
      if (isEditing) {
        await updateProduct(currentId, formData);
      } else {
        await addProduct(formData);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockUpdate = async (id, changeAmount, currentQty) => {
    if (currentQty + changeAmount < 0) return;
    try {
      await updateStock(id, changeAmount);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Quantity', 'Price', 'Status', 'Total Value'];
    const rows = inventory.map(item => [
      item.name,
      item.category,
      item.quantity,
      item.price,
      item.status,
      (item.quantity * item.price).toFixed(2)
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock': return <span className="status-badge badge-instock">In Stock</span>;
      case 'Low Stock': return <span className="status-badge badge-low">Low Stock</span>;
      case 'Out of Stock': return <span className="status-badge badge-out">Out of Stock</span>;
      default: return null;
    }
  };

  return (
    <>
      <Navbar />
      <main className="container py-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 animate-fade-up gap-3">
          <div>
            <h1 className="fw-bold mb-1">Stock Intelligence</h1>
            <p className="text-muted mb-0">Real-time inventory optimization system</p>
          </div>
          <div className="d-flex flex-column flex-sm-row align-items-center gap-3 w-100 w-md-auto">
            {/* Status Badge - Centered on Mobile */}
            <div className="d-flex justify-content-center w-100 w-sm-auto">
              {user?.role === 'admin' ? (
                <span className="badge bg-primary bg-opacity-10 border border-primary text-primary px-3 py-2 rounded-pill d-inline-flex align-items-center">
                  <Activity size={14} className="me-1" /> Admin Access
                </span>
              ) : (
                <span className="badge bg-secondary bg-opacity-10 border border-secondary text-muted px-3 py-2 rounded-pill d-inline-flex align-items-center">
                  <AlertCircle size={14} className="me-1" /> View Only Mode
                </span>
              )}
            </div>
            
            {/* Buttons - Same Line on Mobile */}
            <div className="d-flex align-items-center gap-2 w-100 w-sm-auto">
              <button onClick={exportToCSV} className="btn btn-outline-glass d-flex align-items-center justify-content-center gap-2 px-3 py-2 flex-grow-1 flex-sm-grow-0">
                <Download size={18} /> Export CSV
              </button>
              {user?.role === 'admin' && (
                <button onClick={() => handleOpenModal()} className="btn btn-primary-glow d-flex align-items-center justify-content-center gap-2 px-3 py-2 flex-grow-1 flex-sm-grow-0">
                  <Plus size={18} /> Add Product
                </button>
              )}
            </div>
          </div>
        </div>

        {criticalStockItems.length > 0 && (
          <div className="alert bg-danger bg-opacity-10 border border-danger text-danger d-flex align-items-start gap-3 mb-5 animate-fade-up shadow-sm">
            <div className="mt-1"><AlertCircle size={24} /></div>
            <div>
              <h5 className="fw-bold mb-1">Critical Stock Alert</h5>
              <p className="mb-0 fs-6">The following items are running out (less than 5 units remaining):</p>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {criticalStockItems.map(item => (
                  <span key={item._id} className="badge bg-danger rounded-pill px-3 py-2">{item.name}: {item.quantity} units</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Summary */}
        <div className="row g-3 g-md-4 mb-5 animate-fade-up delay-100">
          <div className="col-6 col-lg-3 animate-fade-up delay-100">
            <div className="glass-panel p-3 p-md-4 h-100 bento-card d-flex flex-column justify-content-center align-items-center text-center">
              <div className="bento-icon mb-2 mb-md-3"><Box size={24} /></div>
              <h5 className="text-muted mb-1 fs-6 small text-uppercase fw-bold tracking-wider">Products</h5>
              <p className="fs-2 fw-bold mb-0 text-main tracking-tight">
                <CountUp end={totalProducts} />
              </p>
            </div>
          </div>
          <div className="col-6 col-lg-3 animate-fade-up delay-200">
            <div className="glass-panel p-3 p-md-4 h-100 bento-card d-flex flex-column justify-content-center align-items-center text-center">
              <div className="bento-icon mb-2 mb-md-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><DollarSign size={24} /></div>
              <h5 className="text-muted mb-1 fs-6 small text-uppercase fw-bold tracking-wider">Value</h5>
              <p className="fs-2 fw-bold mb-0 text-main tracking-tight">
                <CountUp end={totalValue} prefix="₹" />
              </p>
            </div>
          </div>
          <div className="col-6 col-lg-3 animate-fade-up delay-300">
            <div className="glass-panel p-3 p-md-4 h-100 bento-card d-flex flex-column justify-content-center align-items-center text-center">
              <div className="bento-icon mb-2 mb-md-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><AlertCircle size={24} /></div>
              <h5 className="text-muted mb-1 fs-6 small text-uppercase fw-bold tracking-wider">Alerts</h5>
              <p className="fs-2 fw-bold mb-0 text-main tracking-tight">
                <CountUp end={outOfStockCount} />
              </p>
            </div>
          </div>
          <div className="col-6 col-lg-3 animate-fade-up delay-400">
            <div className="glass-panel p-3 p-md-4 h-100 bento-card d-flex flex-column justify-content-center align-items-center text-center">
              <div className="bento-icon mb-2 mb-md-3" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}><Activity size={24} /></div>
              <h5 className="text-muted mb-1 fs-6 small text-uppercase fw-bold tracking-wider">Units</h5>
              <p className="fs-2 fw-bold mb-0 text-main tracking-tight">
                <CountUp end={totalItems} />
              </p>
            </div>
          </div>
        </div>

        <InventoryChart />

        {/* Search & Filters */}
        <div className="glass-panel p-3 p-md-4 mb-4 animate-fade-up">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="position-relative">
                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                <input
                  type="text"
                  className="form-control form-control-glass ps-5"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-2">
                <Filter size={18} className="text-muted d-none d-sm-inline" />
                <select
                  className="form-select form-control-glass py-2"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All">Categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-2">
                <Tag size={18} className="text-muted d-none d-sm-inline" />
                <select
                  className="form-select form-control-glass py-2"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
            <div className="col-12 col-md-2">
              <button
                className="btn btn-outline-glass w-100 py-2"
                onClick={() => { setSearchTerm(''); setFilterCategory('All'); setFilterStatus('All'); }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-9 animate-fade-up delay-300">
            <div className="glass-panel overflow-hidden">
              <div className="table-responsive">
                <table className="table table-glass w-100 align-middle">
                  <thead>
                    <tr>
                      <th>Product Info</th>
                      <th className="d-none d-md-table-cell">Category</th>
                      <th className="d-none d-sm-table-cell">Price</th>
                      <th>Stock Status</th>
                      <th>Quantity</th>
                      <th className="d-none d-lg-table-cell">Added By</th>
                      <th className="text-muted small fw-normal d-none d-xl-table-cell">Date & Time</th>
                      {user?.role === 'admin' && <th className="text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={user?.role === 'admin' ? 8 : 7} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
                    ) : filteredInventory.length === 0 ? (
                      <tr><td colSpan={user?.role === 'admin' ? 8 : 7} className="text-center py-5 text-muted">No products matching your criteria.</td></tr>
                    ) : (
                      filteredInventory.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="fw-bold" style={{ color: 'var(--text-main)' }}>{item.name}</div>
                            <div className="text-muted small">ID: {item._id.substring(item._id.length - 6)}</div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <span className="badge bg-secondary bg-opacity-10 text-muted border-0 fw-medium px-3 py-2 rounded-2">{item.category || 'General'}</span>
                          </td>
                          <td className="fw-semibold text-primary d-none d-sm-table-cell">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price || 0)}
                          </td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td>
                            <span className="fs-5 fw-bold">{item.quantity}</span>
                          </td>
                          <td className="d-none d-lg-table-cell">
                            <div className="d-flex align-items-center gap-2 small">
                              <User size={14} className="text-muted" />
                              <span>{item.createdBy || 'System'}</span>
                            </div>
                          </td>
                          <td className="small text-muted d-none d-xl-table-cell">
                            <div className="d-flex align-items-center gap-2">
                              <Clock size={14} />
                              <span>{new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          {user?.role === 'admin' && (
                            <td className="text-end">
                              <div className="d-flex align-items-center justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-outline-glass p-2"
                                  onClick={() => handleStockUpdate(item._id, -1, item.quantity)}
                                  disabled={item.quantity === 0}
                                  title="Decrease stock"
                                >
                                  <Minus size={16} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-glass p-2"
                                  onClick={() => handleStockUpdate(item._id, 1, item.quantity)}
                                  title="Increase stock"
                                >
                                  <Plus size={16} />
                                </button>
                                <div className="vr mx-1" style={{ height: '20px', opacity: 0.1 }}></div>
                                <button
                                  className="btn btn-sm btn-outline-glass p-2 text-primary"
                                  onClick={() => handleOpenModal(item)}
                                  title="Edit product"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-glass p-2 text-danger border-0"
                                  onClick={() => handleDelete(item._id)}
                                  title="Delete product"
                                  style={{ background: 'rgba(239, 68, 68, 0.05)' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="col-lg-3 animate-fade-up delay-400">
            <div className="glass-panel p-4 h-100 sticky-top" style={{ top: '100px', maxHeight: 'calc(100vh - 120px)' }}>
              <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--panel-border) !important' }}>
                <Activity size={20} className="text-primary" />
                <h5 className="fw-bold mb-0">System Activity</h5>
              </div>

              <div className="overflow-auto pe-2" style={{ maxHeight: 'calc(100% - 60px)' }}>
                {liveEvents && liveEvents.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {liveEvents.map((event) => (
                      <div key={event.id} className="d-flex align-items-start gap-3 p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                        <div className="mt-1">
                          {event.type === 'add' && <Plus size={16} className="text-success" />}
                          {event.type === 'update' && <Edit3 size={16} className="text-primary" />}
                          {event.type === 'delete' && <Trash2 size={16} className="text-danger" />}
                        </div>
                        <div>
                          <p className="mb-1 lh-sm" style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{event.message}</p>
                          <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
                            <Clock size={12} />
                            <span>{new Date(event.time).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <Activity size={32} className="opacity-25 mb-3 mx-auto" />
                    <p className="mb-0 fs-6">No recent activity.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div className="glass-panel p-4" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
            <h3 className="fw-bold mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small mb-1">Product Name</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label text-muted small mb-1">Quantity</label>
                  <input
                    type="number"
                    className="form-control form-control-glass"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    required min="0"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-muted small mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-glass"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    required min="0"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small mb-1">Category</label>
                <select
                  className="form-select form-control-glass"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="General">General</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Grocery">Grocery</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Beverage">Beverage</option>
                  {categories.filter(c => !['General', 'Electronic', 'Grocery', 'Furniture', 'Beverage'].includes(c)).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small mb-1">Barcode (Optional)</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-glass"
                    placeholder="Scan or enter barcode"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                  <button className="btn btn-outline-glass" type="button" title="Barcode scanner (Coming Soon)" disabled>
                    <Activity size={18} />
                  </button>
                </div>
                <div className="form-text small opacity-50">Experimental feature. High-speed scanning coming in v3.0.</div>
              </div>
              <div className="mb-4">
                <label className="form-label text-muted small mb-1">Description (Optional)</label>
                <textarea
                  className="form-control form-control-glass"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              {error && <div className="alert alert-danger py-2 mb-3 small bg-transparent text-danger border-danger">{error}</div>}
              <div className="d-flex gap-3">
                <button type="button" className="btn btn-outline-glass flex-grow-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary-glow flex-grow-1" disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : isEditing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
