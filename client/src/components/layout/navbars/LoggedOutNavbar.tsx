import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

import Navbar from './Navbar';

function LoggedOutNavbar() {
  return (
    <Navbar
      right={(
        <Link to="/login" className="btn btn-ghost">
          <LogIn size={20} />
          Login
        </Link>
      )}
    />
  );
}

export default LoggedOutNavbar;
