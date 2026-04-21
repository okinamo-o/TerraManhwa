import ManhwaCard from './ManhwaCard';
import { SkeletonCard } from '../ui/Skeleton';

export default function ManhwaGrid({ manhwaList = [], loading = false, columns = 'default', count = 10 }) {
  const gridCols = {
    default: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!manhwaList.length) {
    return (
      <div className="text-center py-16">
        <p className="text-terra-muted text-lg">No manhwa found</p>
        <p className="text-terra-muted/60 text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {manhwaList.map((m, i) => (
        <ManhwaCard key={m._id || m.slug || i} manhwa={m} />
      ))}
    </div>
  );
}
