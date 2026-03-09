import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, LockKeyhole, LogIn } from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import AuthContext from '../auth/AuthContext';
import Loading from '../components/Loading';
import { loginFormSchema, type LoginFormData } from '../schemas/auth';
import { executeAndShowError, FormField, FormRootError } from '../utils/formUtils';

function UserLoginPage() {
  const auth = useContext(AuthContext);
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const submit = form.handleSubmit(async (data) => {
    await executeAndShowError(form, async () => {
      await auth.loginUser(data.email, data.password);
    });
  });

  return (
    <div className="flex-1 hero bg-base-200">
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
            <FormField
              form={form}
              label="Email"
              name="email"
              type="email"
              Icon={Mail}
            />

            <FormField
              form={form}
              label="Password"
              name="password"
              type="password"
              Icon={LockKeyhole}
            />

            <div className="text-right">
              <Link to="/forgot-password" className="link link-hover text-sm">
                Forgot password?
              </Link>
            </div>

            <FormRootError form={form} />

            <button
              className="btn btn-primary mt-4"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {
                form.formState.isSubmitting
                  ? <Loading />
                  : (
                      <>
                        <LogIn size={20} />
                        Login
                      </>
                    )
              }
            </button>

            <div className="text-center mt-4">
              <span className="text-sm">
                Don&apos;t have an account?
                {' '}
                <Link to="/volunteer/create" className="link link-primary">
                  Sign up
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserLoginPage;
