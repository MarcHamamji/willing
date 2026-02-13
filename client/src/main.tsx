import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import AdminHome from './pages/admin/AdminHome';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPage from './pages/admin/AdminPage';
import HomePage from './pages/HomePage';
import OrganizationHome from './pages/organization/OrganizationHome';
import OrganizationPage from './pages/organization/OrganizationPage';
import OrganizationRequest from './pages/organization/OrganizationRequest';
import UserLoginPage from './pages/UserLoginPage';
import VolunteerCreate from './pages/volunteer/VolunteerCreate';
import VolunteerHome from './pages/volunteer/VolunteerHome';
import VolunteerPage from './pages/volunteer/VolunteerPage';
import VolunteerProfile from './pages/volunteer/VolunteerProfile';

import './index.css';

import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="login" element={<UserLoginPage />} />
        <Route path="admin" element={<AdminPage />}>
          <Route index element={<AdminHome />} />
          <Route path="login" element={<AdminLogin />} />
        </Route>
        <Route path="organization" element={<OrganizationPage />}>
          <Route index element={<OrganizationHome />}></Route>
          <Route path="request" element={<OrganizationRequest />} />
        </Route>
        <Route path="volunteer" element={<VolunteerPage />}>
          <Route index element={<VolunteerHome />}></Route>
          <Route path="create" element={<VolunteerCreate />} />
          <Route path="profile" element={<VolunteerProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
