import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="navbar bg-base-100 shadow-md">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl" href="/">
            <img src="/willing.svg" className="h-6" />
            Willing
          </a>
        </div>
        <div className="flex-none">
          <Link to="/login" className="btn btn-ghost">Login</Link>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center max-w-5xl mx-auto py-12 px-4">

        <div className="text-center mb-16">
          <h1 className="text-6xl font-extrabold mb-4">Where help finds a home.</h1>
          <p className="text-xl opacity-70">Join Willing to connect with local opportunities or manage your organization's impact.</p>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-4">
          <div className="card bg-base-200 rounded-box grid h-64 grow place-items-center p-8 text-center border-2 border-transparent hover:border-primary transition-all">
            <h2 className="text-2xl font-bold mb-2">I want to help</h2>
            <p className="mb-6 opacity-80">Discover volunteer opportunities that match your skills.</p>
            <Link to="/volunteer/create" className="btn btn-primary btn-wide">
              Create Volunteer Account
            </Link>
          </div>

          <div className="divider md:divider-horizontal font-bold opacity-50">OR</div>

          <div className="card bg-base-200 rounded-box grid h-64 grow place-items-center p-8 text-center border-2 border-transparent hover:border-secondary transition-all">
            <h2 className="text-2xl font-bold mb-2">I need help</h2>
            <p className="mb-6 opacity-80">Request to register your organization and find volunteers.</p>
            <Link to="/organization/request" className="btn btn-secondary btn-wide">
              Request Organization Account
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="opacity-60">Already have an account?</p>
          <Link to="/login" className="link link-primary font-semibold">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
