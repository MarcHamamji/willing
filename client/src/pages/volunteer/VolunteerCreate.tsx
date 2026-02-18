import { zodResolver } from '@hookform/resolvers/zod';
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

import AuthContext from '../../auth/AuthContext';
import Loading from '../../components/Loading';
import { volunteerSignupSchema, type VolunteerSignupFormData } from '../../schemas/auth';
import { executeAndShowError, FormField, FormRootError } from '../../utils/formUtils';

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
    await executeAndShowError(form, async () => {
      const { confirmPassword: _, ...volunteerData } = data;
      await auth.createVolunteer(volunteerData);
    });
  });

  return (
    <div className="hero bg-base-200 grow">
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
                <FormField
                  form={form}
                  label="First Name"
                  name="first_name"
                  type="text"
                  Icon={User}
                />
              </div>
              <div className="flex-1">
                <FormField
                  form={form}
                  label="Last Name"
                  name="last_name"
                  type="text"
                  Icon={User}
                />
              </div>
            </div>

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

            <FormField
              form={form}
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              Icon={CheckCircle2}
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <FormField
                  form={form}
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  Icon={Calendar}
                />
              </div>
              <div className="flex-1">
                <div className="flex-1">
                  <FormField
                    form={form}
                    label="Gender"
                    name="gender"
                    Icon={UserCircle}
                    selectOptions={[
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' },
                      { label: 'Other', value: 'other' },
                    ]}
                  />
                </div>
              </div>
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
                        <UserPlus size={20} />
                        Register
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
