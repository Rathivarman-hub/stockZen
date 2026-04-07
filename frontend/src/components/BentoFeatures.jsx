import React from 'react';
import { Zap, ShieldCheck, Activity, BarChart3, Users, BellRing } from 'lucide-react';

const BentoFeatures = () => {
  const features = [
    {
      icon: <Zap size={24} />,
      title: "Real-time Stock Updates",
      desc: "Changes reflect globally in milliseconds via WebSocket infrastructure.",
      colSpan: "col-md-8 col-lg-8"
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Prevent Overselling",
      desc: "Atomic database transactions ensure strict consistency.",
      colSpan: "col-md-4 col-lg-4"
    },
    {
      icon: <Activity size={24} />,
      title: "Admin Dashboard",
      desc: "Comprehensive view of all your inventory metrics.",
      colSpan: "col-md-4 col-lg-4"
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Analytics Insights",
      desc: "Trend analysis and usage breakdowns over time.",
      colSpan: "col-md-4 col-lg-4"
    },
    {
      icon: <Users size={24} />,
      title: "Multi-user Sync",
      desc: "Collaborate without state conflicts or overlaps.",
      colSpan: "col-md-4 col-lg-4"
    },
    {
      icon: <BellRing size={24} />,
      title: "Smart Alerts",
      desc: "Instant notifications for low or out-of-stock items.",
      colSpan: "col-12"
    }
  ];

  return (
    <section id="features" className="py-5 my-5">
      <div className="container">
        <div className="text-center mb-5 animate-fade-up">
          <h2 className="fw-bold fs-1 mb-3">Enterprise-Grade Architecture</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Built to handle concurrent updates, eliminate race conditions, and keep your data strictly synchronized across every platform.
          </p>
        </div>

        <div className="row g-4">
          {features.map((item, idx) => (
            <div key={idx} className={`${item.colSpan} animate-fade-up`} style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="glass-panel bento-card d-flex flex-column justify-content-between h-100">
                <div>
                  <div className="bento-icon">
                    {item.icon}
                  </div>
                  <h4 className="fw-bold mb-3">{item.title}</h4>
                  <p className="text-muted mb-0">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BentoFeatures;
