import React from 'react';
import type { ReactNode } from 'react';
import Navigations from './Navigations';

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      <Navigations />
      <main>{children}</main>
    </>
  );
};

export default Layout;
