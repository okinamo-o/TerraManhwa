import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiSearch, HiMenu, HiX, HiBell, HiChevronDown } from 'react-icons/hi';
import Logo from './Logo';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { manhwaService, searchService, notificationService } from '../../services/manhwaService';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [genres, setGenres] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const genresRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
    setGenresOpen(false);
    setSuggestions([]);
    setSearchQuery('');
  }, [location]);

  // Fetch Genres for dropdown
  useEffect(() => {
    manhwaService.getMeta().then(res => setGenres(res.data.genres || [])).catch(() => {});
  }, []);

  // Notification Polling (every 60s)
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      notificationService.getAll()
        .then(res => {
          setNotifications(res.data.data);
          setUnreadNotifs(res.data.unreadCount);
        })
        .catch(() => {});
    };
    fetchNotifs();
    const inv = setInterval(fetchNotifs, 60000);
    return () => clearInterval(inv);
  }, [user]);

  // Suggestions logic
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      searchService.suggest(searchQuery)
        .then(res => setSuggestions(res.data.data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (genresRef.current && !genresRef.current.contains(e.target)) setGenresOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse Search' },
    { to: '/collections', label: 'Collections' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
        }`}
        id="main-navbar"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Logo />
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'text-terra-red'
                      : 'text-terra-muted hover:text-terra-text'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Genres Dropdown */}
              <div className="relative" ref={genresRef}>
                <button
                  onClick={() => setGenresOpen(!genresOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    genresOpen ? 'text-terra-red bg-terra-red/5' : 'text-terra-muted hover:text-terra-text'
                  }`}
                >
                  Genres <HiChevronDown size={14} className={`transition-transform duration-300 ${genresOpen ? 'rotate-180' : ''}`} />
                </button>

                {genresOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-terra-bg-secondary border border-terra-border rounded-xl shadow-2xl p-4 animate-slide-up">
                    <div className="grid grid-cols-2 gap-1 gap-x-2">
                       {genres.filter(Boolean).slice(0, 16).map(g => (
                         <Link 
                           key={g} 
                           to={`/browse?genre=${g.toLowerCase()}`}
                           className="px-2 py-1.5 text-xs text-terra-muted hover:text-terra-red hover:bg-terra-red/5 rounded transition-colors truncate"
                         >
                           {g}
                         </Link>
                       ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-terra-border text-center">
                       <Link to="/browse" className="text-[10px] text-terra-red font-bold uppercase tracking-widest hover:underline">View All Categories</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Search, Auth, Menu */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={searchRef}>
              <div className="flex items-center bg-terra-card border border-terra-border rounded-xl px-3 py-1.5 focus-within:border-terra-red transition-all group">
                <HiSearch className="text-terra-muted group-focus-within:text-terra-red" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Deep search..."
                  className="bg-transparent border-none text-sm text-terra-text placeholder:text-terra-muted focus:ring-0 w-32 sm:w-48 lg:w-64 ml-2"
                />
              </div>

              {/* Autocomplete Suggestions */}
              {searchQuery.length >= 2 && suggestions.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-terra-bg-secondary border border-terra-border rounded-xl shadow-2xl overflow-hidden animate-slide-up z-[60]">
                  {suggestions.map((s) => (
                    <Link
                      key={s.slug}
                      to={`/manhwa/${s.slug}`}
                      className="flex items-center gap-3 p-2.5 hover:bg-terra-card transition-colors group"
                    >
                      <div className="w-10 h-14 bg-terra-bg rounded overflow-hidden flex-shrink-0">
                        <img src={s.cover} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <span className="text-sm font-medium line-clamp-1 group-hover:text-terra-red transition-colors">{s.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className={`p-2 transition-colors relative ${notifOpen ? 'text-terra-red bg-terra-red/5 rounded-lg' : 'text-terra-muted hover:text-terra-text'}`}
                >
                  <HiBell size={20} />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-terra-red text-[8px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-terra-bg">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-terra-bg-secondary border border-terra-border rounded-xl shadow-2xl overflow-hidden animate-slide-up z-[60]">
                    <div className="px-4 py-3 border-b border-terra-border flex items-center justify-between">
                      <h4 className="text-sm font-display tracking-widest uppercase">NOTIFICATIONS</h4>
                      {unreadNotifs > 0 && (
                        <button 
                          onClick={() => notificationService.markAllRead().then(() => setUnreadNotifs(0))}
                          className="text-[10px] text-terra-red hover:underline font-bold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center text-xs text-terra-muted italic">All caught up!</div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n._id}
                            to={n.link || '/'}
                            onClick={() => !n.isRead && notificationService.markRead(n._id)}
                            className={`block p-4 border-b border-terra-border last:border-0 hover:bg-terra-card transition-colors ${!n.isRead ? 'bg-terra-red/5' : ''}`}
                          >
                            <p className="text-xs text-terra-text leading-relaxed tracking-wide mb-1">{n.message}</p>
                            <span className="text-[9px] text-terra-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth */}
            {user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-terra-card transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-terra-red/20 border border-terra-red/40 flex items-center justify-center text-sm font-bold text-terra-red">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <HiChevronDown size={14} className={`text-terra-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-terra-bg-secondary border border-terra-border rounded-xl shadow-xl overflow-hidden animate-slide-up">
                    <div className="px-4 py-3 border-b border-terra-border">
                      <p className="text-sm font-semibold">{user.username}</p>
                      <p className="text-xs text-terra-muted">{user.email}</p>
                    </div>
                    <Link to={`/profile/${user.username}`} className="block px-4 py-2.5 text-sm text-terra-muted hover:text-terra-text hover:bg-terra-card transition-colors">Profile</Link>
                    <Link to="/settings" className="block px-4 py-2.5 text-sm text-terra-muted hover:text-terra-text hover:bg-terra-card transition-colors">Settings</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2.5 text-sm text-terra-gold hover:bg-terra-card transition-colors">Admin Panel</Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2.5 text-sm text-terra-red hover:bg-terra-card transition-colors border-t border-terra-border"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-terra-muted hover:text-terra-text transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <HiX size={22} /> : <HiMenu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Full-screen Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-terra-bg/98 backdrop-blur-lg flex flex-col pt-20 px-6 animate-fade-in md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-3 rounded-xl text-lg font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-terra-red/10 text-terra-red'
                    : 'text-terra-muted hover:text-terra-text hover:bg-terra-card'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto mb-8 flex flex-col gap-3">
            {user ? (
              <>
                <Link to={`/profile/${user.username}`}>
                  <Button variant="secondary" size="lg" className="w-full">Profile</Button>
                </Link>
                <Button variant="ghost" size="lg" className="w-full text-terra-red" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="secondary" size="lg" className="w-full">Sign In</Button></Link>
                <Link to="/register"><Button variant="primary" size="lg" className="w-full">Register</Button></Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-terra-border">
        <div className="flex items-center justify-around h-14">
          {[
            { to: '/', icon: '🏠', label: 'Home' },
            { to: '/browse', icon: '📚', label: 'Browse' },
            { to: '/search', icon: '🔍', label: 'Search' },
            { to: user ? `/profile/${user?.username}` : '/login', icon: '👤', label: user ? 'Profile' : 'Login' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                location.pathname === item.to ? 'text-terra-red' : 'text-terra-muted'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
