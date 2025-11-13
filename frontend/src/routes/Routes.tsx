import { Suspense, lazy } from 'react';
import { Routes as Router, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = lazy(() => import('../pages/Dashboard'));

const Routes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/resume-insight" element={<DashboardPage />} />
        <Route path="/score-overview" element={<DashboardPage />} />
        <Route path="/settings" element={<DashboardPage />} />
      </Router>
    </Suspense>
  );
};

export default Routes;
