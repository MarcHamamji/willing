import * as jose from 'jose';
import { Building2, LayoutDashboard, LogIn, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

import type { Role, UserJWT } from '../../../server/src/types';

function HomePage() {
  const [role, setRole] = useState<Role>();

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;

    try {
      const { role: jwtRole } = jose.decodeJwt<UserJWT>(jwt);
      setRole(jwtRole);
    } catch (e) {
      console.error('Invalid token', e);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Navbar right={
        !role
          ? (
              <Link to="/login" className="btn btn-ghost">
                <LogIn size={20} />
                Login
              </Link>
            )
          : (
              <Link to={'/' + role} className="btn btn-ghost">
                <LayoutDashboard size={20} />
                Dashboard
              </Link>
            )
      }
      />

      <main className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto py-12 px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Connecting volunteers to their
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">
              vision of a better community
            </span>
          </h1>
          <p className="text-xl opacity-70">Join Willing to discover local volunteering opportunities or expand your organization’s impact</p>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-4">
          {/* Volunteer Card */}
          <div className="card bg-base-200 rounded-box grid min-h-[18rem] grow place-items-center p-8 text-center border-2 border-transparent hover:border-primary hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl">
            <User className="text-primary mb-4" size={48} />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">For Individuals</span>
            <h2 className="text-3xl font-bold mb-2">I want to help</h2>
            <p className="mb-6 opacity-80">Discover volunteer opportunities that match your skills.</p>

            {role === 'admin'
              ? (
                  <Link to="/admin" className="btn btn-primary btn-wide">
                    Manage Volunteers
                  </Link>
                )
              : role === 'organization'
                ? (
                    <button className="btn btn-disabled btn-wide">
                      Organization Account Active
                    </button>
                  )
                : (
                    <Link
                      to={role === 'volunteer' ? '/volunteer' : '/volunteer/create'}
                      className="btn btn-primary btn-wide"
                    >
                      {role === 'volunteer' ? 'Go to Dashboard' : 'Create Volunteer Account'}
                    </Link>
                  )}
          </div>

          <div className="divider md:divider-horizontal font-bold opacity-50">OR</div>

          <div className="card bg-base-200 rounded-box grid min-h-[18rem] grow place-items-center p-8 text-center border-2 border-transparent hover:border-secondary hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl">
            <Building2 className="text-secondary mb-4" size={48} />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">For Organizations</span>
            <h2 className="text-3xl font-bold mb-2">I want help</h2>
            <p className="mb-6 opacity-80">Request to register your organization and find volunteers.</p>

            {role === 'admin'
              ? (
                  <Link to="/admin" className="btn btn-secondary btn-wide">
                    Manage Organizations
                  </Link>
                )
              : role === 'volunteer'
                ? (
                    <button className="btn btn-disabled btn-wide">
                      Volunteer Account Active
                    </button>
                  )
                : (
                    <Link
                      to={role === 'organization' ? '/organization' : '/organization/request'}
                      className="btn btn-secondary btn-wide"
                    >
                      {role === 'organization' ? 'Go to Dashboard' : 'Request Organization Account'}
                    </Link>
                  )}
          </div>
        </div>

        {role === 'admin' && (
          <div className="mt-16 group relative">
            <div className="relative flex flex-col items-center gap-6">
              <div className="flex items-center bg-warning/10 backdrop-blur-md border border-warning/20 p-1.5 rounded-full shadow-sm">
                <span className="px-5 text-sm font-semibold text-base-content/80">
                  You are currently logged in as an Administrator.
                </span>
                <Link
                  to="/admin"
                  className="btn btn-sm btn-warning rounded-full px-6 shadow-lg shadow-warning/20 hover:scale-105 transition-all"
                >
                  Go to Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {!role && (
          <div className="mt-16 group relative">
            <div className="relative flex flex-col items-center gap-6">
              <div className="flex items-center bg-base-200/50 backdrop-blur-md border border-base-300 p-1.5 rounded-full shadow-sm hover:shadow-md transition-all">
                <span className="px-5 text-sm font-medium opacity-60">
                  Already have an account?
                </span>
                <Link
                  to="/login"
                  className="btn btn-sm btn-primary rounded-full px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Log In
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
