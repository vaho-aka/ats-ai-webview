import React from 'react';
import { NavLink } from 'react-router-dom';
import { Upload, FileText, BarChart3 } from 'lucide-react';
// import { useAppStore } from '../store/useAppStore';

const links = [
  { to: '/', label: 'télécharger', icon: Upload },
  { to: '/insights', label: 'Aperçu du CV', icon: FileText },
  { to: '/score', label: 'Tous les notes', icon: BarChart3 },
];

export const NavBar: React.FC = () => {
  // const darkModeSetter = useAppStore((s) => null); // placeholder if you use theme in store
  // For now keep theme local to layout or global later
  return (
    <aside className="w-64 min-h-screen bg-white border-gray-200 p-6">
      <nav className="flex flex-col gap-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink
              to={l.to}
              key={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-500 text-white' : 'hover:bg-blue-200'
                }`
              }
            >
              <Icon size={18} />
              <span className="font-medium">{l.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
