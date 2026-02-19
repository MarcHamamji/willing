import type { ReactNode } from 'react';

function Navbar({ center, right }: { center?: ReactNode; right?: ReactNode }) {
  return (
    <div className="navbar bg-base-100 shadow-md shrink-0 sticky top-0 z-9999">
      <div className="navbar-start">
        <a className="btn btn-ghost text-xl" href="/">
          <img src="/willing.svg" className="h-6" alt="Willing Logo" />
          Willing
        </a>
      </div>
      <div className="navbar-center">
        { center }
      </div>
      <div className="navbar-end">
        { right }
      </div>
    </div>
  );
}

export default Navbar;
