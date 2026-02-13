import { useCallback, useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import requestServer from '../../requestServer';
import { DomEvent, divIcon } from 'leaflet';

const customIcon = divIcon({
  className: 'custom-icon',
  html: `
    <div class="text-primary drop-shadow-md">
      <svg 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-14 h-14" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    </div>`,
  iconSize: [56, 56], // Slightly larger container (w-14 = 56px)
  iconAnchor: [28, 56], // Anchored perfectly at the bottom center tip
});

type OrgForm = {
  name: string;
  email: string;
  phone_number: string;
  url: string;
  location_name: string;
};

function MapZoomControl() {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      DomEvent.disableClickPropagation(containerRef.current);
      DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute top-2 left-2 z-[1000] flex flex-col gap-1"
    >
      <div className="join join-vertical">
        <button
          type="button"
          className="btn btn-square btn-sm join-item bg-base-100 hover:bg-base-200 text-lg shadow-lg text-base-content/50"
          onClick={() => map.zoomIn()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button
          type="button"
          className="btn btn-square btn-sm join-item bg-base-100 hover:bg-base-200 text-lg shadow-lg text-base-content/50"
          onClick={() => map.zoomOut()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MapClickHandler({ setPosition }: { setPosition: (latLng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function OrganizationRequestPage() {
  const [darkTheme, setDarkTheme] = useState(false);
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

  useEffect(() => {
    setDarkTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

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
                <div className="h-96 border border-base-content/20 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[33.90192863620578, 35.477959277880416]}
                    zoom={15}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                    zoomControl={false}
                  >
                    <TileLayer
                      className={darkTheme ? 'brightness-300' : ''}
                      attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url={darkTheme
                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
                    />
                    <MapZoomControl />
                    <MapClickHandler setPosition={setPosition} />
                    <Marker
                      icon={customIcon}
                      position={position}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const marker = e.target;
                          const { lat, lng } = marker.getLatLng();
                          setPosition([lat, lng]);
                        },
                      }}
                    />
                  </MapContainer>
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
