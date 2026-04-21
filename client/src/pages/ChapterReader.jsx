import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  HiChevronLeft, HiChevronRight, HiHome, HiCog,
  HiArrowsExpand
} from 'react-icons/hi';
import { useReaderStore, useReadingProgressStore } from '../store/readerStore';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/ui/Spinner';
import CommentSection from '../components/manhwa/CommentSection';

/* Demo pages for when backend is offline */
const makeDemoPages = () => Array.from({ length: 25 }, (_, i) => ({
  url: `https://picsum.photos/800/${1100 + (i * 7) % 200}?random=${Date.now()}-${i}`,
  order: i,
}));

export default function ChapterReader() {
  const { slug, chapterNumber } = useParams();
  const navigate = useNavigate();
  const chNum = parseInt(chapterNumber, 10) || 1;

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [totalChapters, setTotalChapters] = useState(0);
  const [error, setError] = useState(null);
  
  const [ids, setIds] = useState({ manhwaId: null, chapterId: null });
  const { user } = useAuthStore();

  const containerRef = useRef(null);
  const lastScrollY = useRef(0);

  /* Reader store values with defaults */
  let mode = 'vertical';
  let background = 'black';
  let imageFit = 'fit-width';
  let pageGap = 4;
  let setMode, setBackground, setImageFit, setPageGap;
  let saveProgress;

  try {
    const readerStore = useReaderStore();
    mode = readerStore.mode || 'vertical';
    background = readerStore.background || 'black';
    imageFit = readerStore.imageFit || 'fit-width';
    pageGap = readerStore.pageGap ?? 4;
    setMode = readerStore.setMode;
    setBackground = readerStore.setBackground;
    setImageFit = readerStore.setImageFit;
    setPageGap = readerStore.setPageGap;

    const progressStore = useReadingProgressStore();
    saveProgress = progressStore.saveProgress;
  } catch (e) {
    console.error('Store init error:', e);
  }

  /* Fetch manhwa metadata for total chapters */
  useEffect(() => {
    (async () => {
      try {
        const { manhwaService } = await import('../services/manhwaService');
        const res = await manhwaService.getBySlug(slug);
        setTotalChapters(res.data?.data?.latestChapter || 0);
      } catch (err) {
        console.error('Failed to fetch manhwa total chapters:', err);
      }
    })();
  }, [slug]);

  /* Fetch chapter pages */
  useEffect(() => {
    window.scrollTo(0, 0);
    setCurrentPage(0);
    setError(null);

    const fetchPages = async () => {
      try {
        setLoading(true);
        const { chapterService } = await import('../services/manhwaService');
        const res = await chapterService.getBySlugAndNumber(slug, chapterNumber);
        
        // If pages is empty, load demo pages so reader doesn't crash on length 0
        if (res.data?.pages && res.data.pages.length > 0) {
          setPages(res.data.pages);
          setIds({ manhwaId: res.data.manhwaId, chapterId: res.data._id });
        } else {
          console.warn("API returned empty pages array, using demo pages");
          setPages(makeDemoPages());
        }
      } catch {
        setPages(makeDemoPages());
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [slug, chapterNumber]);

  /* Save progress */
  useEffect(() => {
    if (pages.length > 0 && saveProgress) {
      try {
        saveProgress(slug, chNum, currentPage, ids, user);
      } catch { /* ignore */ }
    }
  }, [currentPage, slug, chNum, pages.length, ids, user]);

  /* Preload next 3 images */
  useEffect(() => {
    if (!pages || pages.length === 0) return;
    const preloadCount = 3;
    for (let i = currentPage + 1; i <= currentPage + preloadCount && i < pages.length; i++) {
      const img = new Image();
      img.src = pages[i].url;
    }
  }, [currentPage, pages]);

  /* Toolbar auto-hide on scroll */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current + 30) {
        setToolbarVisible(false);
      } else if (y < lastScrollY.current - 10) {
        setToolbarVisible(true);
      }
      lastScrollY.current = y;

      if (mode === 'vertical' && containerRef.current) {
        const imgs = containerRef.current.querySelectorAll('img');
        if (imgs.length === 0) return;
        let closest = 0;
        let minDist = Infinity;
        imgs.forEach((img, i) => {
          const dist = Math.abs(img.getBoundingClientRect().top - 100);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });
        setCurrentPage(closest);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mode]);

  /* Keyboard shortcuts */
  const goNextPage = useCallback(() => {
    if (mode === 'vertical') return;
    if (currentPage < pages.length - 1) {
      setCurrentPage((p) => p + 1);
    } else if (chNum < totalChapters) {
      navigate(`/read/${slug}/${chNum + 1}`);
    }
  }, [currentPage, pages.length, mode, chNum, totalChapters, slug, navigate]);

  const goPrevPage = useCallback(() => {
    if (mode === 'vertical') return;
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    } else if (chNum > 1) {
      navigate(`/read/${slug}/${chNum - 1}`);
    }
  }, [currentPage, mode, chNum, slug, navigate]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNextPage();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrevPage();
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
      if (e.key === 's' || e.key === 'S') setSettingsOpen((v) => !v);
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNextPage, goPrevPage]);

  const bgClasses = { black: 'bg-black text-white', white: 'bg-white text-black', sepia: 'bg-[#f4ecd8] text-[#433422]' };
  const fitClasses = { 'fit-width': 'w-full max-w-4xl', 'fit-height': 'max-h-screen w-auto', original: 'w-auto' };

  const titleText = `Chapter ${chNum} — ${(slug || '').replace(/-/g, ' ')} — TerraManhwa`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{titleText}</title>
      </Helmet>

      <div className={`min-h-screen ${bgClasses[background] || 'bg-black text-white'}`}>
        {/* ═══ TOP TOOLBAR ═══ */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 glass transition-transform duration-300 ${
            toolbarVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-terra-muted hover:text-terra-text transition-colors">
                <HiHome size={20} />
              </Link>
              <Link to={`/manhwa/${slug}`} className="text-sm text-terra-muted hover:text-terra-text truncate max-w-[200px]">
                {(slug || '').replace(/-/g, ' ')}
              </Link>
              <span className="text-terra-red font-semibold text-sm">Ch. {chNum}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => chNum > 1 && navigate(`/read/${slug}/${chNum - 1}`)}
                disabled={chNum <= 1}
                className="p-2 text-terra-muted hover:text-terra-text disabled:opacity-30 transition-colors"
              >
                <HiChevronLeft size={18} />
              </button>

              <select
                value={chNum}
                onChange={(e) => navigate(`/read/${slug}/${e.target.value}`)}
                className="bg-terra-card border border-terra-border rounded-lg px-2 py-1 text-sm text-terra-text focus:outline-none"
              >
                {Array.from({ length: totalChapters }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Ch. {i + 1}</option>
                ))}
              </select>

              <button
                onClick={() => chNum < totalChapters && navigate(`/read/${slug}/${chNum + 1}`)}
                disabled={chNum >= totalChapters}
                className="p-2 text-terra-muted hover:text-terra-text disabled:opacity-30 transition-colors"
              >
                <HiChevronRight size={18} />
              </button>

              <span className="text-xs text-terra-muted mx-2 hidden sm:inline">
                Page {currentPage + 1} / {pages.length}
              </span>

              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 text-terra-muted hover:text-terra-text transition-colors"
              >
                <HiCog size={18} />
              </button>

              <button
                onClick={() => {
                  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
                  else document.exitFullscreen?.();
                }}
                className="p-2 text-terra-muted hover:text-terra-text transition-colors hidden sm:block"
              >
                <HiArrowsExpand size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ SETTINGS PANEL ═══ */}
        {settingsOpen && (
          <div className="fixed right-0 top-14 bottom-0 w-72 z-50 bg-terra-bg-secondary border-l border-terra-border shadow-2xl p-5 space-y-6 overflow-y-auto animate-slide-in-right">
            <h3 className="font-display text-lg tracking-wider">SETTINGS</h3>

            <div>
              <label className="text-xs text-terra-muted uppercase tracking-wider font-medium">Reading Mode</label>
              <div className="flex gap-2 mt-2">
                {['vertical', 'single', 'double'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode?.(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                      mode === m ? 'bg-terra-red text-white' : 'bg-terra-card text-terra-muted hover:text-terra-text'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-terra-muted uppercase tracking-wider font-medium">Background</label>
              <div className="flex gap-2 mt-2">
                {[
                  { v: 'black', color: '#000', label: 'Dark' },
                  { v: 'white', color: '#fff', label: 'Light' },
                  { v: 'sepia', color: '#f4ecd8', label: 'Sepia' },
                ].map((bg) => (
                  <button
                    key={bg.v}
                    onClick={() => setBackground?.(bg.v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      background === bg.v ? 'ring-2 ring-terra-red' : ''
                    }`}
                    style={{ backgroundColor: bg.color, color: bg.v === 'black' ? '#fff' : '#000' }}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-terra-muted uppercase tracking-wider font-medium">Image Fit</label>
              <div className="flex flex-col gap-1.5 mt-2">
                {['fit-width', 'fit-height', 'original'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setImageFit?.(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize text-left transition-colors ${
                      imageFit === f ? 'bg-terra-red text-white' : 'bg-terra-card text-terra-muted hover:text-terra-text'
                    }`}
                  >
                    {f.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-terra-muted uppercase tracking-wider font-medium">
                Page Gap: {pageGap}px
              </label>
              <input
                type="range" min="0" max="20" value={pageGap}
                onChange={(e) => setPageGap?.(parseInt(e.target.value))}
                className="w-full mt-2 accent-terra-red"
              />
            </div>
          </div>
        )}

        {/* ═══ READER CONTENT ═══ */}
        <div ref={containerRef} className="pt-16 pb-20 flex flex-col items-center min-h-screen">
          {mode === 'vertical' && (
            <div className="flex flex-col items-center" style={{ gap: `${pageGap}px` }}>
              {pages.map((page, i) => (
                <img
                  key={i}
                  src={page.url}
                  alt={`Page ${i + 1}`}
                  className={`${fitClasses[imageFit] || 'w-full max-w-4xl'} mx-auto animate-fade-in`}
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {mode === 'single' && pages.length > 0 && (
            <div className="flex-1 flex items-center justify-center px-4 relative w-full">
              <button onClick={goPrevPage} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" aria-label="Previous page" />
              <img
                src={pages[currentPage]?.url}
                alt={`Page ${currentPage + 1}`}
                className={`${fitClasses[imageFit] || 'w-full max-w-4xl'} mx-auto animate-fade-in`}
              />
              <button onClick={goNextPage} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" aria-label="Next page" />
            </div>
          )}

          {mode === 'double' && pages.length > 0 && (
            <div className="flex-1 flex items-center justify-center gap-1 px-4 relative w-full">
              <button onClick={goPrevPage} className="absolute left-0 top-0 bottom-0 w-1/4 z-10" aria-label="Previous page" />
              <img
                src={pages[currentPage]?.url}
                alt={`Page ${currentPage + 1}`}
                className="max-h-[85vh] w-auto"
              />
              {pages[currentPage + 1] && (
                <img
                  src={pages[currentPage + 1]?.url}
                  alt={`Page ${currentPage + 2}`}
                  className="max-h-[85vh] w-auto"
                />
              )}
              <button onClick={goNextPage} className="absolute right-0 top-0 bottom-0 w-1/4 z-10" aria-label="Next page" />
            </div>
          )}
        </div>

        {/* ═══ FLOATING NAVIGATOR ═══ */}
        <div className={`fixed bottom-6 right-6 z-30 transition-all duration-500 ${toolbarVisible ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <div className="bg-black/60 backdrop-blur-md rounded-full shadow-2xl border border-white/10 p-1.5 flex items-center gap-1">
            <button onClick={goPrevPage} className="p-2 text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full">
              <HiChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-bold tracking-widest uppercase text-white px-2 cursor-pointer font-display" onClick={() => setToolbarVisible(true)}>
              {currentPage + 1} / {pages.length}
            </span>
            <button onClick={goNextPage} className="p-2 text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full">
              <HiChevronRight size={16} />
            </button>
          </div>
        </div>


        {/* ═══ BOTTOM NAV ═══ */}
        <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-terra-border">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
            <button
              onClick={() => chNum > 1 && navigate(`/read/${slug}/${chNum - 1}`)}
              disabled={chNum <= 1}
              className="px-3 py-1.5 rounded-lg bg-terra-card text-sm text-terra-muted hover:text-terra-text disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={Math.max(0, pages.length - 1)}
                value={currentPage}
                onChange={(e) => {
                  const p = parseInt(e.target.value);
                  setCurrentPage(p);
                  if (mode === 'vertical' && containerRef.current) {
                    const imgs = containerRef.current.querySelectorAll('img');
                    if (imgs[p]) imgs[p].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="w-full accent-terra-red"
              />
            </div>

            <span className="text-xs text-terra-muted w-16 text-center">
              {currentPage + 1}/{pages.length}
            </span>

            <button
              onClick={() => chNum < totalChapters && navigate(`/read/${slug}/${chNum + 1}`)}
              disabled={chNum >= totalChapters}
              className="px-3 py-1.5 rounded-lg bg-terra-card text-sm text-terra-muted hover:text-terra-text disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
        {/* ═══ COMMENTS ═══ */}
        <div className="pb-32 bg-[#0a0a0a] border-t border-terra-border pt-12">
            <CommentSection slug={slug} />
        </div>
      </div>
    </>
  );
}
