import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Results } from '../interfaces/interfaces';

type Props = {
  cv: Results;
  rank: number;
  onSelect?: (cv: Results) => void;
};

export default function ResumeScoreCard({ cv, rank, onSelect }: Props) {
  return (
    <Card
      className="p-4 flex items-center justify-between cursor-pointer"
      onClick={() => onSelect?.(cv)}
    >
      <CardHeader>
        <CardTitle className="font-semibold text-lg">
          {cv.identite.nom}
        </CardTitle>
        <div className="text-sm text-gray-500">
          {cv.identite.contact.telephone}
        </div>
      </CardHeader>

      <CardContent className="flex items-center gap-4">
        <div className="font-bold text-xl">{cv.score_sur_100}/100</div>
        <Progress value={cv.score_sur_100} className="w-40 h-2" />
        <Badge variant={rank === 1 ? 'default' : 'secondary'}>#{rank}</Badge>
      </CardContent>
    </Card>
  );
}
