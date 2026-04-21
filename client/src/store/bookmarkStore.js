import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userService } from '../services/manhwaService';

export const useBookmarkStore = create(
  persist(
    (set, get) => ({
      bookmarks: [], // [{ id, slug }]
      
      isBookmarked: (slug) => get().bookmarks.some(b => b.slug === slug),

      setBookmarks: (bookmarks) => set({ bookmarks }),

      toggleBookmark: async (manhwa, user) => {
        const { bookmarks } = get();
        const exists = bookmarks.some(b => b.slug === manhwa.slug);
        
        // Optimistic Update
        const newBookmarks = exists
          ? bookmarks.filter((b) => b.slug !== manhwa.slug)
          : [...bookmarks, { id: manhwa._id, slug: manhwa.slug }];
        
        set({ bookmarks: newBookmarks });

        // Backend Sync if user is logged in
        if (user) {
          try {
            if (exists) {
              await userService.unbookmark(manhwa._id);
            } else {
              await userService.bookmark(manhwa._id);
            }
          } catch (err) {
            console.error('Failed to sync bookmark with server:', err);
            // Fallback? or just let it stay in local? 
            // For now, we trust local is better than nothing.
          }
        }
      },

      addBookmark: (manhwa) =>
        set((state) => ({
          bookmarks: state.bookmarks.some(b => b.slug === manhwa.slug)
            ? state.bookmarks
            : [...state.bookmarks, { id: manhwa._id, slug: manhwa.slug }],
        })),

      removeBookmark: (slug) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.slug !== slug),
        })),
    }),
    { name: 'terra-bookmarks' }
  )
);
