import axios from 'axios';

const API_ROOT = 'http://localhost:8000';

export async function uploadResumeAndJob(
  files: File[],
  jobDescription: string
) {
  const form = new FormData();
  files.forEach((f) => form.append('resumes', f));
  form.append('job_description', jobDescription);

  const resp = await axios.post(`${API_ROOT}/api/upload_and_evaluate/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return resp.data;
}
