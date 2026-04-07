import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // If there is a hash (e.g. #features), wait for DOM to assemble then smoothly scroll to it
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Standard page navigation with no hash snaps instantly to the exact top 
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth' 
      });
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
