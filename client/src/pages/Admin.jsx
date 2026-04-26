import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { HiCollection, HiUsers, HiEye, HiBookOpen, HiRefresh, HiPlus, HiSearch, HiTrash, HiPencil } from 'react-icons/hi';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { adminService, manhwaService } from '../services/manhwaService';
import Spinner from '../components/ui/Spinner';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [manhwaList, setManhwaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [scrapeInput, setScrapeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scraperLogs, setScraperLogs] = useState([]);
  
  // New Module States
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  useEffect(() => {
    let interval;
    if (activeTab === 'scraper') {
      const fetchLogs = async () => {
        try {
          const res = await adminService.getScraperLogs();
          setScraperLogs(res.data?.data || []);
        } catch (e) { /* ignore polling errors */ }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        const res = await adminService.getStats();
        setStats(res.data.data);
      } else if (activeTab === 'manhwa') {
        const res = await manhwaService.getAll({ limit: 100 });
        setManhwaList(res.data?.data || []);
      } else if (activeTab === 'users') {
        const res = await adminService.getUsers({ page, limit: 100 });
        setUsers(res.data?.data || []);
        setTotalPages(res.data?.totalPages || 1);
      } else if (activeTab === 'comments') {
        const res = await adminService.getComments({ page, limit: 100 });
        setComments(res.data?.data || []);
        setTotalPages(res.data?.totalPages || 1);
      } else if (activeTab === 'chapters') {
        const res = await adminService.getChapters({ page, limit: 100 });
        setChapters(res.data?.data || []);
        setTotalPages(res.data?.totalPages || 1);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const [sourceUrlInput, setSourceUrlInput] = useState('');

  const handleScrape = async () => {
    if (!scrapeInput.trim()) return toast.error('Enter a slug');
    try {
      setSubmitting(true);
      await adminService.scrape(scrapeInput.trim(), sourceUrlInput.trim() || undefined);
      toast.success(`Scrape triggered for ${scrapeInput}`);
      setScrapeInput('');
      setSourceUrlInput('');
    } catch (err) {
      toast.error('Failed to trigger scrape');
    } finally {
      setSubmitting(false);
    }
  };

  const [showFullScrapeConfirm, setShowFullScrapeConfirm] = useState(false);

  const handleFullScrape = async () => {
    console.log('Massive Scrape Action Started');
    if (!showFullScrapeConfirm) {
      setShowFullScrapeConfirm(true);
      return;
    }
    
    try {
      console.log('Sending request to /api/scraper/run...');
      setSubmitting(true);
      const res = await adminService.scrapeAll();
      console.log('Response from server:', res);
      toast.success('Massive Batch Scrape started in the background!');
      setShowFullScrapeConfirm(false);
    } catch (err) {
      console.error('Batch Scrape Request Failed:', err);
      toast.error(`Failed to start batch scrape: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHealMeta = async () => {
    try {
      setSubmitting(true);
      const res = await adminService.healMeta();
      toast.success(res.data?.message || 'Background metadata heal job started!');
    } catch (err) {
      toast.error(`Failed to start heal job: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteManhwa = async (id) => {
    if (!window.confirm('Are you sure you want to delete this manhwa?')) return;
    try {
      await manhwaService.delete(id);
      toast.success('Manhwa deleted');
      setManhwaList(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const handleUserRole = async (id, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await adminService.updateRole(id, newRole);
      toast.success('User role updated');
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await adminService.deleteUser(id);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const deleteComment = async (id) => {
    if (!window.confirm('Soft-delete this comment?')) return;
    try {
      await adminService.deleteComment(id);
      toast.success('Comment deleted');
      setComments(prev => prev.map(c => c._id === id ? { ...c, isDeleted: true, content: '[Comment removed by Admin]' } : c));
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const deleteChapter = async (id) => {
    if (!window.confirm('Delete this chapter permanently?')) return;
    try {
      await adminService.deleteChapter(id);
      toast.success('Chapter deleted');
      setChapters(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'manhwa', label: 'Manhwa' },
    { id: 'chapters', label: 'Chapters' },
    { id: 'users', label: 'Users' },
    { id: 'scraper', label: 'Scraper' },
    { id: 'comments', label: 'Comments' },
  ];

  const statsData = stats ? [
    { label: 'Total Manhwa', value: stats.manhwaCount.toLocaleString(), icon: HiCollection, color: 'text-terra-red' },
    { label: 'Total Chapters', value: stats.chapterCount.toLocaleString(), icon: HiBookOpen, color: 'text-terra-gold' },
    { label: 'Total Users', value: stats.userCount.toLocaleString(), icon: HiUsers, color: 'text-blue-400' },
    { label: 'Comments', value: stats.commentCount.toLocaleString(), icon: HiEye, color: 'text-green-400' },
  ] : [];

  return (
    <>
      <Helmet><title>Admin — TerraManhwa</title></Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="font-display text-4xl tracking-wider mb-2">ADMIN PANEL</h1>
        <p className="text-terra-muted mb-8">Manage your TerraManhwa platform</p>

        <div className="flex gap-1 mb-8 overflow-x-auto border-b border-terra-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id ? 'text-terra-red border-terra-red' : 'text-terra-muted border-transparent hover:text-terra-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statsData.map((stat) => (
                  <div key={stat.label} className="bg-terra-card border border-terra-border rounded-xl p-5">
                    <stat.icon className={`${stat.color} mb-2`} size={24} />
                    <p className="font-display text-3xl">{stat.value}</p>
                    <p className="text-xs text-terra-muted mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'manhwa' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="relative">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-terra-muted" size={16} />
                    <input placeholder="Search library..." className="pl-9 pr-4 py-2 bg-terra-card border border-terra-border rounded-lg text-sm text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red w-64" />
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setAddModal(true)}>
                    <HiPlus size={16} /> Add Manhwa
                  </Button>
                </div>
                <div className="bg-terra-card border border-terra-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-terra-border">
                      <th className="text-left px-4 py-3 text-terra-muted font-medium">Title</th>
                      <th className="text-left px-4 py-3 text-terra-muted font-medium hidden md:table-cell">Status</th>
                      <th className="text-left px-4 py-3 text-terra-muted font-medium hidden md:table-cell">Chapters</th>
                      <th className="text-left px-4 py-3 text-terra-muted font-medium hidden md:table-cell">Views</th>
                      <th className="text-right px-4 py-3 text-terra-muted font-medium">Actions</th>
                    </tr></thead>
                    <tbody>
                      {manhwaList.map((m) => (
                        <tr key={m._id} className="border-b border-terra-border last:border-b-0 hover:bg-terra-bg-secondary transition-colors">
                          <td className="px-4 py-3 font-medium">{m.title}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`px-2 py-0.5 rounded text-[10px] items-center text-white ${m.status?.toLowerCase() === 'completed' ? 'bg-green-500' : 'bg-terra-red'}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-terra-muted hidden md:table-cell">{m.latestChapter || 0}</td>
                          <td className="px-4 py-3 text-terra-muted hidden md:table-cell">{((m.views || 0) / 1e6).toFixed(1)}M</td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-terra-muted hover:text-terra-text mr-2"><HiPencil size={16} /></button>
                            <button onClick={() => deleteManhwa(m._id)} className="text-terra-muted hover:text-terra-red"><HiTrash size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'scraper' && (
              <div className="space-y-6">
                <div className="bg-terra-card border border-terra-border rounded-xl p-5 border-l-4 border-l-terra-gold">
                  <h3 className="font-display tracking-wider mb-1 text-terra-gold">FULL DATABASE SEED</h3>
                  <p className="text-xs text-terra-muted mb-4 uppercase tracking-tighter">Use this only for initial population</p>
                  <Button 
                    variant={showFullScrapeConfirm ? "danger" : "outline"} 
                    className={`w-full ${showFullScrapeConfirm ? "" : "border-terra-gold/30 text-terra-gold hover:bg-terra-gold/10"}`} 
                    onClick={handleFullScrape} 
                    loading={submitting}
                  >
                    {showFullScrapeConfirm ? "⚠️ Are you sure? Click again to start" : "Trigger Massive Batch Scrape (4,000+ Titles)"}
                  </Button>
                  {showFullScrapeConfirm && (
                    <button 
                      onClick={() => setShowFullScrapeConfirm(false)} 
                      className="w-full text-center text-[10px] text-terra-muted mt-2 hover:text-terra-text transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="bg-terra-card border border-terra-border rounded-xl p-5 border-l-4 border-l-terra-red">
                  <h3 className="font-display tracking-wider mb-1 text-terra-red">HEAL ALL METADATA</h3>
                  <p className="text-xs text-terra-muted mb-4 uppercase tracking-tighter">Fixes genres and statuses for all ongoing manhwa</p>
                  <Button 
                    variant="primary" 
                    className="w-full" 
                    onClick={handleHealMeta} 
                    loading={submitting}
                  >
                    Trigger Background Heal Job
                  </Button>
                </div>

                <div className="bg-terra-card border border-terra-border rounded-xl p-5">
                  <h3 className="font-display tracking-wider mb-3">SINGLE SCRAPE</h3>
                  <p className="text-sm text-terra-muted mb-5">Manually trigger the indexing system for a specific title.</p>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        value={scrapeInput}
                        onChange={(e) => setScrapeInput(e.target.value)}
                        placeholder="Enter library slug (e.g., solo-leveling)"
                        className="flex-1 px-4 py-2.5 bg-terra-bg border border-terra-border rounded-lg text-sm text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red"
                      />
                      <Button variant="primary" size="sm" onClick={handleScrape} loading={submitting}>Trigger Scrape</Button>
                    </div>
                    <div className="relative">
                      <input
                        value={sourceUrlInput}
                        onChange={(e) => setSourceUrlInput(e.target.value)}
                        placeholder="Optional: Override Source URL (e.g., https://kingofshojo.com/manga/slug/)"
                        className="w-full px-4 py-2.5 bg-terra-bg border border-terra-border rounded-lg text-xs text-terra-text placeholder:text-terra-muted/50 focus:outline-none focus:border-terra-red"
                      />
                    </div>
                  </div>
                </div>

                {/* ═══ LIVE LOGS CONSOLE ═══ */}
                <div className="bg-[#0a0a0a] border border-terra-border rounded-xl overflow-hidden font-mono text-xs shadow-inner animate-fade-in">
                  <div className="bg-terra-bg-secondary border-b border-terra-border px-4 py-2 flex items-center justify-between">
                    <span className="text-terra-muted uppercase tracking-wider font-semibold">Live System Logs</span>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-terra-red animate-pulse" />
                      <div className="w-2.5 h-2.5 rounded-full bg-terra-gold" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                  </div>
                  <div className="p-4 h-80 overflow-y-auto space-y-2">
                    {scraperLogs.length === 0 ? (
                      <div className="text-terra-muted flex items-center gap-2">
                        <Spinner size="sm" /> Waiting for system events...
                      </div>
                    ) : (
                      scraperLogs.map((log) => (
                        <div key={log._id} className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-2 hover:bg-white/5 rounded border-b border-white/5 last:border-0 transition-colors group">
                          <span className="text-terra-muted shrink-0 sm:w-24 group-hover:text-terra-text transition-colors">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                          <span className={`shrink-0 sm:w-24 font-bold ${log.status === 'success' ? 'text-green-400' : log.status === 'error' ? 'text-terra-red' : 'text-amber-400'}`}>
                            [{log.status.toUpperCase()}]
                          </span>
                          <span className="text-terra-gold/70 shrink-0 sm:w-24">({log.type})</span>
                          <span className="text-white/80 flex-1 leading-relaxed">
                            {log.message || `Processed ${log.itemsProcessed} items in ${(log.duration / 1000).toFixed(1)}s`}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-terra-card border border-terra-border rounded-xl overflow-hidden animate-fade-in">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-terra-border">
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">User</th>
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">Joined</th>
                    <th className="text-right px-4 py-3 text-terra-muted font-medium">Actions</th>
                  </tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-terra-border last:border-b-0 hover:bg-terra-bg-secondary transition-colors">
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full overflow-hidden bg-terra-border shrink-0"><img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" /></div>
                           {u.username}
                        </td>
                        <td className="px-4 py-3">
                           <span className={`px-2 py-0.5 rounded text-[10px] items-center text-white ${u.role === 'admin' ? 'bg-terra-gold' : 'bg-terra-border'}`}>
                             {u.role.toUpperCase()}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-terra-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleUserRole(u._id, u.role)} className="text-terra-muted hover:text-terra-gold mr-3 text-[10px] uppercase font-bold tracking-widest border border-terra-border hover:border-terra-gold px-2 py-1 rounded transition-colors">Toggle Role</button>
                          <button onClick={() => deleteUser(u._id)} className="text-terra-muted hover:text-terra-red"><HiTrash size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="bg-terra-card border border-terra-border rounded-xl overflow-hidden animate-fade-in">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-terra-border">
                    <th className="text-left px-4 py-3 text-terra-muted font-medium w-1/2">Comment</th>
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">Manhwa</th>
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">Author</th>
                    <th className="text-right px-4 py-3 text-terra-muted font-medium">Actions</th>
                  </tr></thead>
                  <tbody>
                    {comments.map((c) => (
                      <tr key={c._id} className={`border-b border-terra-border last:border-b-0 hover:bg-terra-bg-secondary transition-colors ${c.isDeleted ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3"><p className="line-clamp-2">{c.content}</p></td>
                        <td className="px-4 py-3 text-terra-muted text-xs">{c.manhwaId?.title || 'Unknown'}</td>
                        <td className="px-4 py-3 text-terra-muted text-xs">{c.userId?.username || 'Unknown'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteComment(c._id)} disabled={c.isDeleted} className="text-terra-muted hover:text-terra-red disabled:opacity-50 disabled:hover:text-terra-muted"><HiTrash size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'chapters' && (
              <div className="bg-terra-card border border-terra-border rounded-xl overflow-hidden animate-fade-in">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-terra-border">
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">Manhwa</th>
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">Chapter</th>
                    <th className="text-left px-4 py-3 text-terra-muted font-medium">Added</th>
                    <th className="text-right px-4 py-3 text-terra-muted font-medium">Actions</th>
                  </tr></thead>
                  <tbody>
                    {chapters.map((c) => (
                      <tr key={c._id} className="border-b border-terra-border last:border-b-0 hover:bg-terra-bg-secondary transition-colors">
                        <td className="px-4 py-3 font-medium flex items-center gap-3">
                           {c.manhwaId?.cover && <img src={c.manhwaId.cover} className="w-8 h-10 object-cover rounded" />}
                           {c.manhwaId?.title || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-terra-red font-bold">Ch. {c.chapterNumber}</td>
                        <td className="px-4 py-3 text-terra-muted">{new Date(c.addedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteChapter(c._id)} className="text-terra-muted hover:text-terra-red"><HiTrash size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {['users', 'comments', 'chapters'].includes(activeTab) && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-terra-card border border-terra-border rounded-xl">
                <span className="text-sm text-terra-muted">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}

        <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New Manhwa" maxWidth="max-w-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-terra-muted mb-1.5 block">Title</label>
                <input className="w-full px-4 py-2.5 bg-terra-bg border border-terra-border rounded-lg text-terra-text text-sm focus:outline-none focus:border-terra-red" />
              </div>
              <div>
                <label className="text-sm text-terra-muted mb-1.5 block">Author</label>
                <input className="w-full px-4 py-2.5 bg-terra-bg border border-terra-border rounded-lg text-terra-text text-sm focus:outline-none focus:border-terra-red" />
              </div>
            </div>
            <div>
              <label className="text-sm text-terra-muted mb-1.5 block">Synopsis</label>
              <textarea rows={4} className="w-full px-4 py-2.5 bg-terra-bg border border-terra-border rounded-lg text-terra-text text-sm focus:outline-none focus:border-terra-red resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { setAddModal(false); toast.success('Manhwa added!'); }}>Add Manhwa</Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
