import { Suspense, lazy } from 'react';
import { Routes as Router, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const UploadResume = lazy(() => import('../pages/UploadResume'));
const ResumeInsight = lazy(() => import('../pages/ResumeInsight'));
const ScoreOverview = lazy(() => import('../pages/ScoreOverview'));

const Routes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Route path="/" element={<UploadResume />} />
        <Route path="/insights" element={<ResumeInsight />} />
        <Route path="/score" element={<ScoreOverview />} />
      </Router>
    </Suspense>
  );
};

export default Routes;
