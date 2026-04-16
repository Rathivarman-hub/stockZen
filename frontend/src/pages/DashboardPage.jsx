import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import InventoryChart from '../components/InventoryChart';
import CountUp from '../components/Common/CountUp';
import BarcodeScanner from '../components/BarcodeScanner';
import JsBarcode from 'jsbarcode';
import { Plus, Minus, Trash2, AlertCircle, Activity, Clock, Search, Filter, Download, Upload, Edit3, Tag, Box, User, X, Scan, Check, History } from 'lucide-react';
import { Link } from 'react-router-dom';

const VisualBarcode = ({ code }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && code) {
      try {
        JsBarcode(barcodeRef.current, code, {
          format: "CODE128",
          width: 1.2,
          height: 35,
          displayValue: false,
          background: "transparent"
        });
      } catch (e) {
        console.warn("Barcode render failed for:", code);
      }
    }
  }, [code]);

  if (!code) return <span className="text-muted small">—</span>;

  return (
    <div className="barcode-container p-1 rounded d-flex flex-column align-items-center mx-auto" style={{ 
      background: 'rgba(120,120,128,0.05)', 
      width: 'fit-content', 
      minWidth: '130px',
      border: '1px solid rgba(120,120,128,0.1)' 
    }}>
      <svg ref={barcodeRef} className="barcode-svg" style={{ maxWidth: '100%', height: 'auto' }}></svg>
      <div className="text-center mt-1" style={{ fontSize: '0.6rem', opacity: 0.7, letterSpacing: '1px', fontWeight: '600' }}>{code}</div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { inventory, liveEvents, outgoingEvents, loading, addProduct, updateStock, deleteProduct, updateProduct, bulkImport } = useInventory();
  
  const [scanMode, setScanMode] = useState('IN'); // 'IN' or 'OUT' mode for scanning

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
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showGlobalScanner, setShowGlobalScanner] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [lastScanned, setLastScanned] = useState(null);
  const [isBarcodeLocked, setIsBarcodeLocked] = useState(false);
  const [baseQuantity, setBaseQuantity] = useState(0);
  const csvInputRef = useRef(null);

  // Computed analytics
  const criticalStockItems = inventory.filter((item) => item.quantity > 0 && item.quantity < 5);
  const totalProducts = inventory.length;
  const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;

  // Categories list for filter and dropdown
  const categories = useMemo(() => {
    const cats = ['General', ...new Set(inventory.map(item => item.category))];
    return Array.from(new Set(cats));
  }, [inventory]);

  // Reset dismissed alert when inventory changes significantly (optional)
  useEffect(() => {
    if (criticalStockItems.length === 0) {
      setDismissedAlert(false);
    }
  }, [criticalStockItems.length]);

  const getStockColor = (qty) => {
    if (qty === 0 || qty < 5) return '#EF4444'; // Red (Requirement #4)
    if (qty < 20) return '#F59E0B';             // Yellow (Requirement #4)
    return '#10B981';                           // Green (Requirement #4)
  };

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchStr) || 
                            (item.barcode && item.barcode.toLowerCase().includes(searchStr));
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
      setIsBarcodeLocked(false);
      setCurrentId(null);
      setFormData({
        name: '',
        quantity: '',
        price: '',
        category: 'General',
        description: '',
        barcode: ''
      });
    }
    setShowModal(true);
  };

  const checkBarcodeDuplicate = (code) => {
    if (!code) return;
    const existing = inventory.find(item => item.barcode === code);
    if (existing && !isEditing) {
      setIsEditing(true);
      setIsBarcodeLocked(true);
      setBaseQuantity(existing.quantity); // Store original count
      setCurrentId(existing._id);
      setFormData({
        name: existing.name,
        quantity: 0, // Reset to 0 for incremental add
        price: existing.price,
        category: existing.category,
        description: existing.description || '',
        barcode: existing.barcode
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);
    try {
      if (isEditing) {
        let finalData = { ...formData };
        if (isBarcodeLocked) {
          const delta = parseInt(formData.quantity) || 0;
          // IMPORTANT: Addition if IN mode, Subtraction if OUT mode
          if (scanMode === 'OUT') {
            finalData.quantity = Math.max(0, baseQuantity - delta);
          } else {
            finalData.quantity = baseQuantity + delta;
          }
        }
        await updateProduct(currentId, finalData);
      } else {
        await addProduct(formData);
      }
      setShowModal(false);
      setIsBarcodeLocked(false);
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

  const handleGlobalScan = async (code) => {
    setShowGlobalScanner(false);
    setScanHistory(prev => [{ code, time: new Date() }, ...prev.slice(0, 4)]);

    const existingProduct = inventory.find(item => item.barcode === code);
    
    if (existingProduct) {
      // Open modal for both IN and OUT mode for custom quantity entry
      setIsEditing(true);
      setIsBarcodeLocked(true);
      setBaseQuantity(existingProduct.quantity);
      setCurrentId(existingProduct._id);
      setFormData({
        name: existingProduct.name,
        quantity: 0, 
        price: existingProduct.price,
        category: existingProduct.category,
        description: existingProduct.description || '',
        barcode: existingProduct.barcode
      });
      setShowModal(true);
    } else {
      if (scanMode === 'OUT') {
        setError(`Product with barcode ${code} not found in system`);
      } else {
        handleOpenModal();
        setIsBarcodeLocked(false);
        setFormData(prev => ({ ...prev, barcode: code, quantity: 1 }));
      }
    }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setBulkLoading(true);
    setBulkResult(null);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV file is empty or has no data rows.');
        setBulkLoading(false);
        return;
      }

      // Parse header row (case-insensitive)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
      const nameIdx  = headers.findIndex(h => h === 'name');
      const qtyIdx   = headers.findIndex(h => h === 'quantity' || h === 'qty');
      const priceIdx = headers.findIndex(h => h === 'price');
      const catIdx   = headers.findIndex(h => h === 'category');
      const descIdx  = headers.findIndex(h => h === 'description' || h === 'desc');
      const bcIdx    = headers.findIndex(h => h === 'barcode');

      if (nameIdx === -1) {
        setError('CSV must have a "Name" column.');
        setBulkLoading(false);
        return;
      }

      const products = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return {
          name:        nameIdx  !== -1 ? cols[nameIdx]  : '',
          quantity:    qtyIdx   !== -1 ? cols[qtyIdx]   : '0',
          price:       priceIdx !== -1 ? cols[priceIdx] : '0',
          category:    catIdx   !== -1 ? cols[catIdx]   : 'General',
          description: descIdx  !== -1 ? cols[descIdx]  : '',
          barcode:     bcIdx    !== -1 ? cols[bcIdx]    : '',
        };
      }).filter(p => p.name);

      const result = await bulkImport(products);
      setBulkResult(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setBulkLoading(false);
    }
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center align-items-md-center mb-5 animate-fade-up gap-4 text-center text-md-start">
          <div className="d-flex flex-column flex-md-row align-items-center gap-3">
            <div>
              <h1 className="fw-bold mb-1 fs-2">Live Warehouse Volume</h1>
              <p className="text-muted mb-0">Real-time inventory optimization system</p>
            </div>
            <div className="mt-2 mt-md-0">
              {user?.role === 'admin' ? (
                <span className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center" style={{ 
                  background: 'rgba(var(--accent-color-rgb), 0.15)', 
                  color: 'var(--accent-color)',
                  border: '1px solid var(--accent-color)',
                  fontWeight: '600',
                  fontSize: '0.75rem'
                }}>
                  <Check size={14} className="me-2" /> Admin Access
                </span>
              ) : (
                <span className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center" style={{ 
                  background: 'rgba(120, 120, 128, 0.1)', 
                  color: 'var(--text-muted)',
                  border: '1px solid var(--panel-border)',
                  fontWeight: '600',
                  fontSize: '0.75rem'
                }}>
                  <AlertCircle size={14} className="me-2" /> View User Mode
                </span>
              )}
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
             {/* Header actions moved below to search area */}
          </div>
        </div>

        {bulkResult && (
          <div className="alert d-flex align-items-start gap-3 mb-4 animate-fade-up" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', color: '#10B981' }}>
            <div className="flex-grow-1">
              <h6 className="fw-bold mb-1">✅ Bulk Import Complete</h6>
              <p className="mb-0 small">
                <strong>{bulkResult.created}</strong> product(s) created&nbsp;&nbsp;•&nbsp;&nbsp;
                <strong>{bulkResult.skipped}</strong> skipped (already exist)
                {bulkResult.errors?.length > 0 && <>&nbsp;&nbsp;•&nbsp;&nbsp;<strong>{bulkResult.errors.length}</strong> error(s)</>}
              </p>
            </div>
            <button className="btn btn-link p-0 border-0" style={{ color: '#10B981' }} onClick={() => setBulkResult(null)}><X size={18} /></button>
          </div>
        )}

        {/* Supermarket Success Notification */}
        {lastScanned && (
          <div className="alert bg-success bg-opacity-10 border-success text-success d-flex align-items-center gap-3 mb-4 animate-fade-up shadow-sm">
            <div className="bg-success rounded-circle p-1"><Check size={14} className="text-white" /></div>
            <div className="flex-grow-1 fw-medium">
              Supermarket Scan: <span className="fw-bold">{lastScanned}</span> stock updated <span className="badge bg-success">+1</span>
            </div>
            <button className="btn btn-link p-0 text-success opacity-50" onClick={() => setLastScanned(null)}><X size={18} /></button>
          </div>
        )}

        {user?.role === 'admin' && criticalStockItems.length > 0 && !dismissedAlert && (
          <div className="alert bg-danger bg-opacity-10 border border-danger text-danger d-flex align-items-start gap-3 mb-5 animate-fade-up shadow-sm position-relative">
            <div className="mt-1"><AlertCircle size={24} /></div>
            <div className="flex-grow-1">
              <h5 className="fw-bold mb-1">Critical Stock Alert</h5>
              <p className="mb-0 fs-6">The following items are running out (less than 5 units remaining):</p>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {criticalStockItems.map(item => (
                  <span key={item._id} className="badge bg-danger rounded-pill px-3 py-2">{item.name}: {item.quantity} units</span>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setDismissedAlert(true)}
              className="btn btn-link text-danger p-0 border-0 opacity-50 hover-opacity-100 transition-all"
              style={{ position: 'absolute', top: '15px', right: '15px' }}
              title="Dismiss alert"
            >
              <X size={20} />
            </button>
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
              <div className="bento-icon mb-2 mb-md-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><span style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>₹</span></div>
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
              <h5 className="text-muted mb-1 fs-6 small text-uppercase fw-bold tracking-wider">Stock Remaining</h5>
              <p className="fs-2 fw-bold mb-0 text-main tracking-tight">
                <CountUp end={totalItems} />
              </p>
            </div>
          </div>
        </div>

        {/* Live Outgoing Activity - Real Time (Requirement) */}
        {outgoingEvents.length > 0 && (
          <div className="glass-panel p-3 mb-4 animate-fade-up border-danger border-opacity-25" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Activity size={18} className="text-danger" />
                <h6 className="fw-bold mb-0 text-uppercase small tracking-wider">Live Outgoing Feed</h6>
              </div>
              <span className="badge bg-danger rounded-pill px-2" style={{ fontSize: '0.6rem' }}>Live Updates</span>
            </div>
            <div className="d-flex flex-wrap gap-3">
               {outgoingEvents.map((event, idx) => (
                 <div key={event.id || idx} className="d-flex align-items-center gap-3 animate-fade-right" style={{ borderLeft: '2px solid #EF4444', paddingLeft: '12px' }}>
                    <div>
                       <div className="fw-bold fs-6 text-main lh-1 mb-1">{event.name}</div>
                       <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          <Minus size={10} className="text-danger" /> {event.qty} unit • {new Date(event.time).toLocaleTimeString()}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Scan History - Requirement #6 */}
        {scanHistory.length > 0 && (
          <div className="glass-panel p-3 mb-5 animate-fade-up">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Clock size={16} className="text-accent" />
              <h6 className="fw-bold mb-0 small text-uppercase">Recent Scans</h6>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {scanHistory.map((scan, i) => (
                <div key={i} className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)' }}>
                  <code className="small text-accent">{scan.code}</code>
                  <span className="text-muted" style={{ fontSize: '0.65rem' }}>{scan.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <InventoryChart />

        {/* Search & Filters */}
        <div className="glass-panel p-3 p-md-4 mb-4 animate-fade-up">
          <div className="row g-3">
            <div className={`col-12 ${user?.role === 'admin' ? 'col-md-5' : 'col-md-12'}`}>
              <div className="position-relative">
                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                <input
                  type="text"
                  className="form-control form-control-glass ps-5 py-2"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="col-12 col-md-7 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
                <div className="btn-group p-1 glass-panel" style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                  <button 
                    className={`btn btn-sm d-flex align-items-center gap-2 px-3 ${scanMode === 'IN' ? 'btn-primary-glow' : 'text-muted border-0'}`}
                    style={{ borderRadius: '10px' }}
                    onClick={() => setScanMode('IN')}
                  >
                    <Plus size={14} />
                  </button>
                  <button 
                    className={`btn btn-sm d-flex align-items-center gap-2 px-3 ${scanMode === 'OUT' ? 'bg-danger text-white' : 'text-muted border-0'}`}
                    style={{ borderRadius: '10px' }}
                    onClick={() => setScanMode('OUT')}
                  >
                    <Minus size={14} />
                  </button>
                </div>

                <button onClick={() => setShowGlobalScanner(true)} className={`btn btn-sm d-flex align-items-center justify-content-center gap-2 px-3 py-2 ${scanMode === 'OUT' ? 'btn-danger bg-danger border-danger text-white pulse-button' : 'btn-primary-glow'}`} style={{ borderRadius: '10px' }}>
                  <Scan size={16} /> <span>{scanMode === 'OUT' ? 'Deduct' : 'Scan'}</span>
                </button>

                <div className="vr d-none d-lg-block mx-1" style={{ height: '24px', opacity: 0.1 }}></div>

                <Link to="/audit-log" className="btn btn-sm btn-outline-glass d-flex align-items-center gap-2 px-3 py-2" style={{ borderRadius: '10px' }}>
                  <History size={16} /> Logs
                </Link>
                <button onClick={exportToCSV} className="btn btn-sm btn-outline-glass d-flex align-items-center gap-2 px-3 py-2" style={{ borderRadius: '10px' }}>
                  <Download size={16} />
                </button>
                <button onClick={() => handleOpenModal()} className="btn btn-sm btn-primary-glow d-flex align-items-center gap-2 px-3 py-2" style={{ borderRadius: '10px' }}>
                  <Plus size={16} />
                </button>
              </div>
            )}

            <div className="col-6 col-md-2 mt-2">
              <div className="d-flex align-items-center gap-2">
                <Filter size={14} className="text-muted" />
                <select
                  className="form-select border-0 bg-transparent text-muted small py-1"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <option value="All">All</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
          <div className="col-lg-12 animate-fade-up delay-300">
            {/* Desktop Table View */}
            <div className="glass-panel overflow-hidden border-0">
              <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="table table-glass w-100 align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="text-center">Product Info</th>
                      <th className="d-none d-md-table-cell text-center">Category</th>
                      <th className="d-none d-md-table-cell text-center">Price</th>
                      <th className="d-none d-lg-table-cell text-accent text-center">Total Worth</th>
                      <th className="text-center">
                        Stock Level
                        <div className="d-flex justify-content-center gap-2 mt-1" style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                          <span className="d-flex align-items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }}></span> Low</span>
                          <span className="d-flex align-items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }}></span> Med</span>
                          <span className="d-flex align-items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}></span> High</span>
                        </div>
                      </th>
                      <th className="text-muted small fw-normal d-none d-lg-table-cell text-center">Date & Time</th>
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
                          <td className="text-center">
                            <div className="fw-bold" style={{ color: 'var(--text-main)' }}>{item.name}</div>
                            <div className="text-muted small">ID: {item._id.substring(item._id.length - 6)}</div>
                          </td>
                          <td className="d-none d-md-table-cell text-center">
                            <span className="badge bg-secondary bg-opacity-10 text-muted border-0 fw-medium px-3 py-2 rounded-2">{item.category || 'General'}</span>
                          </td>
                          <td className="fw-semibold text-primary d-none d-md-table-cell text-center">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price || 0)}
                          </td>
                          <td className="d-none d-lg-table-cell text-center">
                            <div className="fw-bold text-accent" style={{ fontSize: '0.9rem' }}>
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((item.price || 0) * (item.quantity || 0))}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{item.quantity} × ₹{item.price}</div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <span 
                                style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStockColor(item.quantity), display: 'inline-block' }} 
                                title={item.quantity < 5 ? 'Low Stock' : item.quantity < 20 ? 'Medium' : 'High'}
                              />
                              <span className="fs-5 fw-bold">{item.quantity}</span>
                            </div>
                          </td>
                          <td className="small text-muted d-none d-lg-table-cell text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
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

            {/* Mobile Card View */}
            <div className="d-md-none d-flex flex-column gap-3 animate-fade-up">
              {loading ? (
                <div className="glass-panel p-5 text-center"><div className="spinner-border text-primary" /></div>
              ) : filteredInventory.length === 0 ? (
                <div className="glass-panel p-5 text-center text-muted">No products matching criteria.</div>
              ) : (
                filteredInventory.map((item) => (
                  <div key={item._id} className="glass-panel p-3 text-center animate-fade-up">
                    <div className="mb-3">
                       <div className="d-flex justify-content-center mb-2">{getStatusBadge(item.status)}</div>
                       <div className="fw-bold fs-5 mb-0 mx-auto" style={{ color: 'var(--text-main)' }}>{item.name}</div>
                       <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {item._id.substring(item._id.length - 6)}</div>
                       <span className="badge bg-secondary bg-opacity-10 text-muted border-0 fw-medium px-2 py-1 rounded-pill mt-1" style={{ fontSize: '0.65rem' }}>
                         {item.category || 'General'}
                       </span>
                    </div>
                    
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <div className="p-2 info-box-glass">
                          <label className="text-muted d-block mb-0" style={{ fontSize: '0.6rem' }}>PRICE</label>
                          <span className="fw-bold text-primary small">₹{item.price}</span>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 info-box-glass border-accent border-opacity-25" style={{ background: 'rgba(var(--accent-color-rgb), 0.05)' }}>
                          <label className="text-muted d-block mb-0" style={{ fontSize: '0.6rem' }}>STOCK</label>
                          <span className="fw-bold fs-6 text-main">{item.quantity}</span>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 info-box-glass">
                          <label className="text-muted d-block mb-0" style={{ fontSize: '0.6rem' }}>WORTH</label>
                          <span className="fw-bold text-accent small">₹{(item.price || 0) * (item.quantity || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-top" style={{ borderColor: 'var(--panel-border)' }}>
                       <div className="d-flex justify-content-center align-items-center gap-2 small text-muted" style={{ fontSize: '0.7rem' }}>
                          <Clock size={12} /> 
                          <span>{new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>

                    <div className="d-flex flex-column gap-2 pt-2 border-top" style={{ borderColor: 'var(--panel-border)' }}>
                       <div className="d-flex justify-content-end align-items-center small text-muted">
                         <div className="d-flex align-items-center gap-1">
                            <Clock size={14} /> 
                            <span>{new Date(item.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                       </div>
                       
                       {user?.role === 'admin' && (
                         <div className="d-flex gap-2 w-100 mt-1">
                           <button className="btn btn-sm btn-outline-glass py-2 flex-grow-1" onClick={() => handleStockUpdate(item._id, -1, item.quantity)} disabled={item.quantity === 0} title="Decrease"><Minus size={16} /></button>
                           <button className="btn btn-sm btn-outline-glass py-2 flex-grow-1" onClick={() => handleStockUpdate(item._id, 1, item.quantity)} title="Increase"><Plus size={16} /></button>
                           <button className="btn btn-sm btn-outline-glass py-2 flex-grow-1 text-primary" onClick={() => handleOpenModal(item)} title="Edit"><Edit3 size={16} /></button>
                           <button className="btn btn-sm btn-outline-glass py-2 flex-grow-1 text-danger border-0" onClick={() => handleDelete(item._id)} title="Delete" style={{ background: 'rgba(239, 68, 68, 0.05)' }}><Trash2 size={16} /></button>
                         </div>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Global Barcode Scanner Modal */}
      {showGlobalScanner && (
        <BarcodeScanner
          onScan={handleGlobalScan}
          onClose={() => setShowGlobalScanner(false)}
        />
      )}

      {/* Barcode Scanner Modal Inside Form */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setFormData(prev => ({ ...prev, barcode: code }));
            checkBarcodeDuplicate(code);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div className="glass-panel p-4" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
            <h3 className="fw-bold mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label text-muted small fw-bold mb-1">Product Name</label>
                  <input
                    type="text"
                    className={`form-control form-control-glass ${isBarcodeLocked ? 'bg-secondary bg-opacity-10 opacity-75' : ''}`}
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isBarcodeLocked}
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold mb-1">Category</label>
                  <select
                    className={`form-select form-control-glass ${isBarcodeLocked ? 'bg-secondary bg-opacity-10 opacity-75' : ''}`}
                    value={formData.category || 'General'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={isBarcodeLocked}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    className={`form-control form-control-glass ${isBarcodeLocked ? 'bg-secondary bg-opacity-10 opacity-75' : ''}`}
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    disabled={isBarcodeLocked}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold mb-1">Barcode</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control form-control-glass"
                      placeholder="Scan or type barcode"
                      value={formData.barcode || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, barcode: e.target.value });
                        checkBarcodeDuplicate(e.target.value);
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline-glass d-flex align-items-center" 
                      onClick={() => setShowScanner(true)}
                      title="Re-scan Barcode"
                    >
                      <Scan size={18} />
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className={`form-label small fw-bold mb-1 ${scanMode === 'OUT' ? 'text-danger' : 'text-accent'}`}>
                    {isBarcodeLocked 
                      ? (scanMode === 'OUT' ? `Deduct Units (Current: ${baseQuantity})` : `Add Units (Current: ${baseQuantity})`)
                      : 'Initial Quantity'
                    }
                  </label>
                  <input
                    type="number"
                    className={`form-control form-control-glass shadow-sm ${scanMode === 'OUT' ? 'border-danger' : 'border-accent'}`}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    required
                    autoFocus={isBarcodeLocked}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label text-muted small fw-bold mb-1">Description (Optional)</label>
                  <textarea
                    className="form-control form-control-glass"
                    rows="2"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="d-flex gap-3">
                <button 
                  type="button" 
                  className="btn btn-outline-glass flex-grow-1 py-2" 
                  onClick={() => { setShowModal(false); setIsBarcodeLocked(false); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-glow flex-grow-1 py-2" disabled={actionLoading}>
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
