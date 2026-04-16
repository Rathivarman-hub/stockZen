import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  ClipboardList, PackagePlus, PackageMinus, Pencil, Trash2,
  Upload, ChevronLeft, ChevronRight, RefreshCw, Filter, Clock, User
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const ACTION_META = {
  PRODUCT_CREATED: { label: 'Created',     icon: PackagePlus,  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  PRODUCT_UPDATED: { label: 'Updated',     icon: Pencil,        color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  PRODUCT_DELETED: { label: 'Deleted',     icon: Trash2,        color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  STOCK_IN:        { label: 'Stock In',    icon: PackagePlus,  color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  STOCK_OUT:       { label: 'Stock Out',   icon: PackageMinus, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  BULK_IMPORT:     { label: 'Bulk Import', icon: Upload,       color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
};

const ACTIONS = ['All', ...Object.keys(ACTION_META)];

const ActionBadge = ({ action }) => {
  const meta = ACTION_META[action] || { label: action, color: 'var(--text-muted)', bg: 'rgba(120,120,128,0.1)' };
  const Icon = meta.icon || ClipboardList;
  return (
    <span
      className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2"
      style={{ background: meta.bg, color: meta.color, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
};

const AuditLogPage = () => {
  const { token } = useAuth();
  const [logs, setLogs]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('All');
  const LIMIT = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (actionFilter !== 'All') params.action = actionFilter;
      const { data } = await axios.get(`${API_URL}/api/audit`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (val) => {
    setActionFilter(val);
    setPage(1);
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <>
      <Navbar />
      <main className="container py-5">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 animate-fade-up gap-3">
          <div>
            <h1 className="fw-bold mb-1 d-flex align-items-center gap-3">
              <div style={{ background: 'rgba(var(--accent-color-rgb),0.15)', borderRadius: '12px', padding: '10px', color: 'var(--accent-color)' }}>
                <ClipboardList size={24} />
              </div>
              Audit Log
            </h1>
            <p className="text-muted mb-0">Complete history of every inventory action</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge px-3 py-2 rounded-pill" style={{ background: 'rgba(var(--accent-color-rgb),0.15)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', fontWeight: 600 }}>
              {total} total events
            </span>
            <button className="btn btn-outline-glass d-flex align-items-center gap-2 px-3 py-2" onClick={fetchLogs}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel p-3 mb-4 animate-fade-up">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 text-muted small">
              <Filter size={16} />
              <span>Filter by action:</span>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {ACTIONS.map(act => (
                <button
                  key={act}
                  onClick={() => handleFilterChange(act)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: '20px',
                    padding: '4px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: actionFilter === act
                      ? '1px solid var(--accent-color)'
                      : '1px solid var(--panel-border)',
                    background: actionFilter === act
                      ? 'rgba(var(--accent-color-rgb),0.15)'
                      : 'transparent',
                    color: actionFilter === act
                      ? 'var(--accent-color)'
                      : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  {act === 'All' ? 'All Events' : ACTION_META[act]?.label || act}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-panel overflow-hidden animate-fade-up delay-100">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <ClipboardList size={40} className="opacity-25 mb-3" />
              <p className="mb-0">No audit events found.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="d-none d-md-block table-responsive">
                <table className="table table-glass w-100 align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Product</th>
                      <th>Performed By</th>
                      <th>Details</th>
                      <th>Stock Change</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log._id}>
                        <td><ActionBadge action={log.action} /></td>
                        <td>
                          <span className="fw-semibold" style={{ color: 'var(--text-main)' }}>
                            {log.productName || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2 small">
                            <User size={13} className="text-muted" />
                            <span>{log.performedBy}</span>
                          </div>
                        </td>
                        <td className="text-muted small" style={{ maxWidth: '250px' }}>
                          {log.details || '—'}
                        </td>
                        <td>
                          {log.changeAmount != null ? (
                            <span
                              className="fw-bold"
                              style={{ color: log.changeAmount > 0 ? '#10B981' : '#EF4444' }}
                            >
                              {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                              {log.previousQty != null && log.newQty != null && (
                                <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.75rem' }}>
                                  ({log.previousQty} → {log.newQty})
                                </span>
                              )}
                            </span>
                          ) : log.previousQty != null && log.newQty != null ? (
                            <span className="text-muted small">{log.previousQty} → {log.newQty}</span>
                          ) : '—'}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1 small text-muted">
                            <Clock size={12} />
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="d-md-none d-flex flex-column">
                {logs.map((log, i) => (
                  <div
                    key={log._id}
                    className="p-3"
                    style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--panel-border)' : 'none' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <ActionBadge action={log.action} />
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="fw-semibold mb-1" style={{ color: 'var(--text-main)' }}>
                      {log.productName || 'N/A'}
                    </div>
                    <div className="text-muted small mb-1">{log.details || ''}</div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1 text-muted small">
                        <User size={12} /> <span>{log.performedBy}</span>
                      </div>
                      {log.changeAmount != null && (
                        <span className="fw-bold" style={{ color: log.changeAmount > 0 ? '#10B981' : '#EF4444', fontSize: '0.85rem' }}>
                          {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4 animate-fade-up">
            <span className="text-muted small">
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total} events
            </span>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-glass d-flex align-items-center gap-1 px-3 py-2"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="btn btn-outline-glass px-3 py-2" style={{ cursor: 'default' }}>
                {page} / {pages}
              </span>
              <button
                className="btn btn-outline-glass d-flex align-items-center gap-1 px-3 py-2"
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default AuditLogPage;
