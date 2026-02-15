import { ShieldCheck, Mail, LockKeyhole } from 'lucide-react';
import { useCallback, useContext, useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';

import AdminContext from './AdminContext';
import requestServer from '../../requestServer';

import type { AdminAccountWithoutPassword } from '../../../../server/src/db/tables';

function AdminLogin() {
  useEffect(() => {
    localStorage.removeItem('jwt');
  }, []);

  const navigate = useNavigate();

  const context = useContext(AdminContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const credentials = { email, password };

    const response = await requestServer<{
      token: string;
      account: AdminAccountWithoutPassword;
    }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    localStorage.setItem('jwt', response.token);
    context.refreshAdmin();
    navigate('/admin/');
  }, [email, password, navigate, context]);

  return (
    <div className="flex-grow hero bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse gap-8">
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
            <ShieldCheck size={40} className="text-primary" />
            <h1 className="text-5xl font-bold">Admin Login</h1>
          </div>
          <p className="py-6">
            Authorized access only. This portal is restricted to system administrators for platform oversight and maintenance. Please log in to proceed to your secure dashboard.
          </p>
        </div>
        <div className="card bg-base-100 w-full max-w-lg shrink-0 shadow-2xl">
          <form
            className="card-body"
            onSubmit={handleSubmit}
          >
            <fieldset className="fieldset">
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                <input
                  type="email"
                  className="input input-bordered w-full pl-10 focus:input-primary"
                  placeholder="Email"
                  onChange={handleEmailChange}
                />
              </div>

              <label className="label">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                <input
                  type="password"
                  className="input input-bordered w-full pl-10 focus:input-primary"
                  placeholder="Password"
                  onChange={handlePasswordChange}
                />
              </div>
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
  );
}

export default AdminLogin;
