import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ManhwaGrid from '../components/manhwa/ManhwaGrid';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { HiFilter, HiX, HiSortDescending } from 'react-icons/hi';
import { manhwaService } from '../services/manhwaService';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest Update' },
  { value: 'views', label: 'Most Views' },
  { value: 'rating', label: 'Highest Rating' },
  { value: 'bookmarks', label: 'Most Bookmarks' },
  { value: 'new', label: 'Newest Added' },
  { value: 'az', label: 'A–Z' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [manhwaList, setManhwaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [meta, setMeta] = useState({ genres: [], statuses: [] });

  const selectedGenres = searchParams.getAll('genre');
  const selectedStatus = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'latest';
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [res, metaRes] = await Promise.all([
          manhwaService.getAll({
            genre: selectedGenres.join(','),
            status: selectedStatus,
            sort,
            page,
            limit: 24,
          }),
          manhwaService.getMeta()
        ]);
        
        setManhwaList(res.data?.data || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.pages || 1);
        setMeta(metaRes.data || { genres: [], statuses: [] });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Failed to fetch browse data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedGenres.join(','), selectedStatus, sort, page]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params);
  };

  const toggleGenre = (genre) => {
    const params = new URLSearchParams(searchParams);
    const genres = params.getAll('genre');
    if (genres.includes(genre)) {
      params.delete('genre');
      genres.filter((g) => g !== genre).forEach((g) => params.append('genre', g));
    } else {
      params.append('genre', genre);
    }
    params.set('page', 1);
    setSearchParams(params);
  };

  const setSort = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    params.set('page', 1);
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  const activeFilterCount = selectedGenres.length + (selectedStatus ? 1 : 0);

  return (
    <>
      <Helmet>
        <title>Browse Manhwa — TerraManhwa</title>
        <meta name="description" content="Browse our entire collection of manhwa. Filter by genre, status, and more." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl tracking-wider">BROWSE</h1>
          <p className="text-terra-muted mt-1">
            {loading ? 'Searching library...' : `Showing ${(page - 1) * 24 + 1}-${Math.min(page * 24, total)} of ${total} manhwa`}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              filtersOpen
                ? 'bg-terra-red text-white border-terra-red'
                : 'bg-terra-card text-terra-muted border-terra-border hover:border-terra-red'
            }`}
          >
            <HiFilter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-terra-red text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-terra-card border border-terra-border rounded-lg px-4 py-2 text-sm text-terra-text pr-8 focus:outline-none focus:border-terra-red cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <HiSortDescending className="absolute right-2 top-1/2 -translate-y-1/2 text-terra-muted pointer-events-none" size={16} />
          </div>

          {selectedGenres.map((g) => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-terra-red/10 text-terra-red text-xs font-medium hover:bg-terra-red/20 transition-colors"
            >
              {g} <HiX size={12} />
            </button>
          ))}
          {selectedStatus && (
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('status');
                params.set('page', 1);
                setSearchParams(params);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-terra-gold/10 text-terra-gold text-xs font-medium hover:bg-terra-gold/20 transition-colors"
            >
              {selectedStatus} <HiX size={12} />
            </button>
          )}
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-terra-muted hover:text-terra-red transition-colors">
              Clear All
            </button>
          )}
        </div>

        <div className="flex gap-6">
          {filtersOpen && (
            <aside className="w-64 shrink-0 hidden md:block animate-fade-in">
              <div className="sticky top-20 bg-terra-card rounded-xl border border-terra-border p-5 space-y-6">
                <div>
                  <h3 className="font-display text-sm tracking-wider mb-3">GENRES</h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {meta.genres.map((genre) => (
                      <label key={genre} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre)}
                          onChange={() => toggleGenre(genre)}
                          className="w-3.5 h-3.5 rounded border-terra-border bg-terra-bg accent-terra-red"
                        />
                        <span className="text-sm text-terra-muted hover:text-terra-text transition-colors">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-sm tracking-wider mb-3">STATUS</h3>
                  <div className="space-y-1.5">
                    {meta.statuses.map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          checked={selectedStatus === s}
                          onChange={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set('status', s);
                            params.set('page', 1);
                            setSearchParams(params);
                          }}
                          className="w-3.5 h-3.5 border-terra-border bg-terra-bg accent-terra-red"
                        />
                        <span className="text-sm text-terra-muted">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1">
            <ManhwaGrid manhwaList={manhwaList} loading={loading} />
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </div>
        </div>
      </div>
    </>
  );
}
