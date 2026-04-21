import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HiCollection, HiPlus, HiHeart, HiEye, HiUserGroup } from 'react-icons/hi';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import OnboardingTrailer from '../components/ui/OnboardingTrailer';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    // Show trailer if first time
    if (!localStorage.getItem('trailer_seen')) {
      setShowTrailer(true);
    }

    const fetchCollections = async () => {
      try {
        const res = await api.get('/collections');
        setCollections(res.data.data);
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const closeTrailer = () => {
    localStorage.setItem('trailer_seen', 'true');
    setShowTrailer(false);
  };

  return (
    <>
      <Helmet><title>Community Collections — TerraManhwa</title></Helmet>
      
      {showTrailer && <OnboardingTrailer onClose={closeTrailer} />}

      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 text-terra-red mb-3">
              <HiUserGroup size={28} />
              <span className="text-xs font-bold uppercase tracking-[0.3em]">Community Hub</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-4">
              COLLECTIONS
            </h1>
            <p className="text-terra-muted max-w-xl text-lg leading-relaxed">
              Discover unique playlists curated by the most dedicated readers. 
              Find your next obsession through the eyes of the community.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => setShowTrailer(true)} className="px-6 py-3 rounded-full glass border border-white/10 text-sm font-bold hover:bg-white/5 transition-all">
              Watch Trailer
            </button>
            <Link to="/profile">
              <Button variant="primary" className="rounded-full px-8 py-3 flex items-center gap-2">
                <HiPlus size={20} /> Create Your Own
              </Button>
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((col) => (
              <Link 
                key={col._id} 
                to={`/collections/${col._id}`}
                className="group relative bg-terra-card rounded-3xl overflow-hidden border border-terra-border hover:border-terra-red/50 transition-all duration-500 hover:-translate-y-2 flex flex-col"
              >
                {/* Visual Header - Stacked covers effect */}
                <div className="relative h-48 bg-terra-bg flex items-center justify-center p-4 overflow-hidden">
                  <div className="absolute inset-0 opacity-20 grayscale scale-110 blur-sm">
                    <img src={col.manhwas[0]?.cover} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="relative flex -space-x-12">
                    {col.manhwas.slice(0, 3).map((m, i) => (
                        <div 
                          key={m._id} 
                          className="w-24 h-36 rounded-xl border-2 border-terra-bg shadow-2xl overflow-hidden transition-transform duration-500 group-hover:scale-110"
                          style={{ zIndex: 3-i, transform: `rotate(${i * 10 - 10}deg) translateY(${i * 5}px)` }}
                        >
                           <img src={m.cover} className="w-full h-full object-cover" alt={m.title} />
                        </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="w-6 h-6 rounded-full bg-terra-red/20 text-[10px] flex items-center justify-center font-bold text-terra-red">
                        {col.owner.username[0].toUpperCase()}
                     </div>
                     <span className="text-xs text-terra-muted">{col.owner.username}</span>
                  </div>
                  <h3 className="font-display text-2xl mb-2 group-hover:text-terra-red transition-colors line-clamp-1">{col.title}</h3>
                  <p className="text-sm text-terra-muted line-clamp-2 mb-6 flex-1">{col.description || 'A curated selection of epic manhwa.'}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] uppercase font-bold tracking-widest text-terra-muted">
                    <div className="flex items-center gap-4">
                       <span className="flex items-center gap-1.5"><HiCollection size={14} /> {col.manhwas.length} Items</span>
                       <span className="flex items-center gap-1.5"><HiHeart size={14} /> {col.likes?.length || 0}</span>
                    </div>
                    <span className="flex items-center gap-1.5"><HiEye size={14} /> {col.views} Views</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
