// src/interfaces/types.ts
export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  summary?: string;
  experience?: string;
  education?: string;
}

export interface ScoreData {
  score: number; // overall score 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations?: string[];
  skillsMatch?: number;
  experienceMatch?: number;
  keywordMatch?: number;
}

export type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  resumeData: ResumeData | null;
  jobDescription: string;
  scoreData: ScoreData | null;
  uploadStatus: UploadStatus;
}
