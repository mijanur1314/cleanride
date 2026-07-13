"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function Map({ bookings }: { bookings: any[] }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-muted/20 animate-pulse rounded-md" />;

  // Default center (San Francisco roughly, or average of markers)
  const defaultCenter: [number, number] = [37.7749, -122.4194];

  // Mock coordinates generator based on string hash for deterministic "fake" locations
  const getCoordinates = (str: string): [number, number] => {
    if (!str) return defaultCenter;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Spread markers around SF bay area
    const lat = 37.7749 + (hash % 100) / 1000;
    const lng = -122.4194 + ((hash >> 5) % 100) / 1000;
    return [lat, lng];
  };

  return (
    <div className="h-[400px] w-full rounded-md overflow-hidden border">
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bookings.map((booking) => {
          const position = getCoordinates(booking.address || booking.id);
          return (
            <Marker key={booking.id} position={position} icon={icon}>
              <Popup>
                <div className="font-semibold text-sm">{booking.service?.name}</div>
                <div className="text-xs text-muted-foreground">{booking.address}</div>
                <div className="text-xs mt-1 font-medium">{booking.status}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
