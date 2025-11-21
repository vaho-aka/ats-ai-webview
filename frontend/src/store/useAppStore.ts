import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { State } from '../interfaces/interfaces';

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      top_five: [],
      jobDescription: '',
      uploadStatus: 'idle',

      setJobDescription: (text) => set({ jobDescription: text }),
      setTopFive: (r) => set({ top_five: r }),
      setUploadStatus: (s) => set({ uploadStatus: s }),

      reset: () =>
        set({
          top_five: [],
          jobDescription: '',
          uploadStatus: 'idle',
        }),
    }),
    {
      name: 'ats-store',

      // Persist only what you want to keep across refresh
      partialize: (state) => ({
        jobDescription: state.jobDescription,
        // uncomment this if you want top_five to persist:
        top_five: state.top_five,
      }),
    }
  )
);
