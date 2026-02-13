import { useCallback, useContext, useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react';
import requestServer from '../../requestServer';
import type { AdminAccountWithoutPassword } from '../../../../server/src/db/tables';
import { useNavigate } from 'react-router';
import AdminContext from './AdminContext';

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
          <h1 className="text-5xl font-bold">Admin Login</h1>
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
              <input
                type="email"
                className="input w-full"
                placeholder="Email"
                onChange={handleEmailChange}
              />
              <label className="label">Password</label>
              <input
                type="password"
                className="input w-full"
                placeholder="Password"
                onChange={handlePasswordChange}
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
  );
}

export default AdminLogin;
