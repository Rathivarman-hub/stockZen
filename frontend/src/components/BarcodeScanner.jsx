import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, ImageIcon, AlertCircle, Volume2 } from 'lucide-react';

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1046, ctx.currentTime); // C6 — retail scanner tone
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (_) {}
};

const BarcodeScanner = ({ onScan, onClose }) => {
  const [mode, setMode]           = useState('camera'); // 'camera' | 'file'
  const [status, setStatus]       = useState('starting'); // 'starting' | 'ready' | 'error'
  const [errorMsg, setErrorMsg]   = useState('');
  const scannerRef                = useRef(null);
  const fileInputRef              = useRef(null);

  /* ── Camera mode ─────────────────────────────────────────── */
  useEffect(() => {
    if (mode !== 'camera') return;

    const html5 = new Html5Qrcode('barcode-view');
    scannerRef.current = html5;
    setStatus('starting');

    html5
      .start(
        { facingMode: 'environment' },
        {
          fps: 20,
          qrbox: { width: 280, height: 140 }, // wide for 1-D barcodes
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        (decoded) => {
          playBeep();
          html5.stop().catch(() => {});
          onScan(decoded);
          onClose();
        }
      )
      .then(() => setStatus('ready'))
      .catch(() => {
        setStatus('error');
        setErrorMsg('Camera not available. Try uploading an image instead.');
      });

    return () => {
      if (html5.isScanning) html5.stop().catch(() => {});
    };
  }, [mode, onScan, onClose]);

  /* ── File / image mode ───────────────────────────────────── */
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setErrorMsg('');

    // Need a running instance to call scanFile
    let scanner = scannerRef.current;
    if (!scanner) {
      scanner = new Html5Qrcode('barcode-view');
      scannerRef.current = scanner;
    }

    // Stop camera stream if switching from camera mode
    if (scanner.isScanning) await scanner.stop().catch(() => {});

    try {
      const result = await scanner.scanFile(file, /* showImage= */ false);
      playBeep();
      onScan(result);
      onClose();
    } catch {
      setErrorMsg('Could not read barcode. Please try a clearer image or use the camera.');
      // Auto-close after 3 s so user is never stuck
      setTimeout(() => onClose(), 3000);
    }
  };

  const switchToFile = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    setMode('file');
    setErrorMsg('');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.90)',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        className="glass-panel p-4"
        style={{ width: '100%', maxWidth: '440px', margin: '16px', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {/* ── Header ── */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <div style={{ background: 'rgba(var(--accent-color-rgb),0.15)', borderRadius: '8px', padding: '8px', color: 'var(--accent-color)' }}>
              {mode === 'camera' ? <Camera size={20} /> : <ImageIcon size={20} />}
            </div>
            <div>
              <h6 className="fw-bold mb-0">{mode === 'camera' ? 'Camera Scanner' : 'Image Upload'}</h6>
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <Volume2 size={10} /> Audio feedback active
              </div>
            </div>
          </div>
          <button className="btn btn-outline-glass p-2 rounded-circle" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── Scan viewport ── */}
        <div
          style={{
            width: '100%', height: '250px', position: 'relative',
            borderRadius: '16px', overflow: 'hidden',
            background: '#000', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* html5-qrcode mounts video/canvas here */}
          <div id="barcode-view" style={{ width: '100%', height: '100%' }} />

          {/* Scanning laser overlay */}
          {mode === 'camera' && status === 'ready' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '3px',
              background: 'var(--accent-color)',
              boxShadow: '0 0 16px var(--accent-color)',
              animation: 'laserMove 2.2s ease-in-out infinite',
              zIndex: 10,
            }} />
          )}

          {/* Initializing overlay */}
          {mode === 'camera' && status === 'starting' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
              <div className="spinner-border text-primary mb-2" style={{ width: '28px', height: '28px' }} />
              <span className="text-muted small">Starting camera…</span>
            </div>
          )}

          {/* File upload dropzone */}
          {mode === 'file' && (
            <div
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
              <p className="text-muted small mb-3">Tap to select a barcode image</p>
              <button className="btn btn-primary-glow px-4">Choose Image</button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
            </div>
          )}
        </div>

        {/* ── Error message ── */}
        {(errorMsg || (mode === 'camera' && status === 'error')) && (
          <div
            className="d-flex align-items-start gap-2 mt-3 p-3 rounded-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.82rem' }}>{errorMsg || 'Camera not available. Try uploading an image instead.'}</span>
          </div>
        )}

        {/* ── Mode toggle ── */}
        <div className="mt-3">
          {mode === 'camera' ? (
            <button
              className="btn btn-outline-glass w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={switchToFile}
            >
              <ImageIcon size={16} /> Upload Barcode Image Instead
            </button>
          ) : (
            <button
              className="btn btn-outline-glass w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={() => { setMode('camera'); setErrorMsg(''); }}
            >
              <Camera size={16} /> Use Camera Instead
            </button>
          )}
        </div>

        <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.7rem' }}>
          Supports EAN-13, EAN-8, Code 128, UPC-A, QR Code
        </p>
      </div>

      <style>{`
        #barcode-view video { object-fit: cover; width: 100% !important; height: 100% !important; display: block; }
        #barcode-view canvas { display: none; }
        #barcode-view > div { border: none !important; padding: 0 !important; }
        @keyframes laserMove { 0%{top:8%} 50%{top:92%} 100%{top:8%} }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
