import { BarChart3 } from 'lucide-react';

const Navigations = () => {
  return (
    <header className={'bg-white border-gray-200 border-b px-6 py-4'}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <BarChart3 className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold">ATS Score Checker</h1>
        </div>
      </div>
    </header>
  );
};

export default Navigations;
