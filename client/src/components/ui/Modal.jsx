import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Content */}
      <div className={`relative ${maxWidth} w-full bg-terra-bg-secondary border border-terra-border rounded-2xl shadow-2xl animate-slide-up`}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-terra-border">
            <h3 className="font-display text-xl tracking-wide">{title}</h3>
            <button
              onClick={onClose}
              className="text-terra-muted hover:text-terra-text transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
