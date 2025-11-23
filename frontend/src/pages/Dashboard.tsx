import UploadResume from '@/components/UploadResume';
import TopRanking from '@/components/TopRanking';
import { useAppStore } from '@/store/useAppStore';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function DashboardPage() {
  const topRanded = useAppStore((s) => s.top_ranked);
  console.log(topRanded);

  return (
    <>
      <LoadingOverlay />

      <div className="h-screen w-full grid grid-cols-12 bg-gray-100">
        <aside className="col-span-4 bg-white shadow-sm border-r p-6 flex flex-col gap-6">
          <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
          <UploadResume />
        </aside>

        <main className="col-span-8 p-6 overflow-y-auto">
          <h2 className="text-xl font-bold tracking-tight uppercase">
            Résultats
          </h2>
          <TopRanking list={topRanded} />
        </main>
      </div>
    </>
  );
}
