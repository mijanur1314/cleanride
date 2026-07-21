"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated, _hasHydrated, token } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    // Only connect if the user is authenticated
    if (isAuthenticated && user) {
      const frontendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const socketInstance = io(frontendUrl, {
        auth: {
          token: token
        }
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        // Join the personal room for targeted notifications
        socketInstance.emit("join", user.id);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      // Global event listeners
      socketInstance.on("booking-updated", (data: any) => {
        toast.success(data.message, { duration: 5000 });
        // Can optionally refresh data globally if a store is used
      });

      // Avoid synchronous setState in effect
      setTimeout(() => setSocket(socketInstance), 0);

      return () => {
        socketInstance.disconnect();
      };
    } 
    if (socket && (!isAuthenticated || !user)) {
      // Disconnect if user logs out
      socket.disconnect();
      setTimeout(() => setSocket(null), 0);
      setTimeout(() => setIsConnected(false), 0);
    }
  }, [user, isAuthenticated, _hasHydrated, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
