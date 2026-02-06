import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <div className="navbar bg-base-100 shadow-md">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl" href="/">
            <img src="/willing.svg" className="h-6" alt="Willing Logo" />
            Willing
          </a>
        </div>
        <div className="flex-none">
          <Link to="/login" className="btn btn-ghost">Login</Link>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center max-w-5xl mx-auto py-12 px-4">
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
      </main>

      <footer className="footer sm:footer-horizontal p-10 bg-base-300 mt-20">
        <nav>
          <h6 className="footer-title">Willing</h6>
          <p className="max-w-xs opacity-70">
            A platform dedicated to bridging the gap between passionate volunteers and organizations in need. Built for community impact.
          </p>
        </nav>
        <nav>
          <h6 className="footer-title">Contact</h6>
          <a className="link link-hover" href="mailto:willing.aub@gmail.com">willing.aub@gmail.com</a>
          <span className="opacity-50 text-sm mt-2">Available Mon-Fri, 9am - 5pm</span>
        </nav>
        <nav>
          <h6 className="footer-title">Links</h6>
          <a
            href="https://github.com/Willing-AUB/willing/"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub Repository
          </a>
        </nav>
      </footer>
    </div>
  );
}

export default HomePage;
