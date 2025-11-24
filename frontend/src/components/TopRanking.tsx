import type { Result } from '@/interfaces/interfaces';
import ResumeScoreCard from './ResumeScoreCard';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

type Props = {
  list: Result[];
};

export default function TopFiveRanking({ list }: Props) {
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);

  const onSelectedHandler = (r: Result) => {
    setSelectedFile([r]);
  };

  return (
    <div className="flex flex-col gap-4">
      {list.map((cv: Result, i) => (
        <Link
          key={cv.nom}
          onClick={onSelectedHandler.bind(null, cv)}
          to={`/resume/${cv.nom}`}
        >
          <ResumeScoreCard cv={cv} rank={i + 1} />
        </Link>
      ))}
    </div>
  );
}
