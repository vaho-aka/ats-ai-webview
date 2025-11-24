import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { uploadResumeAndJob } from '@/api/resumeApi';
import { Textarea } from './ui/textarea';

export default function UploadResume() {
  const fileRef = useRef(null);
  const [selected, setSelected] = useState<File[]>([]);
  const setTopRanked = useAppStore((s) => s.setTopRanked);
  const setUploadStatus = useAppStore((s) => s.setUploadStatus);

  const jobDescription = useAppStore((s) => s.job_description);
  const setJobDescription = useAppStore((s) => s.setJobDescription);
  const setJobId = useAppStore((s) => s.setJobId);
  const setJobTitle = useAppStore((s) => s.setJobTitle);
  const setJobCompetencecs = useAppStore((s) => s.setJobCompetencecs);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const arr = Array.from(e.target.files);
    setSelected(arr);
  };

  const onSubmit = async () => {
    if (selected.length === 0) return;
    try {
      setUploadStatus('uploading');
      const resp = await uploadResumeAndJob(selected, jobDescription);

      setUploadStatus('processing');

      setTopRanked(resp.top_ranked);
      setJobId(resp.job_id);
      setJobTitle(resp.job_title);
      setJobCompetencecs(resp.job_competences);
      setUploadStatus('success');
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
    }
  };

  return (
    <div className="rounded-xl flex flex-col gap-8">
      <div>
        <h3 className="font-semibold mb-2">Télécharger les CV (PDF)</h3>
        <div className="border-2 bg-gray-50 border-dashed rounded p-8 text-center">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={onFileChange}
            className="hidden"
            id="resume-file"
          />
          <label htmlFor="resume-file" className="cursor-pointer">
            <Upload className="mx-auto mb-3 text-neutral-500" size={40} />
            <div className="text-lg">
              {selected.length > 0
                ? `${selected.length} fichier(s) sélectionnés`
                : 'Déposez vos CV ou cliquez pour sélectionner'}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Formats PDF uniquement — vous pouvez en télécharger plusieurs.
            </div>
          </label>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Description du poste</h3>
        <Textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="h-36"
        />
      </div>

      <Button className="active:scale-95" onClick={onSubmit}>
        Analyser
      </Button>
    </div>
  );
}
