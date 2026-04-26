import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { userService, commentService, collectionService } from '../services/manhwaService';
import { useAuthStore } from '../store/authStore';
import { HiBookmark, HiClock, HiChat, HiBookOpen, HiUserCircle, HiCollection, HiPlus, HiX, HiTrash } from 'react-icons/hi';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ManhwaGrid from '../components/manhwa/ManhwaGrid';

const tabs = [
  { id: 'bookmarks', label: 'Bookmarks', icon: HiBookmark },
  { id: 'history', label: 'History', icon: HiClock },
  { id: 'collections', label: 'Collections', icon: HiCollection },
  { id: 'comments', label: 'Comments', icon: HiChat },
];

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [collections, setCollections] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCol, setNewCol] = useState({ title: '', description: '', manhwas: [], isPublic: true });
  const [error, setError] = useState(null);

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = !username || currentUser?.username === username;

  useEffect(() => {
    if (!targetUsername) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [userRes, commentsRes, collectionsRes] = await Promise.all([
          userService.getProfile(targetUsername),
          commentService.getUserComments(targetUsername),
          isOwnProfile ? collectionService.getMe() : collectionService.getAll()
        ]);
        
        setProfile(userRes.data.data || userRes.data);
        setComments(commentsRes.data.data || commentsRes.data || []);
        
        const allCols = collectionsRes.data.data || collectionsRes.data || [];
        setCollections(isOwnProfile ? allCols : allCols.filter(c => c.owner?.username === targetUsername));
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('User not found or server error');
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUsername, isOwnProfile]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    try {
      const res = await collectionService.create(newCol);
      setCollections([res.data.data, ...collections]);
      setShowCreate(false);
      setNewCol({ title: '', description: '', manhwas: [], isPublic: true });
    } catch (err) {
      alert('Failed to create collection: ' + err.message);
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!window.confirm('Delete this collection?')) return;
    try {
      await collectionService.delete(id);
      setCollections(collections.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const toggleManhwaInCol = (id) => {
    setNewCol(prev => ({
      ...prev,
      manhwas: prev.manhwas.includes(id) 
        ? prev.manhwas.filter(m => m !== id)
        : [...prev.manhwas, id]
    }));
  };

  if (!targetUsername) return (
    <div className="text-center py-20 px-4">
      <HiUserCircle size={64} className="mx-auto mb-4 text-terra-muted opacity-30" />
      <h2 className="text-2xl font-display mb-2">Login Required</h2>
      <p className="text-terra-muted mb-8">Please login to view your profile and collections.</p>
      <Link to="/login"><Button variant="primary">Go to Login</Button></Link>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );

  if (error || !profile) return (
    <div className="text-center py-20 px-4">
      <HiUserCircle size={64} className="mx-auto mb-4 text-terra-muted opacity-30" />
      <h2 className="text-2xl font-display mb-2">User Not Found</h2>
      <p className="text-terra-muted mb-8">{error}</p>
      <Link to="/"><Button variant="primary">Return Home</Button></Link>
    </div>
  );

  const stats = [
    { label: 'Chapters Read', value: profile.readingHistory?.length || 0, icon: HiBookOpen },
    { label: 'Bookmarks', value: profile.bookmarks?.length || 0, icon: HiBookmark },
    { label: 'Comments', value: comments.length, icon: HiChat },
  ];

  return (
    <>
      <Helmet><title>{profile.username} — TerraManhwa</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 py-8 pb-20 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-terra-red/20 border-2 border-terra-red/40 flex items-center justify-center text-4xl font-display text-terra-red overflow-hidden">
              {profile.avatar ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" /> : profile.username?.[0]?.toUpperCase()}
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-display text-4xl tracking-wider">{profile.username}</h1>
              <p className="text-terra-muted text-sm mt-1">
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              {profile.bio && <p className="text-terra-text mt-3 max-w-md">{profile.bio}</p>}
            </div>
          </div>
          {isOwnProfile && (
            <Link to="/settings">
              <Button variant="secondary" size="sm">Edit Profile</Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-terra-card border border-terra-border rounded-xl p-4 text-center">
              <stat.icon className="mx-auto text-terra-red mb-2" size={24} />
              <p className="font-display text-2xl">{stat.value}</p>
              <p className="text-xs text-terra-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 border-b border-terra-border overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-terra-red border-terra-red'
                  : 'text-terra-muted border-transparent hover:text-terra-text'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'bookmarks' && (
          profile.bookmarks?.length > 0 
            ? <ManhwaGrid manhwaList={profile.bookmarks} />
            : <div className="text-center py-12 text-terra-muted">
                <HiBookmark size={48} className="mx-auto mb-3 opacity-30" />
                <p>No bookmarks yet</p>
              </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {profile.readingHistory?.length > 0 ? (
              [...profile.readingHistory]
                .filter(h => h.manhwaId && h.chapterId) // Hide ghosts
                .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((h) => (
                <div key={h._id} className="bg-terra-card border border-terra-border rounded-xl p-4 flex gap-4 hover:border-terra-red transition-colors group">
                  <div className="w-16 h-20 rounded shadow-lg overflow-hidden shrink-0">
                    <img src={h.manhwaId?.cover} alt={h.manhwaId?.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <Link to={`/manhwa/${h.manhwaId?.slug}`} className="font-display tracking-wide block truncate group-hover:text-terra-red transition-colors">
                      {h.manhwaId?.title}
                    </Link>
                    <p className="text-sm text-terra-muted mt-1">
                      Chapter {h.chapterId?.chapterNumber || '??'} — Page {h.lastPage + 1}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between py-1">
                    <span className="text-[10px] uppercase tracking-widest text-terra-muted">
                      {new Date(h.updatedAt).toLocaleDateString()}
                    </span>
                    {h.manhwaId && h.chapterId && (
                      <Link to={`/read/${h.manhwaId.slug}/${h.chapterId.chapterNumber}`}>
                        <Button variant="primary" size="xs">Resume</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-terra-muted">
                <HiClock size={48} className="mx-auto mb-3 opacity-30" />
                <p>No reading history yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-terra-card/30 p-6 rounded-2xl border border-terra-border border-dashed">
               <div>
                  <h3 className="font-display text-xl">Community Playlists</h3>
                  <p className="text-xs text-terra-muted mt-1">Group your favorites into curated lists.</p>
               </div>
               {isOwnProfile && (
                 <Button onClick={() => setShowCreate(true)} variant="primary" size="sm" className="flex items-center gap-2">
                    <HiPlus /> Create New
                 </Button>
               )}
            </div>

            {/* Create Collection Form Overlay */}
            {showCreate && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
                 <form onSubmit={handleCreateCollection} className="max-w-xl w-full bg-terra-bg-secondary border border-terra-border rounded-3xl p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-display text-2xl tracking-widest uppercase">New Collection</h3>
                       <button type="button" onClick={() => setShowCreate(false)} className="text-terra-muted hover:text-white"><HiX size={24} /></button>
                    </div>

                    <div className="space-y-4 mb-8 text-left">
                       <div>
                          <label className="text-[10px] font-bold uppercase text-terra-muted mb-1 block">Title</label>
                          <input 
                            required
                            className="w-full bg-terra-card border border-terra-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-terra-red transition-all"
                            placeholder="e.g. My Ultimate Isekais"
                            value={newCol.title}
                            onChange={e => setNewCol({...newCol, title: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold uppercase text-terra-muted mb-1 block">Description</label>
                          <textarea 
                            className="w-full bg-terra-card border border-terra-border rounded-xl px-4 py-3 text-sm h-24 focus:outline-none focus:border-terra-red transition-all"
                            placeholder="Tell others what this list is about..."
                            value={newCol.description}
                            onChange={e => setNewCol({...newCol, description: e.target.value})}
                          />
                       </div>

                       <div>
                          <label className="text-[10px] font-bold uppercase text-terra-muted mb-3 block">Select Titles (From your Bookmarks)</label>
                          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                             {profile.bookmarks?.map(m => (
                                <div 
                                  key={m._id} 
                                  onClick={() => toggleManhwaInCol(m._id)}
                                  className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${newCol.manhwas.includes(m._id) ? 'border-terra-red scale-95 shadow-lg shadow-terra-red/20' : 'border-transparent opacity-50 gray scale hover:opacity-100 hover:grayscale-0'}`}
                                >
                                   <img src={m.cover} className="w-full h-full object-cover" alt={m.title} />
                                   {newCol.manhwas.includes(m._id) && (
                                     <div className="absolute inset-0 bg-terra-red/20 flex items-center justify-center">
                                        <div className="w-6 h-6 rounded-full bg-terra-red text-white flex items-center justify-center shadow-lg"><HiPlus className="rotate-45" /></div>
                                     </div>
                                   )}
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <Button type="submit" variant="primary" className="flex-1 py-3 text-sm font-bold uppercase tracking-widest">Publish Collection</Button>
                    </div>
                 </form>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {collections.length > 0 ? (
                collections.map((c) => (
                  <div key={c._id} className="relative group bg-terra-card border border-terra-border rounded-2xl p-4 hover:border-terra-red transition-all">
                    <Link to={`/collections/${c._id}`} className="flex gap-4">
                      <div className="w-16 h-20 bg-terra-bg rounded-lg border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                         {c.manhwas[0] ? <img src={c.manhwas[0]?.cover} className="w-full h-full object-cover" /> : <HiCollection size={24} className="text-terra-muted opacity-20" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <div className="flex items-center gap-2">
                           <h4 className="font-display tracking-wider group-hover:text-terra-red transition-colors truncate">{c.title}</h4>
                           <span className="px-1.5 py-0.5 rounded bg-terra-red/10 text-terra-red text-[8px] font-bold">{c.manhwas?.length || 0}</span>
                         </div>
                         <p className="text-[10px] text-terra-muted uppercase font-bold tracking-widest mt-1">{c.views} Views</p>
                      </div>
                    </Link>
                    {isOwnProfile && (
                      <button 
                        onClick={() => handleDeleteCollection(c._id)}
                        className="absolute top-4 right-4 p-2 text-terra-muted hover:text-terra-red opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <HiTrash size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-terra-muted bg-terra-card/20 rounded-2xl border border-terra-border border-dashed">
                  <HiCollection size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No collections created yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c._id} className="bg-terra-card border border-terra-border rounded-xl p-5 hover:border-terra-red transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <Link to={`/manhwa/${c.manhwaId?.slug}`} className="flex items-center gap-2 group/title">
                       <img src={c.manhwaId?.cover} className="w-6 h-8 rounded object-cover shadow" />
                       <span className="font-display text-sm tracking-wide group-hover/title:text-terra-red transition-colors">{c.manhwaId?.title}</span>
                    </Link>
                    <span className="text-[10px] text-terra-muted uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-terra-text leading-relaxed bg-black/20 p-3 rounded-lg border border-terra-border/50">
                    "{c.content}"
                  </p>
                  {c.parentId && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-terra-muted italic">
                       <p>Replied to a thread</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-terra-muted">
                <HiChat size={48} className="mx-auto mb-3 opacity-30" />
                <p>User hasn't left any comments yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
