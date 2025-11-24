import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { State } from '../interfaces/interfaces';

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      job_id: 0,
      job_title: '',
      top_ranked: [],
      job_competences: [],
      job_description: '',
      uploadStatus: 'idle',
      selectedFile: [],

      setJobDescription: (text) => set({ job_description: text }),
      setTopRanked: (r) => set({ top_ranked: r }),
      setUploadStatus: (s) => set({ uploadStatus: s }),
      setSelectedFile: (file) => set({ selectedFile: file }),
      setJobId: (n) => set({ job_id: n }),
      setJobTitle: (text) => set({ job_title: text }),
      setJobCompetencecs: (skills) => set({ job_competences: skills }),

      reset: () =>
        set({
          job_id: 0,
          job_title: '',
          top_ranked: [],
          job_competences: [],
          job_description: '',
          uploadStatus: 'idle',
          selectedFile: [],
        }),
    }),
    {
      name: 'ats-store',

      // Persist only what you want to keep across refresh
      partialize: (state) => ({
        job_description: state.job_description,
        // uncomment this if you want top_ranked to persist:
        top_ranked: state.top_ranked,
        selectedFile: state.selectedFile,
        job_id: state.job_id,
        job_competences: state.job_competences,
        job_title: state.job_title,
      }),
    }
  )
);
