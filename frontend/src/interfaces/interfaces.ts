export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error';

export interface State {
  uploadStatus: UploadStatus;
  selectedFile: Result[];

  Candidats: Candidat[];
  offres: Offre[];

  job_id: number;
  job_title: string;
  top_ranked: Result[];
  job_description: string;
  job_competences: string[];

  setJobDescription: (text: string) => void;
  setSelectedFile: (file: Result[]) => void;
  setUploadStatus: (s: UploadStatus) => void;
  setTopRanked: (r: Result[]) => void;
  setJobId: (n: number) => void;
  setJobTitle: (text: string) => void;
  setJobCompetencecs: (skills: string[]) => void;
  setCondidats: (c: Candidat[]) => void;
  setOffres: (o: Offre[]) => void;

  reset: () => void;
}

export interface Result {
  candidat_id: number;
  cv_id: number;
  evaluation_id: number;
  score_sur_100: number;
  competences: string[];
  telephone: string;
  resume_experience: string;
  job_title: string;
  filename: string;
  nom: string;
  email: string;
}

export interface Candidat {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  localisation: string;
}

export interface Offre {
  id: number;
  title: string;
  company: string;
  location: string;
}
