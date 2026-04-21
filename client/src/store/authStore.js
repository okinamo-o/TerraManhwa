import { create } from 'zustand';
import api from '../services/api';
import { useBookmarkStore } from './bookmarkStore';
import { useReadingProgressStore } from './readerStore';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => {
    set({ user, loading: false, initialized: true });
    if (user?.bookmarks) {
      useBookmarkStore.getState().setBookmarks(user.bookmarks.map(b => ({ id: b._id || b.id, slug: b.slug })));
    }
    if (user?.readingHistory) {
      const historyMap = {};
      user.readingHistory.forEach(h => {
        if (h.manhwaId?.slug) {
          historyMap[h.manhwaId.slug] = { 
            chapter: h.chapterId?.chapterNumber || 1, 
            page: h.lastPage, 
            updatedAt: h.updatedAt,
            chapterId: h.chapterId?._id,
            manhwaId: h.manhwaId?._id
          };
        }
      });
      useReadingProgressStore.getState().setAllProgress(historyMap);
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const user = res.data.user;
    set({ user, loading: false });
    if (user) get().setUser(user);
    return res.data;
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const user = res.data.user;
    set({ user, loading: false });
    if (user) get().setUser(user);
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) { /* ignore */ }
    set({ user: null });
    useBookmarkStore.getState().setBookmarks([]);
    useReadingProgressStore.getState().setAllProgress({});
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data.user;
      if (user) get().setUser(user);
      else set({ user: null, loading: false, initialized: true });
    } catch {
      set({ user: null, loading: false, initialized: true });
      useBookmarkStore.getState().setBookmarks([]);
      useReadingProgressStore.getState().setAllProgress({});
    }
  },
}));
