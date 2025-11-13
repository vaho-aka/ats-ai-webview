import { FileText } from 'lucide-react';
import { useDarkMode } from '../store';

const ResumeInsight = () => {
  const darkMode = useDarkMode((state) => state.darkMode);

  return (
    <>
      {false && (
        <div className="text-center py-20">
          <FileText size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Resume Data</h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Upload and analyze a resume to see insights
          </p>
        </div>
      )}
    </>
  );
};

export default ResumeInsight;
