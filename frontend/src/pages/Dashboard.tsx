import UploadResume from '@/components/UploadResume';
import TopFiveRanking from '@/components/TopFiveRanking';
// import ResumeDetailPanel from '@/components/ResumeDetailPanel';
import { useAppStore } from '@/store/useAppStore';

export default function DashboardPage() {
  const topFive = useAppStore((s) => s.top_five);

  return (
    <div className="h-screen w-full grid grid-cols-12 bg-gray-100">
      <aside className="col-span-4 bg-white shadow-sm border-r p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold tracking-tight">ATS Dashboard</h2>
        <UploadResume />
      </aside>

      <main className="col-span-8 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          Résultats
        </h2>
        <TopFiveRanking list={topFive} />
      </main>

      {/* <aside className="col-span-3 border-l bg-white p-6 flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Détails du CV sélectionné</h2>
        <ResumeDetailPanel cv={selected} />
      </aside> */}
    </div>
  );
}
