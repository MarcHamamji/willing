import React, { useState } from 'react';
import requestServer from '../requestServer';
import { useNavigate } from 'react-router';

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
      <div className="navbar bg-base-100 shadow-md">
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl" href="/">
            <img src="/willing.svg" className="h-6" />
            Willing
          </a>
        </div>
      </div>

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
                <input
                  type="email"
                  className="input w-full"
                  placeholder="Email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.currentTarget.value)}
                />

                <label className="label">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  placeholder="Password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.currentTarget.value)}
                />

                <button
                  className="btn btn-primary mt-4"
                  type="submit"
                  disabled={!email || !password}
                >
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
