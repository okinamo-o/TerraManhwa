import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiStar, HiEye, HiBookmark, HiBookOpen, HiSortDescending, HiSortAscending, HiHeart } from 'react-icons/hi';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ManhwaCard from '../components/manhwa/ManhwaCard';
import { SkeletonBlock, SkeletonLine } from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import { manhwaService } from '../services/manhwaService';
import { useBookmarkStore } from '../store/bookmarkStore';
import { useAuthStore } from '../store/authStore';
import { useReadingProgressStore } from '../store/readerStore';
import CommentSection from '../components/manhwa/CommentSection';

export default function ManhwaDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [manhwa, setManhwa] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [chapterSort, setChapterSort] = useState('desc');
  const [chapterPage, setChapterPage] = useState(1);
  const chaptersPerPage = 50;

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { user } = useAuthStore();
  const bookmarked = isBookmarked(slug);
  const progress = useReadingProgressStore((s) => s.getProgress(slug));
  const [related, setRelated] = useState([]);
  const [error, setError] = useState(null);

  const [showLongLoadMsg, setShowLongLoadMsg] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowLongLoadMsg(true), 1500);
    } else {
      setShowLongLoadMsg(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [res, relatedRes] = await Promise.all([
          manhwaService.getBySlug(slug),
          manhwaService.getPopular()
        ]);
        
        const mData = res.data.data || res.data;
        if (!mData || !mData.title) throw new Error('Manhwa not found');

        setManhwa(mData);
        setChapters(res.data.chapters || mData.chapters || []);
        
        // Filter out the current manhwa from related
        const relData = (relatedRes.data.data || relatedRes.data).filter(m => m.slug !== slug).slice(0, 4);
        setRelated(relData);
      } catch (err) {
        console.error('Failed to load manhwa details:', err);
        setError('Could not load manhwa details. It might still be seeding or the server is unavailable.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="skeleton w-64 h-96 rounded-xl shrink-0" />
          <div className="flex-1 space-y-4">
            <SkeletonLine width="w-2/3" height="h-8" />
            <SkeletonLine width="w-1/3" height="h-4" />
            <SkeletonBlock lines={4} />

            {showLongLoadMsg && (
              <div className="mt-8 p-6 bg-terra-card border border-terra-border rounded-xl animate-pulse flex flex-col items-center justify-center text-center">
                <Spinner size="md" className="mb-3" />
                <h3 className="text-terra-gold font-bold text-lg mb-1">Indexing Chapters...</h3>
                <p className="text-terra-muted text-sm max-w-md">
                  We are fetching the chapter list for the very first time. This may take 3-5 seconds, but it will be instant on your next visit!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-display mb-4">Manga Not Found</h2>
        <p className="text-terra-muted mb-8">{error}</p>
        <Link to="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    );
  }

  if (!manhwa) return null;

  const sortedChapters = [...chapters].sort((a, b) =>
    chapterSort === 'desc' ? b.chapterNumber - a.chapterNumber : a.chapterNumber - b.chapterNumber
  );
  const totalChapterPages = Math.ceil(sortedChapters.length / chaptersPerPage);
  const displayChapters = sortedChapters.slice((chapterPage - 1) * chaptersPerPage, chapterPage * chaptersPerPage);

  const statusColors = { ongoing: 'ongoing', completed: 'completed', hiatus: 'hiatus', dropped: 'dropped' };

  return (
    <>
      <Helmet>
        <title>{`${manhwa.title} — TerraManhwa`}</title>
        <meta name="description" content={manhwa.synopsis?.substring(0, 160)} />
        <meta property="og:title" content={manhwa.title} />
        <meta property="og:description" content={manhwa.synopsis?.substring(0, 160)} />
        <meta property="og:image" content={manhwa.cover} />
      </Helmet>

      {/* Banner bg */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${manhwa.cover})`, filter: 'blur(40px) brightness(0.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-terra-bg" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-40 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="shrink-0">
            <img
              src={manhwa.cover}
              alt={manhwa.title}
              className="w-48 md:w-64 rounded-xl shadow-2xl border-2 border-terra-border"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge type={statusColors[manhwa.status?.toLowerCase()]}>
                {manhwa.status}
              </Badge>
              {manhwa.releaseYear && (
                <Badge>{manhwa.releaseYear}</Badge>
              )}
            </div>

            <h1 className="font-display text-4xl md:text-5xl tracking-wider mb-1">{manhwa.title}</h1>
            {manhwa.alternativeTitles?.length > 0 && (
              <p className="text-terra-muted text-sm font-korean mb-4">{manhwa.alternativeTitles.join(' / ')}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-terra-muted mb-4">
              {manhwa.author && <span>Author: <span className="text-terra-text">{manhwa.author}</span></span>}
              {manhwa.artist && <span>Artist: <span className="text-terra-text">{manhwa.artist}</span></span>}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-5 mb-5">
              {manhwa.rating?.score && (
                <div className="flex items-center gap-1.5">
                  <HiStar className="text-terra-gold" size={20} />
                  <span className="text-lg font-bold">{manhwa.rating.score.toFixed(1)}</span>
                  <span className="text-terra-muted text-xs">({manhwa.rating.votes?.toLocaleString()} votes)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-terra-muted">
                <HiEye size={18} />
                <span>{(manhwa.views / 1e6).toFixed(1)}M</span>
              </div>
              <div className="flex items-center gap-1.5 text-terra-muted">
                <HiBookmark size={18} />
                <span>{(manhwa.bookmarkCount / 1e3).toFixed(1)}K</span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {manhwa.genres
                ?.filter(g => typeof g === 'string')
                .map((g) => (
                <Link key={g} to={`/genre/${g.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Badge type="genre" className="hover:text-terra-gold transition-colors">{g}</Badge>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Link to={progress ? `/read/${slug}/${progress.chapter}` : `/read/${slug}/${sortedChapters.length > 0 ? sortedChapters[sortedChapters.length - 1].chapterNumber : 1}`}>
                <Button variant="primary" size="lg">
                  <HiBookOpen size={18} />
                  {progress ? 'Continue Reading' : 'Start Reading'}
                </Button>
              </Link>
              <Button
                variant={bookmarked ? 'gold' : 'secondary'}
                size="lg"
                onClick={() => toggleBookmark(manhwa, user)}
              >
                <HiHeart size={18} className={bookmarked ? 'animate-pulse' : ''} />
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
            </div>

            {/* Synopsis */}
            <div className="mb-8">
              <h2 className="font-display text-lg tracking-wider mb-2">SYNOPSIS</h2>
              <p className={`text-terra-muted text-sm leading-relaxed whitespace-pre-line ${!synopsisExpanded ? 'line-clamp-4' : ''}`}>
                {manhwa.synopsis}
              </p>
              {manhwa.synopsis?.length > 300 && (
                <button
                  onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                  className="text-terra-red text-sm font-medium mt-1 hover:underline"
                >
                  {synopsisExpanded ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CHAPTER LIST ═══ */}
        <section className="mt-12" id="chapter-list">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl tracking-wider">
              CHAPTERS <span className="text-terra-muted text-lg">({chapters.length})</span>
            </h2>
            <button
              onClick={() => setChapterSort(chapterSort === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1 text-sm text-terra-muted hover:text-terra-text transition-colors"
            >
              {chapterSort === 'desc' ? <HiSortDescending size={16} /> : <HiSortAscending size={16} />}
              {chapterSort === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          <div className="bg-terra-card rounded-xl border border-terra-border overflow-hidden">
            {displayChapters.map((ch) => (
              <Link
                key={ch._id}
                to={`/read/${slug}/${ch.chapterNumber}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-terra-bg-secondary transition-colors border-b border-terra-border last:border-b-0 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-semibold text-terra-text group-hover:text-terra-red transition-colors">
                    Chapter {ch.chapterNumber}
                  </span>
                  {ch.title && ch.title !== `Chapter ${ch.chapterNumber}` && (
                    <span className="text-sm text-terra-muted truncate">— {ch.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-terra-muted shrink-0">
                  <span className="hidden sm:inline">{formatViews(ch.views)} views</span>
                  <span className="hidden sm:inline">{formatDate(ch.uploadedAt)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Chapter pagination */}
          {totalChapterPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: totalChapterPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setChapterPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    chapterPage === i + 1
                      ? 'bg-terra-red text-white'
                      : 'bg-terra-card text-terra-muted hover:text-terra-text'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ═══ RELATED ═══ */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl tracking-wider mb-5">RELATED MANHWA</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((m) => (
                <ManhwaCard key={m._id} manhwa={m} />
              ))}
            </div>
          </section>
        )}

        {/* ═══ COMMUNITY ═══ */}
        <section className="mt-20 border-t border-terra-border pt-12">
            <CommentSection slug={slug} />
        </section>
      </div>
    </>
  );
}

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
