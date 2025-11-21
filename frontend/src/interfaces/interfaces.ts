export interface State {
  top_five: Results[];
  jobDescription: string;
  uploadStatus: UploadStatus;

  setJobDescription: (text: string) => void;
  setTopFive: (r: Results[]) => void;
  setUploadStatus: (s: UploadStatus) => void;
  reset: () => void;
}

export type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  top_five: Results[];
  jobDescription: string;
  uploadStatus: UploadStatus;
}

export interface ContactInfo {
  email: string;
  telephone: string;
  adresse: string;
}

export interface Identite {
  nom: string;
  contact: ContactInfo;
}

export interface ResumeExtractionResult {
  identite: Identite;
  competences: string[];
  resume_experience: string;
  job_competences: string[];
  job_title: string;
  score_sur_100: number;
}

export interface EvaluationResult {
  explication: string;
  recommendations: string[];
}

export interface CombinedResult
  extends ResumeExtractionResult,
    EvaluationResult {}

export interface Results {
  score_sur_100: number;
  identite: Identite;
  job_competences: string[];
  competences: string[];
  resume_experience: string;
  job_title: string;
}

export interface ATSApiResponse {
  success: boolean;
  top_five: Results[];
}

// Component Props
export interface ResumeCardProps {
  item: Results;
  onSelect?: (item: Results) => void;
}

export interface ScoreChartProps {
  score: number;
}
