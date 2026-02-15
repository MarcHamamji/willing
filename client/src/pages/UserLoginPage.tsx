import { Mail, LockKeyhole, LogIn } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import Navbar from '../components/Navbar';
import requestServer from '../requestServer';

function UserLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const submission = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await requestServer<{
        token: string;
        role: 'organization' | 'volunteer';
      }>('/user/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      localStorage.setItem('jwt', response.token);

      if (response.role === 'organization') {
        navigate('/organization');
      } else
        navigate('/volunteer');
    } catch (error) {
      alert('Login failed: ' + error);
    }
  };

  return (
    <main className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow hero bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse gap-8">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">User Login</h1>
            <p className="py-6">
              Welcome! Please log in to access your account.
            </p>
          </div>

          <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
            <form
              className="card-body"
              onSubmit={submission}
            >
              <fieldset className="fieldset">
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="Email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.currentTarget.value)}
                  />
                </div>
                <label className="label">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    type="password"
                    className="input input-bordered w-full pl-10"
                    placeholder="Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.currentTarget.value)}
                  />
                </div>

                <button
                  className="btn btn-primary mt-4"
                  type="submit"
                  disabled={!email || !password}
                >
                  <LogIn size={18} />
                  Login
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default UserLoginPage;
