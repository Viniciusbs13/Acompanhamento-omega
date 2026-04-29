/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ClientList } from './pages/ClientList';
import { ClientNew } from './pages/ClientNew';
import { ClientDashboard } from './pages/ClientDashboard';

export default function App() {
  return (
    <BrowserRouter>
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
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientList />} />
          <Route path="/clientes/novo" element={<ClientNew />} />
          <Route path="/clientes/:id" element={<ClientDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
