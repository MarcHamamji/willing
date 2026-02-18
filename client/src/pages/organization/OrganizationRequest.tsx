import { Building2, Mail, Phone, Globe, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import LocationPicker from '../../components/LocationPicker';
import { organizationRequestFormSchema, type OrganizationRequestFormData } from '../../schemas/auth';
import requestServer from '../../utils/requestServer';

export default function OrganizationRequestPage() {
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

  const handleSubmit = form.handleSubmit(async (data) => {
    form.clearErrors('root');
    form.clearErrors('email');

    const payload = {
      ...data,
      latitude: position[0],
      longitude: position[1],
    };

    try {
      await requestServer<{ success: boolean }>('/organization/request', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      alert('Organization request submitted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit organization request';
      if (/email/i.test(message)) {
        form.setError('email', { type: 'server', message });
        return;
      }
      form.setError('root', { type: 'server', message });
    }
  });

  return (
    <div className="flex-grow hero bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse gap-8">
        <div className="text-center lg:text-left max-w-md">
          <h1 className="text-5xl font-bold">Organization Request</h1>
          <p className="py-6">
            Submit your organization details to join Willing. Our team will review your request and get back to you.
          </p>
        </div>

        <div className="card bg-base-100 w-full max-w-lg shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            <fieldset className="fieldset">
              <label className="label">Organization name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                <input
                  className={`input input-bordered w-full pl-10 ${form.formState.errors.name ? 'input-error' : ''}`}
                  placeholder="Organization name"
                  {...form.register('name', {
                    onChange: () => form.clearErrors('root'),
                  })}
                />
              </div>
              {form.formState.errors.name?.message && (
                <p className="text-error text-sm mt-1">{form.formState.errors.name.message}</p>
              )}

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

              <label className="label">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                <input
                  className={`input input-bordered w-full pl-10 ${form.formState.errors.phone_number ? 'input-error' : ''}`}
                  placeholder="Phone number"
                  {...form.register('phone_number', {
                    onChange: () => form.clearErrors('root'),
                  })}
                />
              </div>
              {form.formState.errors.phone_number?.message && (
                <p className="text-error text-sm mt-1">{form.formState.errors.phone_number.message}</p>
              )}

              <label className="label">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                <input
                  className={`input input-bordered w-full pl-10 ${form.formState.errors.url ? 'input-error' : ''}`}
                  placeholder="Website"
                  {...form.register('url', {
                    onChange: () => form.clearErrors('root'),
                  })}
                />
              </div>
              {form.formState.errors.url?.message && (
                <p className="text-error text-sm mt-1">{form.formState.errors.url.message}</p>
              )}

              <label className="label">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-50" size={18} />
                <input
                  className={`input input-bordered w-full pl-10 ${form.formState.errors.location_name ? 'input-error' : ''}`}
                  placeholder="City, area, etc."
                  {...form.register('location_name', {
                    onChange: () => form.clearErrors('root'),
                  })}
                />
              </div>
              {form.formState.errors.location_name?.message && (
                <p className="text-error text-sm mt-1">{form.formState.errors.location_name.message}</p>
              )}

              <div className="mt-2">
                <LocationPicker
                  position={position}
                  setPosition={setPosition}
                />
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
                <Send size={18} />
                {form.formState.isSubmitting ? 'Submitting...' : 'Request Account'}
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
