import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import { AuthProvider } from './auth/AuthContext';
import { LoggedOutOnly } from './auth/guards';
import SharedPage from './components/layout/navbars/NavbarPage';
import AdminHome from './pages/admin/AdminHome';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPage from './pages/admin/AdminPage';
import AdminSettings from './pages/admin/AdminSettings';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import OrganizationHome from './pages/organization/OrganizationHome';
import OrganizationPage from './pages/organization/OrganizationPage';
import OrganizationPostingCreate from './pages/organization/OrganizationPostingCreate';
import OrganizationRequest from './pages/organization/OrganizationRequest';
import OrganizationSettings from './pages/organization/VolunteerSettings';
import OrganizationProfilePage from './pages/OrganizationProfilePage';
import PostingPage from './pages/PostingPage';
import UserLoginPage from './pages/UserLoginPage';
import VolunteerCreate from './pages/volunteer/VolunteerCreate';
import VolunteerHome from './pages/volunteer/VolunteerHome';
import VolunteerPage from './pages/volunteer/VolunteerPage';
import VolunteerProfile from './pages/volunteer/VolunteerProfile';
import VolunteerSettings from './pages/volunteer/VolunteerSettings';

import 'leaflet/dist/leaflet.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route index element={<HomePage />} />

          <Route
            path="login"
            element={(
              <LoggedOutOnly>
                <UserLoginPage />
              </LoggedOutOnly>
            )}
          />

          <Route
            path="forgot-password"
            element={(
              <LoggedOutOnly>
                <ForgotPasswordPage />
              </LoggedOutOnly>
            )}
          />

          <Route
            path="admin/login"
            element={(
              <LoggedOutOnly>
                <AdminLogin />
              </LoggedOutOnly>
            )}
          />
          <Route path="admin" element={<AdminPage />}>
            <Route index element={<AdminHome />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route
            path="organization/request"
            element={(
              <LoggedOutOnly>
                <OrganizationRequest />
              </LoggedOutOnly>
            )}
          />
          <Route path="organization" element={<OrganizationPage />}>
            <Route index element={<OrganizationHome />} />
            <Route path="posting" element={<OrganizationPostingCreate />} />
            <Route path="settings" element={<OrganizationSettings />} />
          </Route>

          <Route
            path="volunteer/create"
            element={(
              <LoggedOutOnly>
                <VolunteerCreate />
              </LoggedOutOnly>
            )}
          />
          <Route path="volunteer" element={<VolunteerPage />}>
            <Route index element={<VolunteerHome />} />
            <Route path="profile" element={<VolunteerProfile />} />
            <Route path="settings" element={<VolunteerSettings />} />
          </Route>

          <Route path="/" element={<SharedPage />}>
            <Route
              path="posting/:id"
              element={<PostingPage />}
            />
          </Route>

          <Route path="organization/:id" element={<VolunteerPage />}>
            <Route
              index
              element={<OrganizationProfilePage />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
