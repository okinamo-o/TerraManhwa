import { Link } from 'react-router-dom';

export default function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-1 group" id="logo">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#e63946" strokeWidth="2" />
        <path d="M10 12 L16 8 L22 12 L22 20 L16 24 L10 20 Z" fill="#e63946" opacity="0.3" />
        <path d="M13 14 L16 11 L19 14 L19 18 L16 21 L13 18 Z" fill="#e63946" />
      </svg>
      {!compact && (
        <div className="flex items-baseline leading-none">
          <span className="font-display text-2xl tracking-wider text-terra-text group-hover:text-terra-red transition-colors">
            TERRA
          </span>
          <span className="font-display text-lg tracking-wider text-terra-muted ml-0.5">
            MANHWA
          </span>
        </div>
      )}
    </Link>
  );
}
