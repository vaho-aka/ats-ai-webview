import { Suspense, lazy } from 'react';
import { Routes as Router, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const ResumeDetail = lazy(() => import('../pages/ResumeDetail'));

const Routes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Route path="/" element={<Dashboard />} />
        <Route path="/resume/:name" element={<ResumeDetail />} />
      </Router>
    </Suspense>
  );
};

export default Routes;
