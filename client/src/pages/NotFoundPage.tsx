import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Navbar />

      <main className="grow flex flex-col items-center justify-center max-w-5xl mx-auto py-12 px-4 text-center">
        <div className="space-y-6">
          <h1 className="text-9xl font-black text-primary opacity-20">404</h1>

          <div className="relative -mt-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Lost in the community?</h2>
            <p className="text-xl opacity-70 max-w-md mx-auto">
              The page you are looking for doesn't exist or has been moved to a new neighborhood.
            </p>
          </div>

          <div className="pt-8">
            <Link to="/" className="btn btn-primary btn-wide shadow-lg">
              <Home size={20} />
              Take Me Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default NotFoundPage;
