import { useEffect, useRef } from 'react';

/**
 * AdSlot — Renders Adsterra native banner ads.
 * 
 * The native banner uses a container div with a specific ID
 * and loads the Adsterra invoke.js script to fill it.
 * 
 * All ad types share the same native banner code.
 * Social Bar is handled in index.html (global sticky).
 */

const NATIVE_BANNER = {
  scriptSrc: 'https://pl29276371.profitablecpmratenetwork.com/be2a5e46921dedf8c17d60d4674bf754/invoke.js',
  containerId: 'container-be2a5e46921dedf8c17d60d4674bf754',
};

export default function AdSlot({ type = 'native', className = '' }) {
  const wrapperRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !wrapperRef.current) return;

    // Create the container div that Adsterra targets
    const container = document.createElement('div');
    container.id = NATIVE_BANNER.containerId;
    wrapperRef.current.appendChild(container);

    // Inject the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = NATIVE_BANNER.scriptSrc;
    wrapperRef.current.appendChild(script);

    loaded.current = true;
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`ad-slot ad-slot--${type} ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        width: '100%',
      }}
    />
  );
}
