import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiSearch, HiX, HiClock } from 'react-icons/hi';
import ManhwaGrid from '../components/manhwa/ManhwaGrid';
import { searchService } from '../services/manhwaService';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('terra-recent-searches') || '[]'); } catch { return []; }
  });
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (!input.trim()) { setResults([]); return; }
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await searchService.search({ q: input.trim() });
        setResults(res.data?.data || []);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchResults, 400);
    return () => clearTimeout(debounceRef.current);
  }, [input]);

  const saveRecentSearch = (term) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('terra-recent-searches', JSON.stringify(updated));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setSearchParams({ q: input.trim() });
      saveRecentSearch(input.trim());
    }
  };

  return (
    <>
      <Helmet><title>Search Results for "{query || input}" — TerraManhwa</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
           <h1 className="font-display text-4xl md:text-5xl tracking-wider">SEARCH</h1>
           <p className="text-terra-muted mt-1">Discover your next obsession in our expansive library</p>
        </div>

        <form onSubmit={handleSubmit} className="relative mb-10 max-w-2xl">
          <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-terra-muted" size={22} />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Title, Genre, or Author..."
            className="w-full pl-12 pr-12 py-4 bg-terra-card border border-terra-border rounded-2xl text-terra-text placeholder:text-terra-muted focus:outline-none focus:border-terra-red transition-all text-lg shadow-lg shadow-black/20"
          />
          {input && (
            <button type="button" onClick={() => { setInput(''); setResults([]); setSearchParams({}); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-terra-muted hover:text-terra-red transition-colors">
              <HiX size={20} />
            </button>
          )}
        </form>

        {/* Recent searches */}
        {!input && recentSearches.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <h3 className="text-xs uppercase tracking-widest text-terra-muted mb-4 flex items-center gap-2 font-semibold">
               <HiClock size={16} className="text-terra-red" /> Recent Searches
            </h3>
            <div className="flex flex-wrap gap-3">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => { setInput(term); setSearchParams({ q: term }); }}
                  className="px-4 py-2 rounded-xl bg-terra-card border border-terra-border text-sm text-terra-text hover:text-white hover:bg-terra-red hover:border-terra-red transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="min-h-[400px]">
           {(input || query) && (
             <ManhwaGrid manhwaList={results} loading={loading} count={12} />
           )}

           {(input || query) && !loading && results.length === 0 && (
             <div className="text-center py-24 animate-fade-in">
               <div className="w-20 h-20 bg-terra-card rounded-full flex items-center justify-center mx-auto mb-6 border border-terra-border">
                  <HiSearch size={40} className="text-terra-muted opacity-20" />
               </div>
               <h2 className="text-2xl font-display mb-2">No Results Found</h2>
               <p className="text-terra-muted max-w-md mx-auto">
                 We couldn't find any matches for <span className="text-terra-text font-semibold">"{input}"</span>. 
                 Try checking the spelling or using broader search terms.
               </p>
             </div>
           )}
        </div>
      </div>
    </>
  );
}
