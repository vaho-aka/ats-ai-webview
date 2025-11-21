import type { Results } from '@/interfaces/interfaces';
import ResumeScoreCard from './ResumeScoreCard';

type Props = {
  list: Results[];
};

export default function TopFiveRanking({ list }: Props) {
  return (
    <div className="">
      {list.map((cv, i) => (
        <ResumeScoreCard key={i} cv={cv} rank={i + 1} />
      ))}
    </div>
  );
}
