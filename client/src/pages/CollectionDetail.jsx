import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiHeart, HiEye, HiArrowLeft, HiCalendar, HiBadgeCheck, HiPencil, HiX, HiCheck } from 'react-icons/hi';
import { collectionService } from '../services/manhwaService';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function CollectionDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  const isOwner = user && collection?.owner?._id === user._id;

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetail = async () => {
      try {
        const res = await collectionService.getById(id);
        const col = res.data.data;
        setCollection(col);
        setLikesCount(col.likes?.length || 0);
        setLiked(user ? col.likes?.some(l => (l._id || l) === user._id) : false);
        setEditForm({ title: col.title, description: col.description || '' });
      } catch (err) {
        console.error('Failed to fetch collection detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) return toast.error('Login to like collections');
    try {
      const res = await collectionService.like(id);
      setLiked(res.data.data.liked);
      setLikesCount(res.data.data.likesCount);
    } catch {
      toast.error('Failed to like');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await collectionService.update(id, editForm);
      setCollection(prev => ({ ...prev, ...res.data.data }));
      setEditing(false);
      toast.success('Collection updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleRemoveManhwa = async (manhwaId) => {
    try {
      await collectionService.removeManhwa(id, manhwaId);
      setCollection(prev => ({
        ...prev,
        manhwas: prev.manhwas.filter(m => m._id !== manhwaId)
      }));
      toast.success('Removed from collection');
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;
  if (!collection) return <div className="min-h-screen flex flex-col items-center justify-center text-terra-muted">Collection not found. <Link to="/collections" className="text-terra-red mt-4 underline">Go back</Link></div>;

  return (
    <>
      <Helmet><title>{collection.title} — Community Collections</title></Helmet>

      <div className="relative">
        {/* Cinematic Backdrop */}
        <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden -z-10 opacity-30 blur-2xl">
           {collection.manhwas[0]?.cover && <img src={collection.manhwas[0].cover} className="w-full h-full object-cover scale-150" alt="" />}
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-terra-bg" />
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-12 pb-24">
          <Link to="/collections" className="inline-flex items-center gap-2 text-terra-muted hover:text-white mb-12 transition-colors">
            <HiArrowLeft /> Back to Explore
          </Link>

          <header className="flex flex-col md:flex-row items-start md:items-end gap-10 mb-16">
             <div className="w-48 h-72 md:w-56 md:h-80 bg-terra-card rounded-3xl overflow-hidden shadow-2xl rotate-3 border-4 border-terra-border flex-shrink-0">
                {collection.manhwas[0]?.cover && <img src={collection.manhwas[0].cover} className="w-full h-full object-cover" alt={collection.title} />}
             </div>

             <div className="flex-1">
                <div className="flex items-center gap-2 text-terra-red mb-3 font-bold text-xs uppercase tracking-widest">
                   <HiBadgeCheck size={18} /> Verified Collection
                </div>

                {editing ? (
                  <div className="space-y-4 mb-6">
                    <input
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-terra-card border border-terra-border rounded-xl px-4 py-3 text-3xl font-display tracking-tight focus:outline-none focus:border-terra-red"
                      placeholder="Collection title"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-terra-card border border-terra-border rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-terra-red h-24"
                      placeholder="Description..."
                    />
                    <div className="flex gap-3">
                      <Button variant="primary" size="sm" onClick={handleSaveEdit}><HiCheck size={16} /> Save</Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditing(false)}><HiX size={16} /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="font-display text-5xl md:text-7xl mb-6 tracking-tight leading-tight uppercase">{collection.title}</h1>
                    <p className="text-terra-muted text-xl max-w-2xl mb-8 leading-relaxed font-light italic">
                       "{collection.description || 'No description provided for this collection.'}"
                    </p>
                  </>
                )}

                <div className="flex flex-wrap items-center gap-4 mb-6">
                   {/* Like Button */}
                   <Button
                     variant={liked ? 'gold' : 'secondary'}
                     size="sm"
                     onClick={handleLike}
                     className="flex items-center gap-2"
                   >
                     <HiHeart size={18} className={liked ? 'text-terra-red animate-pulse' : ''} />
                     {liked ? 'Liked' : 'Like'} · {likesCount}
                   </Button>

                   {/* Edit Button (owner only) */}
                   {isOwner && !editing && (
                     <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="flex items-center gap-2">
                       <HiPencil size={16} /> Edit
                     </Button>
                   )}
                </div>

                <div className="flex flex-wrap items-center gap-8 text-sm uppercase tracking-widest font-bold">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-terra-red/20 flex items-center justify-center text-terra-red border border-terra-red/20">
                         {collection.owner.username[0].toUpperCase()}
                      </div>
                      <span className="text-white">{collection.owner.username}</span>
                   </div>
                   <span className="text-terra-muted flex items-center gap-2"><HiCalendar size={18} className="text-terra-red" /> {new Date(collection.createdAt).toLocaleDateString()}</span>
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
                  <div key={m._id} className="group relative flex flex-col bg-terra-card rounded-2xl overflow-hidden border border-terra-border hover:border-terra-red/50 transition-all duration-300">
                    <Link to={`/manhwa/${m.slug}`} className="flex flex-col flex-1">
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

                    {/* Remove button (owner only) */}
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveManhwa(m._id)}
                        className="absolute top-2 left-2 p-1.5 bg-black/80 backdrop-blur-md rounded-lg text-terra-muted hover:text-terra-red opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from collection"
                      >
                        <HiX size={14} />
                      </button>
                    )}
                  </div>
                ))}
             </div>
          </section>
        </div>
      </div>
    </>
  );
}
