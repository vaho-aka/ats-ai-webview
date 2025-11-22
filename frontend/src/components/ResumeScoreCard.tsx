import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import type { Results } from '@/interfaces/interfaces';
import { Badge } from './ui/badge';

type Props = {
  cv: Results;
  rank: number;
};

export default function ResumeScoreCard({ cv, rank }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className="p-4 justify-between cursor-pointer hover:bg-gray-50">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-lg">{cv.identite.nom}</div>
            <Badge
              className={` text-sm ${
                rank === 1
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-200 text-neutral-600'
              } `}
            >
              #{rank}
            </Badge>
          </div>

          <div className="text-sm text-gray-500">{cv.job_title}</div>
        </div>

        <div className="flex items-center gap-4">
          <Progress value={cv.score_sur_100} className="w-40 h-2" />
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="font-bold text-2xl"
          >
            {cv.score_sur_100}%
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
