import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import { AuthProvider } from './auth/AuthContext';
import AdminPage from './auth/pages/AdminPage';
import LoggedOutPage from './auth/pages/LoggedOutPage';
import OrganizationPage from './auth/pages/OrganizationPage';
import SharedPage from './auth/pages/SharedPage';
import VolunteerPage from './auth/pages/VolunteerPage';
import AdminHome from './pages/admin/AdminHome';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import OrganizationHome from './pages/organization/OrganizationHome';
import OrganizationPostingCreate from './pages/organization/OrganizationPostingCreate';
import OrganizationSettings from './pages/organization/VolunteerSettings';
import OrganizationProfile from './pages/OrganizationProfile';
import OrganizationRequest from './pages/OrganizationRequest';
import Posting from './pages/Posting';
import UserLogin from './pages/UserLogin';
import VolunteerHome from './pages/volunteer/VolunteerHome';
import VolunteerProfile from './pages/volunteer/VolunteerProfile';
import VolunteerSettings from './pages/volunteer/VolunteerSettings';
import VolunteerCreate from './pages/VolunteerCreate';

import 'leaflet/dist/leaflet.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route index element={<HomePage />} />

          <Route element={<LoggedOutPage />}>
            <Route path="login" element={<UserLogin />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="volunteer/create" element={<VolunteerCreate />} />
            <Route path="organization/request" element={<OrganizationRequest />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route path="admin" element={<AdminPage />}>
            <Route index element={<AdminHome />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="organization" element={<OrganizationPage />}>
            <Route index element={<OrganizationHome />} />
            <Route path="posting" element={<OrganizationPostingCreate />} />
            <Route path="settings" element={<OrganizationSettings />} />
          </Route>

          <Route path="volunteer" element={<VolunteerPage />}>
            <Route index element={<VolunteerHome />} />
            <Route path="profile" element={<VolunteerProfile />} />
            <Route path="settings" element={<VolunteerSettings />} />
          </Route>

          <Route path="/" element={<SharedPage roles={['volunteer', 'organization']} />}>
            <Route path="posting/:id" element={<Posting />} />
            <Route path="organization/:id" element={<OrganizationProfile />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
