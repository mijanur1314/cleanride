"use client";

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from './HeatmapLayer';

export default function AdminHeatmap({ heatmapData }: { heatmapData: any[] }) {
  if (typeof window === 'undefined') return <div className="h-full w-full bg-muted/20 animate-pulse rounded-md" />;

  // Default center (San Francisco roughly)
  const defaultCenter: [number, number] = [37.7749, -122.4194];

  return (
    <div className="h-full w-full rounded-md overflow-hidden border">
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {heatmapData && heatmapData.length > 0 && <HeatmapLayer points={heatmapData} />}
      </MapContainer>
    </div>
  );
}
