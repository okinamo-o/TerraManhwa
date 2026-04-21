import { useState, useEffect } from 'react';
import { HiArrowUp } from 'react-icons/hi';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 md:bottom-8 right-4 z-40 w-10 h-10 bg-terra-red text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform animate-fade-in"
      aria-label="Scroll to top"
      id="scroll-to-top"
    >
      <HiArrowUp size={18} />
    </button>
  );
}
