import React from 'react';
import { NavBar } from './NavBar';
import Navigations from './Navigations';

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-100  text-gray-900">
      <Navigations />
      <div className=" flex">
        <NavBar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
