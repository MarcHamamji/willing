import { useCallback, useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react';
import requestServer from '../../requestServer';
import LocationPicker from '../../components/LocationPicker';

type OrgForm = {
  name: string;
  email: string;
  phone_number: string;
  url: string;
  location_name: string;
};

export default function OrganizationRequestPage() {
  const [form, setForm] = useState<OrgForm>({
    name: '',
    email: '',
    phone_number: '',
    url: '',
    location_name: '',
  });
  const [position, setPosition] = useState<[number, number]>([33.90192863620578, 35.477959277880416]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      ...form,
      latitude: position[0],
      longitude: position[1],
    };
    console.log(payload);

    // includeJwt is NOT passed
    await requestServer<{ success: boolean }>('/organization/request', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    alert('Organization request submitted successfully');
  }, [form, position]);

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
              <input
                name="name"
                className="input w-full"
                placeholder="Organization name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                className="input w-full"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <label className="label">Phone number</label>
              <input
                name="phone_number"
                className="input w-full"
                placeholder="Phone number"
                value={form.phone_number}
                onChange={handleChange}
              />

              <label className="label">Website</label>
              <input
                name="url"
                className="input w-full"
                placeholder="Website"
                value={form.url}
                onChange={handleChange}
              />

              <label className="label">Location</label>
              <input
                name="location_name"
                className="input w-full"
                placeholder="City, area, etc."
                value={form.location_name}
                onChange={handleChange}
                required
              />

              <div className="mt-2">
                <LocationPicker
                  position={position}
                  setPosition={setPosition}
                />
              </div>

              <button
                className="btn btn-primary mt-4"
                type="submit"
                disabled={!form.name || !form.email || !form.phone_number || !form.url || !form.location_name}
              >
                Request Account
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
