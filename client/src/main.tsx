import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import HomePage from './pages/HomePage';
import AdminPage from './pages/admin/AdminPage';

import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import AdminHome from './pages/admin/AdminHome';
import AdminLogin from './pages/admin/AdminLogin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="admin" element={<AdminPage />}>
          <Route index element={<AdminHome />} />
          <Route path="login" element={<AdminLogin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
