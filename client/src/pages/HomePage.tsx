import { Building2, Heart, Zap, Users } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AuthContext from '../auth/AuthContext';
import Footer from '../components/layout/Footer';
import UserNavbar from '../components/layout/navbars/UserNavbar';
import requestServer from '../utils/requestServer';

import type { PublicHomeStatsResponse } from '../../../server/src/api/types';

function HomePage() {
  const auth = useContext(AuthContext);
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [totalVolunteers, setTotalVolunteers] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const res = await requestServer<PublicHomeStatsResponse>('/public/home-stats', {});

        if (!isMounted)
          return;

        setTotalOpportunities(res.totalOpportunities);
        setTotalOrganizations(res.totalOrganizations);
        setTotalVolunteers(res.totalVolunteers);
      } catch {
        if (!isMounted)
          return;

        setTotalOpportunities(0);
        setTotalOrganizations(0);
        setTotalVolunteers(0);
      }
    };

    void fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <UserNavbar />

      <main className="grow flex flex-col items-center justify-center max-w-5xl mx-auto py-12 px-4 mt-16">
        <div className="text-center mb-26">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Connecting volunteers to their
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-purple-500 to-secondary">
              vision of a better community
            </span>
          </h1>
          <p className="text-xl opacity-70">Join Willing to discover local volunteering opportunities or expand your organization’s impact</p>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-4 mt-8">

          <div className="card bg-base-200 rounded-box grid min-h-72 grow place-items-center p-8 text-center border-2 border-transparent hover:border-primary hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl">
            <Users className="text-primary mb-4" size={48} />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">For Individuals</span>
            <h2 className="text-3xl font-bold mb-2">I want to help</h2>
            <p className="mb-6 opacity-80">Discover volunteer opportunities that match your skills.</p>

            {auth.user?.role === 'admin'
              ? (
                  <Link to="/admin" className="btn btn-primary btn-wide">
                    Manage Volunteers
                  </Link>
                )
              : auth.user?.role === 'organization'
                ? (
                    <button className="btn btn-disabled btn-wide">
                      Organization Account Active
                    </button>
                  )
                : (
                    <Link
                      to={auth.user?.role === 'volunteer' ? '/volunteer' : '/volunteer/create'}
                      className="btn btn-primary btn-wide"
                    >
                      {auth.user?.role === 'volunteer' ? 'Go to Dashboard' : 'Create Volunteer Account'}
                    </Link>
                  )}
          </div>

          <div className="divider md:divider-horizontal font-bold opacity-50">OR</div>

          <div className="card bg-base-200 rounded-box grid min-h-72 grow place-items-center p-8 text-center border-2 border-transparent hover:border-secondary hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl">
            <Building2 className="text-secondary mb-4" size={48} />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">For Organizations</span>
            <h2 className="text-3xl font-bold mb-2">I want help</h2>
            <p className="mb-6 opacity-80">Request to register your organization and find volunteers.</p>

            {auth.user?.role === 'admin'
              ? (
                  <Link to="/admin" className="btn btn-secondary btn-wide">
                    Manage Organizations
                  </Link>
                )
              : auth.user?.role === 'volunteer'
                ? (
                    <button className="btn btn-disabled btn-wide">
                      Volunteer Account Active
                    </button>
                  )
                : (
                    <Link
                      to={auth.user?.role === 'organization' ? '/organization' : '/organization/request'}
                      className="btn btn-secondary btn-wide"
                    >
                      {auth.user?.role === 'organization' ? 'Go to Dashboard' : 'Request Organization Account'}
                    </Link>
                  )}
          </div>
        </div>

        {auth.user?.role === 'admin' && (
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

        {!auth.user?.role && (
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

        <div className="mb-10 w-full max-w-3xl space-y-24 mt-28">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="card border border-primary/20 bg-primary/5 h-44 w-full sm:w-80 flex items-center justify-center px-10 py-8">
                <div className="flex items-center gap-4">
                  <div className="text-8xl font-black text-primary -translate-y-1">{totalVolunteers}</div>
                  <Heart className="text-primary" size={68} strokeWidth={3.5} />
                </div>
              </div>
              <div className="sm:ml-auto sm:text-right">
                <p className="text-3xl font-bold text-primary">Number of volunteers</p>
                <p className="text-lg opacity-60">Making a difference in their communities every day</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-3xl font-bold text-accent">Number of opportunities</p>
                <p className="text-lg opacity-60">Find the perfect opportunity that matches your skills</p>
              </div>
              <div className="card border border-accent/20 bg-accent/5 h-44 w-full sm:w-80 flex items-center justify-center px-10 py-8 sm:ml-auto">
                <div className="flex items-center gap-4">
                  <div className="text-8xl font-black text-accent -translate-y-1">{totalOpportunities}</div>
                  <Zap className="text-accent" size={68} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="card border border-secondary/20 bg-secondary/5 h-44 w-full sm:w-80 flex items-center justify-center px-10 py-8">
                <div className="flex items-center gap-4">
                  <div className="text-8xl font-black text-secondary -translate-y-1">{totalOrganizations}</div>
                  <Building2 className="text-secondary" size={68} strokeWidth={2.5} />
                </div>
              </div>
              <div className="sm:ml-auto sm:text-right">
                <p className="text-3xl font-bold text-secondary">Number of organizations</p>
                <p className="text-lg opacity-60">Trusted partners working towards social impact</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
