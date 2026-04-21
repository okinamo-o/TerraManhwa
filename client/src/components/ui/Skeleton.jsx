export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-terra-card">
      <div className="skeleton w-full aspect-[3/4]" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return <div className={`skeleton ${width} ${height} rounded`} />;
}

export function SkeletonBlock({ lines = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-4 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
