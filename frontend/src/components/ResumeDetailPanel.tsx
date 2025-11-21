import { ScrollArea } from '@/components/ui/scroll-area';
import type { Results } from '@/interfaces/interfaces';

type Props = {
  cv: Results;
};

export default function ResumeDetailPanel({ cv }: Props) {
  if (!cv)
    return (
      <div className="text-gray-600">
        Sélectionnez un CV pour voir les détails…
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="font-semibold text-lg">{cv?.identite?.nom}</div>
      <div className="text-sm text-gray-500">{cv.job_title}</div>

      <div className="p-2 border rounded">
        <div className="text-sm font-medium">Résumé</div>
        <div className="text-sm text-gray-700 mt-1">{cv.resume_experience}</div>
      </div>

      <div className="p-2 border rounded">
        <div className="text-sm font-medium">Compétences</div>
        <div className="text-sm text-gray-700 mt-1">
          {(cv.competences || []).join(' • ')}
        </div>
      </div>

      <ScrollArea className="h-36 border rounded p-2">
        <pre className="text-xs">{JSON.stringify(cv, null, 2)}</pre>
      </ScrollArea>
    </div>
  );
}
