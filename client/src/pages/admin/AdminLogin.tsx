import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Mail, LockKeyhole, LogIn } from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';

import AuthContext from '../../auth/AuthContext';
import Loading from '../../components/Loading';
import { loginFormSchema, type LoginFormData } from '../../schemas/auth';
import { executeAndShowError, FormField, FormRootError } from '../../utils/formUtils';

function AdminLogin() {
  const auth = useContext(AuthContext);
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await executeAndShowError(form, async () => {
      await auth.loginAdmin(data.email, data.password);
    });
  });

  return (
    <div className="grow hero bg-base-200">
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
            <FormField
              form={form}
              name="email"
              label="Email"
              type="email"
              Icon={Mail}
            />

            <FormField
              form={form}
              name="password"
              label="Password"
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
  );
}

export default AdminLogin;
