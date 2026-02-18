import {
  User,
  Mail,
  LockKeyhole,
  Calendar,
  UserCircle,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import AuthContext from '../../auth/AuthContext';
import { volunteerSignupSchema, type VolunteerSignupFormData } from '../../schemas/auth';

export default function VolunteerCreate() {
  const auth = useContext(AuthContext);
  const form = useForm<VolunteerSignupFormData>({
    resolver: zodResolver(volunteerSignupSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      date_of_birth: '',
      gender: 'male',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    form.clearErrors('root');
    form.clearErrors('email');

    const { confirmPassword: _, ...volunteerData } = data;

    try {
      await auth.createVolunteer(volunteerData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account. Please try again.';

      if (/already exists/i.test(message)) {
        form.setError('email', { type: 'server', message });
        return;
      }

      form.setError('root', { type: 'server', message });
    }
  });

  return (
    <div className="hero bg-base-200 flex-grow">
      <div className="hero-content flex-col lg:flex-row-reverse gap-8">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">Volunteer Registration</h1>
          <p className="py-6">
            Fill out the form to register as a volunteer.
          </p>
        </div>

        <div className="card bg-base-100 w-full max-w-lg shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="label">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    className={`input input-bordered w-full pl-10 ${form.formState.errors.first_name ? 'input-error' : ''}`}
                    placeholder="First name"
                    {...form.register('first_name', {
                      onChange: () => form.clearErrors('root'),
                    })}
                  />
                </div>
                {form.formState.errors.first_name?.message && (
                  <p className="text-error text-sm mt-1">{form.formState.errors.first_name.message}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="label">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    className={`input input-bordered w-full pl-10 ${form.formState.errors.last_name ? 'input-error' : ''}`}
                    placeholder="Last name"
                    {...form.register('last_name', {
                      onChange: () => form.clearErrors('root'),
                    })}
                  />
                </div>
                {form.formState.errors.last_name?.message && (
                  <p className="text-error text-sm mt-1">{form.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>

            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
              <input
                type="email"
                className={`input input-bordered w-full pl-10 ${form.formState.errors.email ? 'input-error' : ''}`}
                placeholder="Email"
                {...form.register('email', {
                  onChange: () => {
                    form.clearErrors('root');
                    form.clearErrors('email');
                  },
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

            <label className="label">Confirm Password</label>
            <div className="relative">
              <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
              <input
                type="password"
                className={`input input-bordered w-full pl-10 ${form.formState.errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm password"
                {...form.register('confirmPassword', {
                  onChange: () => form.clearErrors('root'),
                })}
              />
            </div>
            {form.formState.errors.confirmPassword?.message && (
              <p className="text-error text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="label">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <input
                    type="date"
                    className={`input input-bordered w-full pl-10 ${form.formState.errors.date_of_birth ? 'input-error' : ''}`}
                    {...form.register('date_of_birth', {
                      onChange: () => form.clearErrors('root'),
                    })}
                  />
                </div>
                {form.formState.errors.date_of_birth?.message && (
                  <p className="text-error text-sm mt-1">{form.formState.errors.date_of_birth.message}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="label">Gender</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                  <select
                    className={`select select-bordered w-full pl-10 ${form.formState.errors.gender ? 'select-error' : ''}`}
                    {...form.register('gender', {
                      onChange: () => form.clearErrors('root'),
                    })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {form.formState.errors.gender?.message && (
                  <p className="text-error text-sm mt-1">{form.formState.errors.gender.message}</p>
                )}
              </div>
            </div>

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
              <UserPlus size={20} />
              {form.formState.isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
