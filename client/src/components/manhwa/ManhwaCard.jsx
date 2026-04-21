import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import { HiStar, HiEye, HiBookOpen } from 'react-icons/hi';

export default function ManhwaCard({ manhwa, rank = null }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const {
    title, slug, cover, genres = [], status,
    rating, views, latestChapter, updatedAt
  } = manhwa;

  const statusBadge = status?.toLowerCase();
  const timeAgo = formatTimeAgo(updatedAt);
  const isNew = updatedAt && (Date.now() - new Date(updatedAt).getTime() < 86400000);

  return (
    <Link
      to={`/manhwa/${slug}`}
      className="group relative block rounded-xl overflow-hidden bg-terra-card card-hover border border-white/5 hover:border-terra-red/50 hover:shadow-[0_0_20px_rgba(230,57,70,0.15)] transition-all duration-500"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      id={`manhwa-card-${slug}`}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-terra-bg">
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        <img
          src={cover || '/placeholder-cover.jpg'}
          alt={title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iIzY2NiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db3ZlciBVbmF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
          }}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Hover overlay - Premium Glass effect */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col justify-end p-4 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <p className="text-xs text-terra-text line-clamp-3 mb-2 leading-relaxed">
              {manhwa.synopsis?.substring(0, 120)}...
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-terra-red uppercase tracking-wider">
              <HiBookOpen size={14} /> View Details
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
          {status && (
            <Badge type={statusBadge}>{status}</Badge>
          )}
          {isNew && (
            <div className="px-2 py-0.5 rounded bg-terra-red text-white text-[10px] font-bold uppercase tracking-tight shadow-lg shadow-black/40">
              New
            </div>
          )}
        </div>

        {/* Rank or Rating Overlay */}
        {(rank || (rating?.score && rating.score >= 9)) && (
          <div className={`absolute top-2 right-2 w-8 h-8 ${rank ? 'bg-terra-gold' : 'bg-black/70 border border-terra-gold/50'} text-white rounded-lg flex items-center justify-center font-display text-lg shadow-xl`}>
             {rank || <HiStar className="text-terra-gold" size={16} />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-terra-red transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between text-xs text-terra-muted">
          <span className="flex items-center gap-1">
            {latestChapter && <>Ch. {latestChapter}</>}
          </span>
          <span className="flex items-center gap-1">
            {rating?.score ? (
              <>
                <HiStar className="text-terra-gold" size={12} />
                {rating.score.toFixed(1)}
              </>
            ) : (
              <>
                <HiEye size={12} />
                {formatViews(views)}
              </>
            )}
          </span>
        </div>
        {timeAgo && (
          <p className="text-[10px] text-terra-muted/70">{timeAgo}</p>
        )}
      </div>
    </Link>
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}
