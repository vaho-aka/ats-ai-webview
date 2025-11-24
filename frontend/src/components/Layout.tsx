import type { ReactNode } from 'react';
import TopNav from '@/components/TopNav';
import LoadingOverlay from './LoadingOverlay';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <>
      <LoadingOverlay />

      <div className=" bg-gray-100 min-h-screen flex flex-col ">
        <TopNav />

        <main className="flex-1 py-6 bg-gray-100">{children}</main>
      </div>
    </>
  );
}
