/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { Demands } from './pages/Demands';
import { ClientList } from './pages/ClientList';
import { ClientNew } from './pages/ClientNew';
import { ClientDashboard } from './pages/ClientDashboard';
import { Reports } from './pages/Reports';
import { Management } from './pages/Management';
import { Commercial } from './pages/Commercial';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VisibilityProvider } from './contexts/VisibilityContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <VisibilityProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster 
            theme="dark" 
            position="top-right" 
            richColors 
            toastOptions={{
              style: { background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/demandas" element={<ErrorBoundary><Demands /></ErrorBoundary>} />
              <Route path="/clientes" element={<ErrorBoundary><ClientList /></ErrorBoundary>} />
              <Route path="/clientes/novo" element={<ErrorBoundary><ClientNew /></ErrorBoundary>} />
              <Route path="/clientes/:id" element={<ErrorBoundary><ClientDashboard /></ErrorBoundary>} />
              <Route path="/comercial" element={<ErrorBoundary><Commercial /></ErrorBoundary>} />
              <Route path="/gestao" element={<ErrorBoundary><Management /></ErrorBoundary>} />
              <Route path="/relatorios" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
              <Route path="/configuracoes" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </VisibilityProvider>
    </AuthProvider>
  );
}
