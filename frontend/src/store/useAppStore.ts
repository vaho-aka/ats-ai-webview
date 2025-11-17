import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ResumeData,
  ScoreData,
  UploadStatus,
} from '../interfaces/interfaces';

interface State {
  resumeData: ResumeData | null;
  jobDescription: string;
  scoreData: ScoreData | null;
  uploadStatus: UploadStatus;

  setResumeData: (r: ResumeData | null) => void;
  setJobDescription: (text: string) => void;
  setScoreData: (s: ScoreData | null) => void;
  setUploadStatus: (s: UploadStatus) => void;
  reset: () => void;
}

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      resumeData: null,
      jobDescription: '',
      scoreData: null,
      uploadStatus: 'idle',

      setResumeData: (r) => set({ resumeData: r }),
      setJobDescription: (text) => set({ jobDescription: text }),
      setScoreData: (s) => set({ scoreData: s }),
      setUploadStatus: (s) => set({ uploadStatus: s }),
      reset: () =>
        set({
          resumeData: null,
          jobDescription: '',
          scoreData: null,
          uploadStatus: 'idle',
        }),
    }),
    {
      name: 'ats-store', // localStorage key
      partialize: (state) => ({
        resumeData: state.resumeData,
        jobDescription: state.jobDescription,
        scoreData: state.scoreData,
      }),
    }
  )
);
