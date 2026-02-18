import { Mail, LockKeyhole, LogIn } from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import AuthContext from '../auth/AuthContext';
import Navbar from '../components/Navbar';
import { loginFormSchema, type LoginFormData } from '../schemas/auth';

function UserLoginPage() {
  const auth = useContext(AuthContext);
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const submit = form.handleSubmit(async (data) => {
    form.clearErrors('root');

    try {
      await auth.loginUser(data.email, data.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log in. Please try again.';
      form.setError('root', {
        type: 'server',
        message: /invalid login/i.test(message) ? 'Invalid email or password.' : message,
      });
    }
  });

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

          <div className="card bg-base-100 w-full max-w-lg shrink-0 shadow-2xl">
            <form
              className="card-body"
              onSubmit={submit}
            >
              <fieldset className="fieldset">
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    type="email"
                    className={`input input-bordered w-full pl-10 ${form.formState.errors.email ? 'input-error' : ''}`}
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
                    className={`input input-bordered w-full pl-10 ${form.formState.errors.password ? 'input-error' : ''}`}
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
                  <LogIn size={18} />
                  {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
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
