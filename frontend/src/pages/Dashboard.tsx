import UploadResume from '@/components/UploadResume';
import TopRanking from '@/components/TopRanking';
import { useAppStore } from '@/store/useAppStore';

export default function DashboardPage() {
  const topRanked = useAppStore((s) => s.top_ranked);

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
      {/* Sidebar */}
      <aside
        className="
        bg-white shadow-sm border-r 
        p-6 flex flex-col gap-6
        col-span-12
        lg:col-span-4
      "
      >
        <UploadResume />
      </aside>

      {/* Main Content */}
      <main
        className="
        col-span-12
        lg:col-span-8 
        px-4 md:px-6
      "
      >
        <TopRanking list={topRanked} />
      </main>
    </div>
  );
}
