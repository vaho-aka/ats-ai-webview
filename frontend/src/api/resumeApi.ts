import axios from 'axios';
import type { ResumeData, ScoreData } from '../interfaces/interfaces';

const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:8000/';

export async function uploadResumeAndJob(
  file: File,
  jobDescription: string
): Promise<{ resume: ResumeData; score: ScoreData }> {
  const form = new FormData();
  form.append('resume', file);
  form.append('job_description', jobDescription);

  // Django endpoint: /api/analyze/
  const response = await axios.post(`${API_ROOT}/api/upload/analyze/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });
  // response.data = { resume: {...}, score: {...} }
  return response.data;
}
