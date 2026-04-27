import { useEffect, useRef } from 'react';

/**
 * AdSlot — Renders an Adsterra ad unit.
 * 
 * Usage:
 *   <AdSlot type="banner" />        — 728x90 banner (detail pages, between chapters)
 *   <AdSlot type="native" />        — Native banner (browse page, sidebar)
 *   <AdSlot type="reader-top" />    — Top of reader
 *   <AdSlot type="reader-bottom" /> — Bottom of reader
 * 
 * To activate: Replace the placeholder divs below with your Adsterra script tags.
 */

const AD_CONFIG = {
  // ══════════════════════════════════════════════════════
  // PASTE YOUR ADSTERRA CODES HERE
  // After signing up at https://publishers.adsterra.com
  // you'll get script tags for each ad format.
  // ══════════════════════════════════════════════════════

  // Social Bar (sticky bottom — goes in index.html, not here)
  // This is handled separately in index.html

  // Native Banner — for browse/detail pages
  native: {
    enabled: false, // Set to true once you have codes
    scriptSrc: '', // e.g. '//pl12345678.profitablegatecpm.com/abc123/invoke.js'
    containerId: 'adsterra-native',
    atOptions: null, // e.g. { key: 'abc123', format: 'iframe', height: 90, width: 728 }
  },

  // Banner — for reader pages  
  banner: {
    enabled: false,
    scriptSrc: '',
    containerId: 'adsterra-banner',
    atOptions: null,
  },

  // Reader Top
  'reader-top': {
    enabled: false,
    scriptSrc: '',
    containerId: 'adsterra-reader-top',
    atOptions: null,
  },

  // Reader Bottom
  'reader-bottom': {
    enabled: false,
    scriptSrc: '',
    containerId: 'adsterra-reader-bottom',
    atOptions: null,
  },
};

export default function AdSlot({ type = 'banner', className = '' }) {
  const containerRef = useRef(null);
  const config = AD_CONFIG[type];
  const loaded = useRef(false);

  useEffect(() => {
    if (!config?.enabled || loaded.current) return;
    if (!config.scriptSrc) return;

    // Set atOptions on window if provided
    if (config.atOptions) {
      window.atOptions = config.atOptions;
    }

    // Inject script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = config.scriptSrc;
    script.async = true;
    
    if (containerRef.current) {
      containerRef.current.appendChild(script);
      loaded.current = true;
    }

    return () => {
      if (containerRef.current && script.parentNode === containerRef.current) {
        containerRef.current.removeChild(script);
      }
    };
  }, [config]);

  // Don't render anything if ads aren't enabled
  if (!config?.enabled) return null;

  return (
    <div
      ref={containerRef}
      id={config.containerId}
      className={`ad-slot ad-slot--${type} ${className}`}
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '90px',
        overflow: 'hidden',
      }}
    />
  );
}
