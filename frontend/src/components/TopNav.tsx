import { NavLink } from 'react-router-dom';
import { Upload, Users, Briefcase, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function TopNav() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: 'Téléverser CV', icon: Upload },
    { to: '/candidats', label: 'Candidats', icon: Users },
    { to: '/offres', label: "Offres d'emploi", icon: Briefcase },
  ];

  return (
    <header className="bg-white shadow px-6 md:px-8 py-4 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-xl font-bold text-neutral-800">Dashboard</h1>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md transition text-sm
                ${
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-700 hover:bg-neutral-200'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-md hover:bg-neutral-200"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-4 animate-slideDown">
          <nav className="flex flex-col gap-3 pb-4 border-t pt-4">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)} // close menu on click
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-md text-base transition
                    ${
                      isActive
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-700 hover:bg-neutral-200'
                    }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
