import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { State } from '../interfaces/interfaces';

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      top_ranked: [],
      jobDescription: '',
      uploadStatus: 'idle',
      selectedFile: [],

      setJobDescription: (text) => set({ jobDescription: text }),
      setTopFive: (r) => set({ top_ranked: r }),
      setUploadStatus: (s) => set({ uploadStatus: s }),
      setSelectedFile: (file) => set({ selectedFile: file }),

      reset: () =>
        set({
          top_ranked: [],
          jobDescription: '',
          uploadStatus: 'idle',
        }),
    }),
    {
      name: 'ats-store',

      // Persist only what you want to keep across refresh
      partialize: (state) => ({
        jobDescription: state.jobDescription,
        // uncomment this if you want top_ranked to persist:
        top_ranked: state.top_ranked,
        selectedFile: state.selectedFile,
      }),
    }
  )
);
