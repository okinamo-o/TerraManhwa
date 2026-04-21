import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import api from './services/api';

/* Lazy-loaded pages for code splitting */
const Home = lazy(() => import('./pages/Home'));
const Browse = lazy(() => import('./pages/Browse'));
const ManhwaDetail = lazy(() => import('./pages/ManhwaDetail'));
const ChapterReader = lazy(() => import('./pages/ChapterReader'));
const Search = lazy(() => import('./pages/Search'));
const GenrePage = lazy(() => import('./pages/GenrePage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));
const Collections = lazy(() => import('./pages/Collections'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-terra-bg">
    <Spinner size="lg" />
  </div>
);

export default function App() {
  React.useEffect(() => {
    // Only track once per browser session
    if (!sessionStorage.getItem('site_visited')) {
      api.post('/admin/track-visit').then(() => {
        sessionStorage.setItem('site_visited', 'true');
      }).catch(console.error);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Reader has no layout chrome */}
          <Route path="/read/:slug/:chapterNumber" element={<ChapterReader />} />

          {/* All other pages share the standard layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/manhwa/:slug" element={<ManhwaDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/genre/:genre" element={<GenrePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/admin/*" element={<Admin />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
