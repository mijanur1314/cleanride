"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import io, { Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

// Fix for default leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customCarIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3204/3204121.png", // A simple car icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Component to dynamically update map center
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export function LiveMap({ bookingId, initialLat = 20.5937, initialLng = 78.9629 }: { bookingId: string, initialLat?: number, initialLng?: number }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      const newSocket = io(backendUrl, {
        withCredentials: true
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("join-booking", bookingId);
      });

      newSocket.on("location-updated", (data: { lat: number, lng: number }) => {
        setPosition([data.lat, data.lng]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, bookingId]);

  if (!position) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400 animate-pulse text-sm">Connecting to partner's GPS...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ height: "100%", width: "100%", minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={customCarIcon}>
          <Popup>
            <div className="font-bold">Your Washer</div>
            <div className="text-xs text-gray-500">Arriving soon...</div>
          </Popup>
        </Marker>
        <RecenterAutomatically lat={position[0]} lng={position[1]} />
      </MapContainer>
      <div className="absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-xs font-bold tracking-widest text-white uppercase">Live Tracking</span>
      </div>
    </div>
  );
}
