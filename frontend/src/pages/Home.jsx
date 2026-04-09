import React from 'react';
import Navbar from '../components/Navbar';
import BentoFeatures from '../components/BentoFeatures';
import LiveStats from '../components/LiveStats';
import { ArrowRight, Play, Database, Server, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="pt-5 pb-5 hero-section-gradient">
          <div className="container text-center animate-fade-up">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill glass-panel mb-4 text-primary" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
              <span className="position-relative d-flex h-3 w-3 align-items-center justify-content-center">
                <span className="spinner-grow spinner-grow-sm text-primary" role="status" style={{ width: '10px', height: '10px' }}></span>
              </span>
              v2.0 Live Sync Engine Now Active
            </div>
            
            <h1 className="hero-title mb-3">
              Smart Inventory <br />
              <span className="text-gradient">Management System</span>
            </h1>
            <p className="fs-5 mb-5 opacity-75">Precision tracking. Millisecond sync. Absolute control.</p>
            
            <p className="hero-subtitle mb-5">
              Instantly sync stock levels across all channels. Our atomic update engine ensures zero overselling, letting you scale with ultimate confidence.
            </p>
            
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 mb-5">
              <Link to="/dashboard" className="btn btn-primary-glow btn-lg d-flex align-items-center justify-content-center gap-2">
                Get Started <ArrowRight size={20} />
              </Link>
              <a href="#features" className="btn btn-outline-glass btn-lg d-flex align-items-center justify-content-center gap-2">
                <Play size={20} /> View Demo
              </a>
            </div>
          </div>
        </section>

        {/* Live Telemetry Data */}
        <LiveStats />

        {/* Features Bento Grid */}
        <BentoFeatures />

        {/* Split Section */}
        <section className="py-5 my-5 glass-panel border-start-0 border-end-0 rounded-0">
          <div className="container">
            <div className="row align-items-center gy-5">
              <div className="col-lg-6 pr-lg-5 animate-fade-up">
                <div className="mb-4 d-inline-flex p-3 rounded glass-panel text-primary">
                  <Database size={24} />
                </div>
                <h2 className="fw-bold mb-4 fs-1">Zero Race Conditions. Guaranteed.</h2>
                <p className="text-muted mb-4 fs-5">
                  When multiple users buy the same product simultaneously, legacy systems fail. Our architecture uses conditional atomic operations to guarantee data integrity.
                </p>
                <ul className="list-unstyled d-flex flex-column gap-3 mb-5">
                  <li className="d-flex align-items-start gap-3">
                    <div className="mt-1 text-primary"><Server size={20}/></div>
                    <div>
                      <h5 className="fw-bold mb-1">Optimistic UI Updates</h5>
                      <p className="text-muted mb-0">Interface responds instantly while confirming with the server in the background.</p>
                    </div>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <div className="mt-1 text-primary"><Cpu size={20}/></div>
                    <div>
                      <h5 className="fw-bold mb-1">$inc Operator Locking</h5>
                      <p className="text-muted mb-0">MongoDB native atomic operators prevent conflicting stock decrements.</p>
                    </div>
                  </li>
                </ul>
                <Link to="/dashboard" className="btn btn-primary-glow">Experience the Dashboard</Link>
              </div>
              
              <div className="col-lg-6 animate-fade-up delay-200">
                <div className="glass-panel p-2 rounded-4 ms-lg-4 position-relative">
                   <div className="position-absolute top-0 start-50 translate-middle-x w-75 h-100 bg-primary opacity-10 blur-xl" style={{ filter: 'blur(100px)', zIndex: -1 }}></div>
                   <img src="/dashboard-preview.png" alt="Dashboard Preview" className="img-fluid rounded-3 w-100" style={{ objectFit: 'cover', height: '400px', opacity: '0.85' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-5 my-5 text-center">
          <div className="container animate-fade-up">
            <h2 className="fw-bold fs-1 mb-4">Start Managing Inventory Smarter Today</h2>
            <p className="text-muted mb-5 mx-auto" style={{ maxWidth: '500px' }}>Join leading teams who trust SmartStock for their mission-critical inventory management needs.</p>
            <Link to="/dashboard" className="btn btn-primary-glow btn-lg px-5 py-3 fs-5">
              Launch Application
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
