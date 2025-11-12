import React from 'react';
import type { ReactNode } from 'react';

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <main>{children}</main>;
};

export default Layout;
