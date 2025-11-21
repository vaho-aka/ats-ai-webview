import axios from 'axios';
import type { Results } from '../interfaces/interfaces';

const API_ROOT = 'http://localhost:8000/';

export async function uploadResumeAndJob(
  files: File[],
  jobDescription: string
): Promise<{ success: string; top_five: Results[] }> {
  const form = new FormData();

  // Append all PDFs one by one
  files.forEach((file) => {
    form.append('resumes', file); // backend receives a list
  });

  form.append('job_description', jobDescription);

  const response = await axios.post(
    `${API_ROOT}/api/upload_and_evaluate/`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    }
  );

  return response.data;
}
