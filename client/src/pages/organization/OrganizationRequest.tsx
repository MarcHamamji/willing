import { useCallback, useState, type ChangeEvent, type SubmitEvent } from 'react';
import requestServer from '../../requestServer';

type OrgForm = {
  name: string;
  email: string;
  phone_number: string;
  url: string;
  location_name: string;
};

export default function OrgRegPage() {
  const [form, setForm] = useState<OrgForm>({
    name: '',
    email: '',
    phone_number: '',
    url: '',
    location_name: '',
  });

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Force lat/lng to 0,0 for now
    const payload = {
      ...form,
      latitude: 0,
      longitude: 0,
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
  }, [form]);

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

              {/* MAP PLACEHOLDER */}
              <div className="mt-2">
                <div className="h-32 border border-dashed border-base-300 rounded-lg flex items-center justify-center text-sm text-base-content/60">
                  Map will be added here later
                </div>
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
