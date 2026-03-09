import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, Phone, Globe, MapPin, Send, Home } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Loading from '../components/Loading';
import LocationPicker from '../components/LocationPicker';
import { organizationRequestFormSchema, type OrganizationRequestFormData } from '../schemas/auth';
import { executeAndShowError, FormField, FormRootError } from '../utils/formUtils';
import requestServer from '../utils/requestServer';

export default function OrganizationRequestPage() {
  const navigate = useNavigate();
  const form = useForm<OrganizationRequestFormData>({
    resolver: zodResolver(organizationRequestFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
      url: '',
      location_name: '',
    },
  });
  const [position, setPosition] = useState<[number, number]>([33.90192863620578, 35.477959277880416]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = form.handleSubmit(async (data) => {
    await executeAndShowError(form, async () => {
      const payload = {
        ...data,
        latitude: position[0],
        longitude: position[1],
      };

      await requestServer('/organization/request', {
        method: 'POST',
        body: payload,
      });

      setSubmitted(true);
    });
  });

  const onFormSetPosition = useCallback((position: [number, number], name?: string) => {
    setPosition(position);
    if (name && !form.getFieldState('location_name').isDirty) {
      form.setValue('location_name', name);
    }
  }, [form]);

  if (submitted) {
    return (
      <div className="grow hero bg-base-200">
        <div className="hero-content text-center">
          <div className="card bg-base-100 shadow-2xl max-w-lg w-full">
            <div className="card-body items-center">
              <h2 className="card-title text-2xl">Request submitted</h2>
              <p className="opacity-80">
                Your organization request was sent successfully. Our team will review it and contact you.
              </p>
              <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
                <Home size={18} />
                Go back home
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
          <h1 className="text-5xl font-bold">Organization Request</h1>
          <p className="py-6">
            Submit your organization details to join Willing. Our team will review your request and get back to you.
          </p>
        </div>

        <div className="card bg-base-100 w-full max-w-lg shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <FormField
              form={form}
              label="Organization name"
              name="name"
              type="text"
              Icon={Building2}
            />

            <FormField
              form={form}
              label="Email"
              name="email"
              type="email"
              Icon={Mail}
            />

            <FormField
              form={form}
              label="Phone number"
              name="phone_number"
              type="tel"
              Icon={Phone}
            />

            <FormField
              form={form}
              label="Website"
              name="url"
              type="url"
              Icon={Globe}
            />

            <FormField
              form={form}
              label="Location"
              name="location_name"
              type="text"
              Icon={MapPin}
            />

            <div className="mt-2">
              <LocationPicker
                position={position}
                setPosition={onFormSetPosition}
              />
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
                        <Send size={20} />
                        Request Account
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
