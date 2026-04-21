import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userService } from '../services/manhwaService';

export const useReaderStore = create(
  persist(
    (set) => ({
      mode: 'vertical',        // vertical | single | double
      // ... same as before
      background: 'black',
      imageFit: 'fit-width',
      pageGap: 4,
      autoScroll: false,
      autoScrollSpeed: 2,

      setMode: (mode) => set({ mode }),
      setDirection: (direction) => set({ direction }),
      setBackground: (background) => set({ background }),
      setImageFit: (imageFit) => set({ imageFit }),
      setPageGap: (pageGap) => set({ pageGap }),
      setAutoScroll: (autoScroll) => set({ autoScroll }),
      setAutoScrollSpeed: (autoScrollSpeed) => set({ autoScrollSpeed }),
    }),
    { name: 'terra-reader-settings' }
  )
);

export const useReadingProgressStore = create(
  persist(
    (set, get) => ({
      progress: {}, // { [slug]: { chapter, page, updatedAt, chapterId, manhwaId } }

      saveProgress: async (slug, chapter, page, extras = {}, user = null) => {
        const { manhwaId, chapterId } = extras;
        
        set((state) => ({
          progress: {
            ...state.progress,
            [slug]: { 
              chapter, 
              page, 
              updatedAt: Date.now(),
              chapterId: chapterId || state.progress[slug]?.chapterId,
              manhwaId: manhwaId || state.progress[slug]?.manhwaId
            },
          },
        }));

        // Sync with backend if user is logged in and we have IDs
        if (user && manhwaId && chapterId) {
          try {
            await userService.saveHistory({
              manhwaId,
              chapterId,
              lastPage: page
            });
          } catch (err) {
            console.error('Failed to sync reading history:', err);
          }
        }
      },

      getProgress: (slug) => get().progress[slug] || null,

      clearProgress: (slug) =>
        set((state) => {
          const newProgress = { ...state.progress };
          delete newProgress[slug];
          return { progress: newProgress };
        }),
        
      setAllProgress: (progress) => set({ progress })
    }),
    { name: 'terra-reading-progress' }
  )
);
