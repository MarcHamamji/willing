import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { DomEvent, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = divIcon({
  className: 'custom-icon',
  html: `
    <div class="text-primary drop-shadow-md">
      <svg viewBox="0 0 24 24" fill="currentColor" class="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    </div>`,
  iconSize: [56, 56],
  iconAnchor: [28, 56],
});

interface LocationPickerProps {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  readOnly?: boolean;
}

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
    <div ref={containerRef} className="absolute top-2 left-2 z-[1000] flex flex-col gap-1">
      <div className="join join-vertical shadow-lg">
        <button type="button" className="btn btn-square btn-sm join-item bg-base-100" onClick={() => map.zoomIn()}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        <button type="button" className="btn btn-square btn-sm join-item bg-base-100" onClick={() => map.zoomOut()}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path d="M5 12h14" /></svg>
        </button>
      </div>
    </div>
  );
}

function MapEvents({ setPosition, readOnly }: { setPosition: (p: [number, number]) => void; readOnly: boolean }) {
  useMapEvents({
    click(e) {
      if (!readOnly) setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function LocationPicker({ position, setPosition, readOnly = false }: LocationPickerProps) {
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    setDarkTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);
  return (
    <div className="h-96 border border-base-content/20 rounded-lg overflow-hidden relative shadow-inner">
      <MapContainer
        center={position}
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
        <MapEvents setPosition={setPosition} readOnly={readOnly} />
        <Marker
          icon={customIcon}
          position={position}
          draggable={!readOnly}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              setPosition([lat, lng]);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
