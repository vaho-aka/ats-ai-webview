import { BarChart3, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../store';

const Navigations = () => {
  const darkMode = useDarkMode((state) => state.darkMode);
  const changeThemeHandler = useDarkMode((state) => state.changeTheme);

  return (
    <header
      className={`${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b px-6 py-4`}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <BarChart3 className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold">ATS Score Checker</h1>
        </div>
        <button
          onClick={changeThemeHandler}
          className={`p-2 rounded-lg ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Navigations;
