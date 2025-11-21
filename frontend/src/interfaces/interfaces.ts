export interface Results {
  score_sur_100: string;
  competences: string[];
  identite: {
    nom: string;
    contact: {
      email: string;
      telephone: string;
      adresse: string;
    };
  };
}

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
