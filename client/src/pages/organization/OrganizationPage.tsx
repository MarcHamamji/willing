import { Outlet } from 'react-router';

function OrganizationPage() {
  return (
    <main className="h-screen flex flex-col">
      {}
      <div className="navbar bg-base-100 shadow-md">
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl" href="/">
            <img src="/willing.svg" className="h-6" />
            Willing
          </a>
        </div>
        <div className="navbar-end">
          {}
        </div>
      </div>
      {}
      <Outlet />
    </main>
  );
}

export default OrganizationPage;
