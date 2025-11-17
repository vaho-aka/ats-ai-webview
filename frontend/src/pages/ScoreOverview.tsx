import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

export const ScoreOverview: React.FC = () => {
  const score = useAppStore((s) => s.scoreData);

  if (!score) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-semibold">Aucune donnée des notes</h3>
        <p className="text-gray-500">
          Analyser des CV pour obtenir les notes ATS
        </p>
      </div>
    );
  }

  const overall = Math.round(score.score);

  return (
    <div className="space-y-6">
      <div className="rounded-xl shadow p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">Notes global ATS</h3>
        <div className="text-5xl font-bold text-blue-500">{overall}%</div>
        <p className="mt-3 text-gray-500">
          {overall >= 80
            ? 'Excellent Match'
            : overall >= 60
            ? 'Good Match'
            : 'Needs Improvement'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl shadow p-4">
          <h5 className="text-sm text-gray-500">
            Correspondance des compétences
          </h5>
          <div className="text-2xl font-bold">{score.skillsMatch ?? '-'}%</div>
        </div>
        <div className="rounded-xl shadow p-4">
          <h5 className="text-sm text-gray-500">Expérience correspondante</h5>
          <div className="text-2xl font-bold">
            {score.experienceMatch ?? '-'}%
          </div>
        </div>
        <div className="rounded-xl shadow p-4">
          <h5 className="text-sm text-gray-500">
            Correspondance des mots clés
          </h5>
          <div className="text-2xl font-bold">{score.keywordMatch ?? '-'}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl shadow p-6">
          <h4 className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-green-500" />
            Mots-clés correspondants
          </h4>
          <div className="space-y-2">
            {score.matchedKeywords.map((k, i) => (
              <div key={i} className="text-sm">
                {k}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl shadow p-6">
          <h4 className="flex items-center gap-2 mb-3">
            <XCircle className="text-red-500" />
            Mots-clés manquants
          </h4>
          <div className="space-y-2">
            {score.missingKeywords.map((k, i) => (
              <div key={i} className="text-sm">
                {k}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl shadow p-6">
        <h4 className="mb-3">Recommandations</h4>
        <ul className="space-y-2">
          {(score.recommendations ?? []).map((r, i) => (
            <li key={i} className="flex gap-2 items-start">
              <AlertCircle size={18} />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded flex items-center justify-center gap-2">
        <Download /> Exporter le Report (PDF)
      </button>
    </div>
  );
};

export default ScoreOverview;
