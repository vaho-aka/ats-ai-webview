import React from 'react';
import { Mail, Phone, Briefcase, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ResumeInsight: React.FC = () => {
  const resume = useAppStore((s) => s.resumeData);

  if (!resume) {
    return (
      <div className="text-center py-20">
        <FileText size={64} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold">Aucune donnée de CV</h3>
        <p className="text-gray-500">
          Téléchargez et analysez pour obtenir des informations sur les CV
        </p>
      </div>
    );
  }

  const initials = resume.name
    ? resume.name
        .split(' ')
        .map((n) => n[0])
        .join('')
    : '';

  return (
    <div className="space-y-6">
      <div className="rounded-xl shadow p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold">
          {initials}
        </div>
        <div>
          <h3 className="text-2xl font-bold">{resume.name}</h3>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Mail size={16} /> {resume.email}
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} /> {resume.phone}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Briefcase size={16} /> {resume.experience}
          </div>
        </div>
      </div>

      <div className="rounded-xl shadow p-6">
        <h4 className="font-semibold mb-3">Compétences</h4>
        <div className="flex flex-wrap gap-2">
          {resume.skills.map((s, i) => (
            <span key={i} className="px-3 py-1 bg-blue-100 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl shadow p-6">
        <h4 className="font-semibold mb-3">Éducation</h4>
        <p>{resume.education}</p>
      </div>
    </div>
  );
};

export default ResumeInsight;
