import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, LockKeyhole, LogIn } from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';

import AuthContext from '../auth/AuthContext';
import Loading from '../components/Loading';
import Navbar from '../components/Navbar';
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
    <main className="h-screen flex flex-col">
      <Navbar />

      <div className="grow hero bg-base-200">
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
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default UserLoginPage;
