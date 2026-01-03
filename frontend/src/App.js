import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import UsersPage from "./pages/UsersPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AISourcesPage from "./pages/AISourcesPage";
import SubjectsPage from "./pages/SubjectsPage";
import GradesPage from "./pages/GradesPage";
import MySubjectsPage from "./pages/MySubjectsPage";
import MyClassesPage from "./pages/MyClassesPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import QuizPage from "./pages/QuizPage";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Protected Routes - All Users */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/flashcards" 
        element={
          <ProtectedRoute>
            <FlashcardsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/quiz" 
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        } 
      />

      {/* Admin Only Routes */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/approvals" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ApprovalsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subjects" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SubjectsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grades" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <GradesPage />
          </ProtectedRoute>
        } 
      />

      {/* Admin & Teacher Routes */}
      <Route 
        path="/ai-sources" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <AISourcesPage />
          </ProtectedRoute>
        } 
      />

      {/* Teacher Only Routes */}
      <Route 
        path="/my-subjects" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MySubjectsPage />
          </ProtectedRoute>
        } 
      />

      {/* Student Only Routes */}
      <Route 
        path="/my-classes" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyClassesPage />
          </ProtectedRoute>
        } 
      />

      {/* Catch all - redirect to dashboard or landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
