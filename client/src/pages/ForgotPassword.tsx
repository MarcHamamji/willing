import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, LockKeyhole, Mail, Send, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import Loading from '../components/Loading';
import {
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema,
  type ForgotPasswordRequestFormData,
  type ForgotPasswordResetFormData,
} from '../schemas/auth';
import { executeAndShowError, FormField, FormRootError } from '../utils/formUtils';
import requestServer from '../utils/requestServer';

function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetKey = (searchParams.get('key') ?? '').trim();
  const [requestSent, setRequestSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const requestForm = useForm<ForgotPasswordRequestFormData>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const resetForm = useForm<ForgotPasswordResetFormData>({
    resolver: zodResolver(forgotPasswordResetSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const submitRequest = requestForm.handleSubmit(async (data) => {
    await executeAndShowError(requestForm, async () => {
      await requestServer('/user/forgot-password', {
        method: 'POST',
        body: { email: data.email },
      });
      setRequestSent(true);
    });
  });

  const submitReset = resetForm.handleSubmit(async (data) => {
    await executeAndShowError(resetForm, async () => {
      await requestServer('/user/forgot-password/reset', {
        method: 'POST',
        body: { key: resetKey, password: data.password },
      });
      setResetComplete(true);
      resetForm.reset();
    });
  });

  if (!resetKey && requestSent) {
    return (
      <div className="flex-1 hero bg-base-200">
        <div className="hero-content text-center">
          <div className="card bg-base-100 shadow-2xl max-w-lg w-full">
            <div className="card-body items-center">
              <h2 className="card-title text-2xl">Check your email</h2>
              <p className="opacity-80">
                If an account exists with that email, we've sent you a password reset link. Check your inbox and follow the link to reset your password.
              </p>
              <button className="btn btn-primary mt-3" onClick={() => navigate('/login')}>
                <LogIn size={18} />
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resetKey && resetComplete) {
    return (
      <div className="flex-1 hero bg-base-200">
        <div className="hero-content text-center">
          <div className="card bg-base-100 shadow-2xl max-w-lg w-full">
            <div className="card-body items-center">
              <h2 className="card-title text-2xl">Password reset successful</h2>
              <p className="opacity-80">
                Your password has been updated. You can now log in with your new password.
              </p>
              <button className="btn btn-primary mt-3" onClick={() => navigate('/login')}>
                <LogIn size={18} />
                Go to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grow hero bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse gap-8">
        <div className="text-center lg:text-left max-w-md">
          <h1 className="text-5xl font-bold">Forgot Password</h1>
          <p className="py-6">
            {resetKey
              ? 'Set a new password for your account to regain access.'
              : 'Enter your email address and we\'ll send you a link to reset your password.'}
          </p>
        </div>

        <div className="card bg-base-100 w-full max-w-lg shrink-0 shadow-2xl">
          {!resetKey
            ? (
                <form className="card-body" onSubmit={submitRequest}>
                  <FormField
                    form={requestForm}
                    label="Email"
                    name="email"
                    type="email"
                    Icon={Mail}
                  />

                  <FormRootError form={requestForm} />

                  <div className="card-actions justify-between items-center mt-4">
                    <Link to="/login" className="link link-hover">
                      Back to login
                    </Link>
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={requestForm.formState.isSubmitting}
                    >
                      {requestForm.formState.isSubmitting
                        ? <Loading />
                        : (
                            <>
                              <Send size={18} />
                              Send Link
                            </>
                          )}
                    </button>
                  </div>
                </form>
              )
            : (
                <form className="card-body" onSubmit={submitReset}>
                  <FormField
                    form={resetForm}
                    label="New Password"
                    name="password"
                    type="password"
                    Icon={LockKeyhole}
                  />

                  <FormField
                    form={resetForm}
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    Icon={CheckCircle}
                  />

                  <FormRootError form={resetForm} />

                  <div className="card-actions justify-between items-center mt-4">
                    <Link to="/login" className="link link-hover">
                      Back to login
                    </Link>
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={resetForm.formState.isSubmitting}
                    >
                      {resetForm.formState.isSubmitting ? <Loading /> : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
