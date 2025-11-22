import type { Results } from '@/interfaces/interfaces';
import ResumeScoreCard from './ResumeScoreCard';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

type Props = {
  list: Results[];
};

export default function TopFiveRanking({ list }: Props) {
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);

  const onSelectedHandler = (r: Results) => {
    console.log('Card clicked!');

    setSelectedFile([r]);
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      {list.map((cv, i) => (
        <Link
          key={cv.identite.nom}
          onClick={onSelectedHandler.bind(null, cv)}
          to={`/resume/${cv.identite.nom}`}
        >
          <ResumeScoreCard cv={cv} rank={i + 1} />
        </Link>
      ))}
    </div>
  );
}
