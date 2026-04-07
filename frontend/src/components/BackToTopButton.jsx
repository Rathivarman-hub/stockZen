import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '115px',
        right: '30px',
        zIndex: 1040,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <button 
        onClick={scrollToTop}
        className="btn btn-primary-glow rounded-circle d-flex justify-content-center align-items-center shadow-lg"
        style={{ width: '50px', height: '50px', padding: 0 }}
        title="Back to Top"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

export default BackToTopButton;
