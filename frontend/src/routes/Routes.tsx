import { Suspense, lazy } from 'react';
import { Routes as Router, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = lazy(() => import('../pages/Home'));

const Routes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Route path="/" element={<HomePage />} />
      </Router>
    </Suspense>
  );
};

export default Routes;
