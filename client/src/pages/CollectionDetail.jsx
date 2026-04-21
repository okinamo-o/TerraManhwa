import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiHeart, HiEye, HiArrowLeft, HiCalendar, HiBadgeCheck } from 'react-icons/hi';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';

export default function CollectionDetail() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/collections/${id}`);
        setCollection(res.data.data);
      } catch (err) {
        console.error('Failed to fetch collection detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;
  if (!collection) return <div className="min-h-screen flex flex-col items-center justify-center text-terra-muted">Collection not found. <Link to="/collections" className="text-terra-red mt-4 underline">Go back</Link></div>;

  return (
    <>
      <Helmet><title>{collection.title} — Community Collections</title></Helmet>

      <div className="relative">
        {/* Cinematic Backdrop */}
        <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden -z-10 opacity-30 blur-2xl">
           <img src={collection.manhwas[0]?.cover} className="w-full h-full object-cover scale-150" alt="" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-terra-bg" />
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-12 pb-24">
          <Link to="/collections" className="inline-flex items-center gap-2 text-terra-muted hover:text-white mb-12 transition-colors">
            <HiArrowLeft /> Back to Explore
          </Link>

          <header className="flex flex-col md:flex-row items-start md:items-end gap-10 mb-16">
             <div className="w-48 h-72 md:w-56 md:h-80 bg-terra-card rounded-3xl overflow-hidden shadow-2xl rotate-3 border-4 border-terra-border flex-shrink-0">
                <img src={collection.manhwas[0]?.cover} className="w-full h-full object-cover" alt={collection.title} />
             </div>

             <div className="flex-1">
                <div className="flex items-center gap-2 text-terra-red mb-3 font-bold text-xs uppercase tracking-widest">
                   <HiBadgeCheck size={18} /> Verified Collection
                </div>
                <h1 className="font-display text-5xl md:text-7xl mb-6 tracking-tight leading-tight uppercase">{collection.title}</h1>
                <p className="text-terra-muted text-xl max-w-2xl mb-8 leading-relaxed font-light italic">
                   "{collection.description || 'No description provided for this collection.'}"
                </p>

                <div className="flex flex-wrap items-center gap-8 text-sm uppercase tracking-widest font-bold">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-terra-red/20 flex items-center justify-center text-terra-red border border-terra-red/20">
                         {collection.owner.username[0].toUpperCase()}
                      </div>
                      <span className="text-white">{collection.owner.username}</span>
                   </div>
                   <span className="text-terra-muted flex items-center gap-2"><HiCalendar size={18} className="text-terra-red" /> {new Date(collection.createdAt).toLocaleDateString()}</span>
                   <span className="text-terra-muted flex items-center gap-2 text-terra-red"><HiHeart size={18} /> {collection.likes?.length || 0} Favorites</span>
                   <span className="text-terra-muted flex items-center gap-2"><HiEye size={18} className="text-terra-red" /> {collection.views} Reads</span>
                </div>
             </div>
          </header>

          <section>
             <h2 className="font-display text-3xl mb-8 flex items-center gap-4">
                CURATED TITLES <span className="h-0.5 flex-1 bg-terra-border" />
                <span className="text-terra-red font-bold text-lg">{collection.manhwas.length} MANHWA</span>
             </h2>

             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {collection.manhwas.map((m) => (
                  <Link 
                    key={m._id} 
                    to={`/manhwa/${m.slug}`}
                    className="group flex flex-col bg-terra-card rounded-2xl overflow-hidden border border-terra-border hover:border-terra-red/50 transition-all duration-300 pointer-events-auto"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                       <img src={m.cover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={m.title} />
                       <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-terra-red">
                          ★ {m.rating?.score?.toFixed(1) || '4.5'}
                       </div>
                    </div>
                    <div className="p-4 flex flex-col gap-1 items-center text-center">
                       <h3 className="text-sm font-bold truncate group-hover:text-terra-red transition-colors w-full">{m.title}</h3>
                       <span className="text-[10px] text-terra-muted uppercase tracking-widest font-bold">Ch. {m.latestChapter}</span>
                    </div>
                  </Link>
                ))}
             </div>
          </section>
        </div>
      </div>
    </>
  );
}
