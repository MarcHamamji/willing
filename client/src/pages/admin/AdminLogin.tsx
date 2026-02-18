import { ShieldCheck, Mail, LockKeyhole } from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import AuthContext from '../../auth/AuthContext';
import { loginFormSchema, type LoginFormData } from '../../schemas/auth';

function AdminLogin() {
  const auth = useContext(AuthContext);
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    form.clearErrors('root');

    try {
      await auth.loginAdmin(data.email, data.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log in. Please try again.';
      form.setError('root', {
        type: 'server',
        message: /invalid login/i.test(message) ? 'Invalid email or password.' : message,
      });
    }
  });

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
                  className={`input input-bordered w-full pl-10 focus:input-primary ${form.formState.errors.email ? 'input-error' : ''}`}
                  placeholder="Email"
                  {...form.register('email', {
                    onChange: () => form.clearErrors('root'),
                  })}
                />
              </div>
              {form.formState.errors.email?.message && (
                <p className="text-error text-sm mt-1">{form.formState.errors.email.message}</p>
              )}

              <label className="label">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                <input
                  type="password"
                  className={`input input-bordered w-full pl-10 focus:input-primary ${form.formState.errors.password ? 'input-error' : ''}`}
                  placeholder="Password"
                  {...form.register('password', {
                    onChange: () => form.clearErrors('root'),
                  })}
                />
              </div>
              {form.formState.errors.password?.message && (
                <p className="text-error text-sm mt-1">{form.formState.errors.password.message}</p>
              )}
              {form.formState.errors.root?.message && (
                <div className="alert alert-error mt-3">
                  <span>{form.formState.errors.root.message}</span>
                </div>
              )}
              <button
                className="btn btn-primary mt-4"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
