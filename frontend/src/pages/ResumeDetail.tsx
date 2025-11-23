import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, Mail, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { useEffect, useState } from 'react';

export default function ResumeDetail() {
  const nav = useNavigate();
  const selectedFile = useAppStore((s) => s.selectedFile);
  const cv = selectedFile[0];
  const jobDesc = useAppStore((s) => s.jobDescription);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start = 0;
    const interval = setInterval(() => {
      start += 1;
      setProgress(start);
      if (start >= cv.score_sur_100) clearInterval(interval);
    }, 15);

    return () => clearInterval(interval);
  }, [cv.score_sur_100]);

  if (!cv)
    return (
      <div className="p-20 text-center text-gray-500">
        Aucun résultat sélectionné.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => nav(-1)}>
          <ArrowLeft className="text-gray-600 hover:text-black" />
        </button>
        <h1 className="text-2xl font-semibold">Détails du CV</h1>
      </div>

      {/* TOP METRIC BAR */}
      <Card className="p-6 flex flex-row items-center justify-between mb-6">
        <div className="flex flex-col gap-2">
          <div className="text-2xl mb-8 font-bold">{cv.identite.nom}</div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness />
            <p className="text-gray-600">{cv.job_title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone />
            <p className="text-gray-600">{cv.identite.contact.telephone}</p>
          </div>
          <div className="flex items-center gap-2">
            <Mail />
            <a
              href={`mailto:${cv.identite.contact.email}`}
              className="text-gray-600"
            >
              {cv.identite.contact.email}
            </a>
          </div>
        </div>

        <div className="w-40 h-40">
          <CircularProgressbar
            value={progress}
            maxValue={100}
            text={`${cv.score_sur_100}%`}
            styles={buildStyles({
              textSize: '18px',
              pathTransitionDuration: 0.8,
              pathColor: `oklch(37.1% 0 0)`,
              textColor: '#222',
              trailColor: '#eee',
            })}
          />
        </div>
      </Card>

      {/* EXPERIENCE SUMMARY */}
      <Card className="p-5 mb-6">
        <h3 className="font-semibold mb-2">Résumé de l'expérience</h3>
        <p className="text-gray-700">{cv.resume_experience}</p>
      </Card>

      {/* SKILLS MATCH */}
      <Card className="p-5 mb-6">
        <h3 className="font-semibold mb-2">Compétences</h3>

        <div className="flex flex-wrap gap-2">
          {cv.competences.map((skill: string, i: number) => {
            const isMatch = cv.job_competences
              .map((jc: string) => jc.toLowerCase())
              .includes(skill.toLowerCase());

            return (
              <span
                key={i}
                className={
                  `px-3 py-1 rounded text-sm border ` +
                  (isMatch
                    ? 'bg-neutral-100 border-neutral-500 text-neutral-700 font-semibold'
                    : 'bg-gray-100 border-gray-300 text-gray-600')
                }
              >
                {skill}
              </span>
            );
          })}
        </div>
      </Card>

      {/* JOB DESCRIPTION */}
      <Card className="p-5 mb-6">
        <h2 className="font-semibold mb-2">Description du poste</h2>

        <p className="text-gray-700 whitespace-pre-line">{jobDesc}</p>
      </Card>
    </div>
  );
}
