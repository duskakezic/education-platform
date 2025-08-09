import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { Announcements } from './pages/Announcements';
import { Materials } from './pages/Materials';
import { CreateAnnouncement } from './pages/CreateAnnouncement';
import { UploadMaterial } from './pages/UploadMaterial';
import { AnnouncementDetail } from './pages/AnnouncementDetail';
import { NotFound } from './pages/NotFound';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navigation />}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/courses" element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          } />
          
          <Route path="/courses/:courseId/announcements" element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          } />
          
          <Route path="/courses/:courseId/materials" element={
            <ProtectedRoute>
              <Materials />
            </ProtectedRoute>
          } />
          
          <Route path="/create-announcement" element={
            <ProtectedRoute>
              <CreateAnnouncement />
            </ProtectedRoute>
          } />
          
          <Route path="/upload-material" element={
            <ProtectedRoute>
              <UploadMaterial />
            </ProtectedRoute>
          } />
          
          <Route path="/announcements/:announcementId" element={
            <ProtectedRoute>
              <AnnouncementDetail />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
