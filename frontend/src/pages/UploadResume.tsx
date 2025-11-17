import React, { useRef, useState } from 'react';
import { Upload, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
// import { uploadResumeAndJob } from '../api/resumeApi';

export const UploadResume: React.FC = () => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const jobDescription = useAppStore((s) => s.jobDescription);
  const setJobDescription = useAppStore((s) => s.setJobDescription);
  const setResumeData = useAppStore((s) => s.setResumeData);
  const setScoreData = useAppStore((s) => s.setScoreData);
  const setUploadStatus = useAppStore((s) => s.setUploadStatus);

  const [file, setFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function notify(type: 'success' | 'error' | 'info', message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.type === 'application/pdf') {
      setFile(f);
      notify('success', 'Resume uploaded');
    } else if (f) {
      notify('error', 'Only PDF allowed');
    }
  };

  const onSubmit = async () => {
    if (!file || !jobDescription.trim()) {
      notify('error', 'Please add a PDF and job description');
      return;
    }
    setIsLoading(true);
    setUploadStatus('loading');

    try {
      // replace with the real API call
      // const { resume, score } = await uploadResumeAndJob(file, jobDescription)

      // --- mock fallback (keeps original behavior) ---
      await new Promise((r) => setTimeout(r, 1200));
      const resume = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 555 555 5555',
        skills: ['React', 'TypeScript', 'Django', 'Docker'],
        summary: '5+ years full-stack dev',
        experience: 'Fullstack experience at X',
        education: 'B.S.',
      };
      const score = {
        score: 85,
        matchedKeywords: ['React', 'TypeScript', 'Django'],
        missingKeywords: ['Kubernetes'],
        recommendations: ['Add cloud deployment details'],
        skillsMatch: 82,
        experienceMatch: 88,
        keywordMatch: 85,
      };
      // ---------------------------------------------

      setResumeData(resume);
      setScoreData(score);
      setUploadStatus('success');
      notify('success', 'Analysis complete');
    } catch (err) {
      console.log(err);
      setUploadStatus('error');
      notify('error', 'Failed to analyze resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-3 rounded ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="rounded-xl bg-white shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Télécharger le CV (PDF)</h3>
        <div className="border-2 bg-gray-50 border-dashed rounded p-8 text-center">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            className="hidden"
            id="resume-file"
          />
          <label htmlFor="resume-file" className="cursor-pointer">
            <Upload className="mx-auto mb-3 text-blue-500" size={40} />
            <div className="text-lg">
              {file
                ? file.name
                : 'Déposez votre CV ou cliquez pour sélectionner'}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Seul le format PDF est pris en charge.
            </div>
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Description du poste</h3>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Coller la description du poste..."
          className="w-full h-48 p-4 bg-gray-50 rounded border"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <TrendingUp size={16} />
        )}
        Analyser le CV
      </button>
    </div>
  );
};

export default UploadResume;
