import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiPlay, HiStar, HiEye, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import ManhwaCard from '../components/manhwa/ManhwaCard';
import ManhwaGrid from '../components/manhwa/ManhwaGrid';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { manhwaService } from '../services/manhwaService';
import { useReadingProgressStore } from '../store/readerStore';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [genres, setGenres] = useState([]);
  const [continueReading, setContinueReading] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const progress = useReadingProgressStore((s) => s.progress);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [featRes, trendRes, latestRes, popularRes, metaRes] = await Promise.all([
          manhwaService.getFeatured(),
          manhwaService.getTrending(),
          manhwaService.getLatest(),
          manhwaService.getPopular(),
          manhwaService.getMeta()
        ]);
        
        setFeatured(featRes.data?.data || []);
        setTrending(trendRes.data?.data || []);
        setLatest(latestRes.data?.data || []);
        setPopular(popularRes.data?.data || []);
        setGenres(metaRes.data?.genres || []);

        // Fetch "Continue Reading" data from backend
        const progressSlugs = Object.keys(progress);
        if (progressSlugs.length > 0) {
          try {
            const contRes = await manhwaService.getBySlugs(progressSlugs.slice(0, 10));
            const contData = (contRes.data?.data || []).map(m => ({
              ...m,
              lastChapter: progress[m.slug]?.chapter,
              lastPage: progress[m.slug]?.page
            }));
            setContinueReading(contData);
          } catch (err) {
            console.error('Failed to fetch continue reading list:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch home page data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [progress]);

  /* Hero auto-rotation */
  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (loading && featured.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-8">
          <div className="h-[60vh] bg-terra-card rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-terra-card rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const hero = featured[heroIndex];

  return (
    <>
      <Helmet>
        <title>TerraManhwa — Worlds Beyond Pages</title>
        <meta name="description" content="Read the best manhwa online for free. Discover trending titles, new releases, and popular series on TerraManhwa." />
      </Helmet>

      {/* ═══════════ HERO SECTION ═══════════ */}
      {hero && (
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden" id="hero-section">
          {featured.map((item, i) => (
            <div
              key={item._id}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              {/* Background */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.cover})`, filter: 'blur(40px) brightness(0.3)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-terra-bg via-terra-bg/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-terra-bg/90 via-transparent to-transparent" />
            </div>
          ))}

          {/* Hero Content */}
          <div className="relative z-20 max-w-7xl mx-auto px-4 h-full flex flex-col md:flex-row items-center md:items-end justify-between pb-24 pt-20 md:pt-0 gap-10">
            <div className="max-w-2xl animate-fade-in w-full md:w-2/3" key={`text-${heroIndex}`}>
              {/* Genres */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {hero?.genres?.slice(0, 3).map((g) => (
                  <Badge key={g} type="genre">{g}</Badge>
                ))}
              </div>

              {/* Title */}
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-4 leading-none text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                {hero?.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm font-bold tracking-widest uppercase mb-5 drop-shadow-md">
                {hero?.rating?.score && (
                  <span className="flex items-center gap-1.5 text-terra-gold bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-terra-gold/20">
                    <HiStar size={16} /> {hero.rating.score.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-white/80 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <HiEye size={16} /> {(hero?.views / 1e6).toFixed(1)}M VIEWS
                </span>
                <Badge type={hero?.status?.toLowerCase()}>{hero?.status}</Badge>
              </div>

              {/* Synopsis */}
              <p className="text-terra-muted text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
                {hero?.synopsis}
              </p>

              <div className="flex items-center gap-4">
                <Link to={`/manhwa/${hero?.slug}`}>
                  <Button variant="primary" size="lg" className="px-10 py-4 text-sm tracking-widest shadow-[0_0_30px_rgba(230,57,70,0.4)] hover:shadow-[0_0_40px_rgba(230,57,70,0.6)]">
                    <HiPlay size={20} className="mr-2 inline" /> READ NOW
                  </Button>
                </Link>
                <Link to={`/manhwa/${hero?.slug}`} className="hidden md:block">
                  <Button variant="secondary" size="lg" className="px-8 py-4 backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10">
                    DETAILS
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sharp Foreground Cover */}
            <div className="hidden md:block w-1/3 max-w-[260px] animate-fade-in z-30" key={`img-${heroIndex}`}>
               <img 
                 src={hero?.cover} 
                 alt={hero?.title} 
                 className="w-full rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] border border-white/10"
               />
            </div>

          {/* Hero nav dots */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'bg-terra-red w-8 shadow-[0_0_10px_rgba(230,57,70,0.8)]' : 'bg-white/30 w-2 hover:bg-white/60'}`}
                />
              ))}
            </div>

            {/* Hero arrows */}
            <button
              onClick={() => setHeroIndex((heroIndex - 1 + featured.length) % featured.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass flex items-center justify-center text-terra-muted hover:text-terra-text transition-colors"
            >
              <HiChevronLeft size={20} />
            </button>
            <button
              onClick={() => setHeroIndex((heroIndex + 1) % featured.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass flex items-center justify-center text-terra-muted hover:text-terra-text transition-colors"
            >
              <HiChevronRight size={20} />
            </button>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 space-y-16 py-12">
        {/* ═══════════ CONTINUE READING ═══════════ */}
        {continueReading.length > 0 && (
          <section id="continue-reading">
            <SectionHeader title="Continue Reading" subtitle="Pick up where you left off" />
            <div className="scroll-strip">
              {continueReading.map((m) => (
                <div key={m.slug} className="w-40">
                  <ManhwaCard manhwa={m} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════ TRENDING NOW ═══════════ */}
        {trending.length > 0 && (
          <section id="trending-section">
            <SectionHeader title="Trending Now" link="/browse?sort=views" />
            <div className="scroll-strip">
              {trending.map((m) => (
                <div key={m._id} className="w-40 md:w-48">
                  <ManhwaCard manhwa={m} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════ NEW RELEASES ═══════════ */}
        {latest.length > 0 && (
          <section id="new-releases-section">
            <SectionHeader title="New Releases" link="/browse?sort=latest" />
            <ManhwaGrid manhwaList={latest} loading={loading} />
          </section>
        )}

        {/* ═══════════ POPULAR (BENTO BOX) ═══════════ */}
        {popular.length > 0 && (
          <section id="popular-section">
            <SectionHeader title="Top Trending" subtitle="The most hyped series on the platform right now" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
               {/* 1st Place - Large Banner */}
               {popular[0] && (
                 <Link to={`/manhwa/${popular[0].slug}`} className="md:col-span-12 lg:col-span-8 group relative rounded-3xl overflow-hidden min-h-[300px] border border-terra-border hover:border-terra-gold/50 transition-all">
                    <img src={popular[0].cover} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={popular[0].title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
                       <div className="max-w-xl">
                          <span className="text-6xl font-display text-transparent bg-clip-text bg-gradient-to-br from-terra-gold to-yellow-600 block mb-2 drop-shadow-xl">#1</span>
                          <h3 className="text-3xl md:text-5xl font-display tracking-tight leading-none mb-3 group-hover:text-terra-gold transition-colors">{popular[0].title}</h3>
                          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white/70">
                             <span className="flex items-center gap-1"><HiStar className="text-terra-gold" size={14}/> {popular[0].rating?.score?.toFixed(1) || '4.8'}</span>
                             <span>Ch. {popular[0].latestChapter}</span>
                          </div>
                       </div>
                    </div>
                 </Link>
               )}

               <div className="md:col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {popular.slice(1, 5).map((m, i) => (
                    <Link
                      key={m._id}
                      to={`/manhwa/${m.slug}`}
                      className="flex items-center gap-4 p-4 rounded-3xl bg-terra-card/50 glass border border-white/5 hover:border-terra-red/50 transition-all group hover:-translate-x-1"
                    >
                      <span className="font-display text-4xl text-white/5 group-hover:text-terra-red transition-colors w-8 text-center">
                        {i + 2}
                      </span>
                      <img
                        src={m.cover}
                        alt={m.title}
                        className="w-16 h-24 rounded-xl object-cover shadow-lg"
                      />
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold truncate group-hover:text-terra-text transition-colors leading-tight mb-2 text-terra-text/80">{m.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-terra-muted">
                          <span className="flex items-center gap-1"><HiStar className="text-terra-gold" size={12} />{m.rating?.score?.toFixed(1) || '4.5'}</span>
                          <span>Ch. {m.latestChapter}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
               </div>
            </div>
          </section>
        )}

        <section id="genre-spotlight">
          <SectionHeader title="Genre Spotlight" subtitle="Explore by category" />
          <div className="flex flex-wrap gap-2">
            {genres
              .filter(g => typeof g === 'string')
              .map((genre) => (
                <Link
                  key={genre}
                  to={`/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-4 py-2 rounded-full bg-terra-card border border-terra-border text-sm text-terra-muted hover:text-terra-gold hover:border-terra-gold/50 transition-all font-medium"
                >
                  {genre}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SectionHeader({ title, subtitle, link }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-terra-border/50">
      <div className="flex gap-4 items-center">
        <div className="w-2 h-12 bg-gradient-to-b from-terra-red to-transparent rounded-full" />
        <div>
          <h2 className="font-display text-3xl md:text-4xl tracking-wide uppercase">{title}</h2>
          {subtitle && <p className="text-terra-muted text-sm font-light mt-1 tracking-wide">{subtitle}</p>}
        </div>
      </div>
      {link && (
        <Link to={link} className="text-[10px] uppercase tracking-[0.2em] font-bold text-terra-red hover:text-white transition-colors mt-4 md:mt-0 glass px-4 py-2 rounded-full border border-terra-red/20 hover:border-white/20">
          View All →
        </Link>
      )}
    </div>
  );
}
