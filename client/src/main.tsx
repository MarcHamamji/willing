import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import { AuthProvider } from './auth/AuthContext';
import { AdminOnly, LoggedOutOnly, OrganizationOnly, VolunteerOnly } from './auth/guards';
import AdminHome from './pages/admin/AdminHome';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPage from './pages/admin/AdminPage';
import AdminSettings from './pages/admin/AdminSettings';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import OrganizationHome from './pages/organization/OrganizationHome';
import OrganizationPage from './pages/organization/OrganizationPage';
import OrganizationRequest from './pages/organization/OrganizationRequest';
import OrganizationSettings from './pages/organization/VolunteerSettings';
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
          <Route path="admin" element={<AdminPage />}>
            <Route
              index
              element={(
                <AdminOnly redirectUrl="/admin/login">
                  <AdminHome />
                </AdminOnly>
              )}
            />
            <Route
              path="login"
              element={(
                <LoggedOutOnly>
                  <AdminLogin />
                </LoggedOutOnly>
              )}
            />
            <Route
              path="settings"
              element={(
                <AdminOnly>
                  <AdminSettings />
                </AdminOnly>
              )}
            />
          </Route>
          <Route path="organization" element={<OrganizationPage />}>
            <Route
              index
              element={(
                <OrganizationOnly>
                  <OrganizationHome />
                </OrganizationOnly>
              )}
            />
            <Route
              path="request"
              element={(
                <LoggedOutOnly>
                  <OrganizationRequest />
                </LoggedOutOnly>
              )}
            />
            <Route
              path="settings"
              element={(
                <OrganizationOnly>
                  <OrganizationSettings />
                </OrganizationOnly>
              )}
            />
          </Route>
          <Route path="volunteer" element={<VolunteerPage />}>
            <Route
              index
              element={(
                <VolunteerOnly>
                  <VolunteerHome />
                </VolunteerOnly>
              )}
            />
            <Route
              path="create"
              element={(
                <LoggedOutOnly>
                  <VolunteerCreate />
                </LoggedOutOnly>
              )}
            />
            <Route
              path="profile"
              element={(
                <VolunteerOnly>
                  <VolunteerProfile />
                </VolunteerOnly>
              )}
            />
            <Route
              path="settings"
              element={(
                <VolunteerOnly>
                  <VolunteerSettings />
                </VolunteerOnly>
              )}
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
