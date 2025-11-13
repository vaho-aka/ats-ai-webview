export interface ResumeImage {
  page_number: number;
  width: number;
  height: number;
  image_base64: string;
}

export interface ApiResponse {
  success?: boolean;
  message?: string;
  filename?: string;
  total_pages?: number;
  images: ResumeImage[];
  error?: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
}

export interface JobDescriptionData {
  title: string;
  description: string;
  requiredSkills: string[];
}

export interface ScoreData {
  overallScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  skillsMatch: number;
  experienceMatch: number;
  keywordMatch: number;
}

// Zustand interfaces
export interface DarkModeState {
  darkMode: boolean;
  changeTheme: () => void;
}

export interface ResumeFileUploadState {
  resumeFile: boolean;
}
