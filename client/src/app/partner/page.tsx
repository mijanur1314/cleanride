"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import io, { Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, CheckCircle2, Camera, Navigation, Briefcase, DollarSign, X, MessageCircle, ArrowUpDown, ChevronLeft, User, LogOut, Package, WalletCards, WifiOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { ChatBox } from "@/components/ChatBox";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { addOfflineAction, getOfflineActions, removeOfflineAction, fileToBase64, base64ToFile } from "@/lib/offlineSync";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function PartnerDashboard() {
  const { user, isAuthenticated, _hasHydrated, logout, login } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<{ [key: string]: { before: File | null, after: File | null, beforePreview?: string, afterPreview?: string } }>({});
  const [uploadingImages, setUploadingImages] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ bookingId: string, userName: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'supplies' | 'wallet'>('jobs');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    if (isAuthenticated) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      const newSocket = io(backendUrl, {
        withCredentials: true
      });
      setSocket(newSocket);
      return () => { newSocket.disconnect(); };
    }
  }, [isAuthenticated]);

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.patch('/users/updateLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success("Location updated successfully!");
        } catch (error) {
          toast.error("Failed to update location");
        } finally {
          setIsUpdatingLocation(false);
        }
      },
      (error) => {
        toast.error("Please allow location permissions");
        setIsUpdatingLocation(false);
      }
    );
  };

  const { data: walletData } = useQuery({
    queryKey: ['partnerWallet'],
    queryFn: async () => {
      const res = await api.get("/wallet/balance");
      return res.data.data;
    },
    enabled: isAuthenticated && user?.role === 'PARTNER',
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: async () => {
      const res = await api.get("/inventory/items");
      return res.data.data.items;
    },
    enabled: isAuthenticated && user?.role === 'PARTNER',
  });

  const { data: supplyRequests = [] } = useQuery({
    queryKey: ['supplyRequests'],
    queryFn: async () => {
      const res = await api.get("/inventory/requests/me");
      return res.data.data.requests;
    },
    enabled: isAuthenticated && user?.role === 'PARTNER',
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post('/wallet/debit', {
        amount,
        type: 'WITHDRAWAL',
        description: 'Withdraw to Bank Account'
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Withdrawal requested successfully!");
      queryClient.invalidateQueries({ queryKey: ['partnerWallet'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process withdrawal");
    }
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['partnerBookings'],
    queryFn: async () => {
      const res = await api.get("/bookings/partner-bookings?limit=50");
      return res.data.data.bookings;
    },
    enabled: isAuthenticated && user?.role === 'PARTNER',
  });

  const activeBookings = useMemo(() => bookings.filter((b: any) => b.status !== 'COMPLETED'), [bookings]);

  // Live Map Tracking: Broadcast Location when EN_ROUTE
  useEffect(() => {
    let watchId: number;
    const activeEnRoute = activeBookings.find((b: any) => b.status === 'EN_ROUTE');
    
    if (activeEnRoute && socket && navigator.geolocation) {
      console.log(`Starting live tracking for booking: ${activeEnRoute.id}`);
      
      // We must explicitly join the booking room to emit to it properly if backend expects it
      // though our backend 'update-location' only needs the bookingId.
      socket.emit('join-booking', activeEnRoute.id);
      
      let mockIntervalId: NodeJS.Timeout;
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          socket.emit('update-location', {
            bookingId: activeEnRoute.id,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Live tracking error:", error);
          toast.error("GPS failed or denied. Falling back to simulated tracking for demo.");
          
          // Fallback: Mock driving simulation
          let mockLat = 20.5937;
          let mockLng = 78.9629;
          
          mockIntervalId = setInterval(() => {
            mockLat += 0.0001; // Move slightly north
            mockLng += 0.0001; // Move slightly east
            socket.emit('update-location', {
              bookingId: activeEnRoute.id,
              lat: mockLat,
              lng: mockLng
            });
          }, 2000);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      // @ts-expect-error: mockIntervalId is assigned within the watchPosition error callback
      if (typeof mockIntervalId !== 'undefined') clearInterval(mockIntervalId);
    };
  }, [activeBookings, socket]);

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
    
    if (user && user.role !== 'PARTNER') {
      router.replace("/");
    }
  }, [isAuthenticated, user, router, _hasHydrated]);

  // Check verification status in background
  useEffect(() => {
    if (isAuthenticated && user && !user.isVerified) {
      const checkStatus = async () => {
        try {
          const res = await api.get('/auth/me');
          if (res.data.data.user.isVerified) {
            login(res.data.data.user);
            toast.success("Account verified! Welcome to the Partner Hub.");
          }
        } catch (error) {
          console.error("Failed to check verification status", error);
        }
      };
      
      // Check immediately on mount, and then poll every 10 seconds
      checkStatus();
      const interval = setInterval(checkStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.isVerified, login]);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const syncPendingActions = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const actions = await getOfflineActions();
      if (actions.length === 0) return;
      
      toast.info(`Syncing ${actions.length} offline actions to server...`);
      
      for (const action of actions) {
        if (action.type === 'UPDATE_STATUS') {
          await api.patch(`/bookings/${action.payload.bookingId}/status`, { status: action.payload.status });
        } else if (action.type === 'UPLOAD_IMAGES') {
          const { bookingId, beforeImageBase64, afterImageBase64 } = action.payload;
          let beforeImageUrl, afterImageUrl;
          
          if (beforeImageBase64) {
            const formData = new FormData();
            formData.append('file', base64ToFile(beforeImageBase64, 'before.jpg'));
            const res = await api.post("/upload", formData);
            beforeImageUrl = res.data.data.url;
          }
          if (afterImageBase64) {
            const formData = new FormData();
            formData.append('file', base64ToFile(afterImageBase64, 'after.jpg'));
            const res = await api.post("/upload", formData);
            afterImageUrl = res.data.data.url;
          }
          await api.patch(`/bookings/${bookingId}/images`, { beforeImageUrl, afterImageUrl });
        }
        await removeOfflineAction(action.id!);
      }
      
      toast.success("All offline actions synced successfully!");
      queryClient.invalidateQueries({ queryKey: ['partnerBookings'] });
    } catch (error) {
      console.error("Failed to sync offline actions", error);
      toast.error("Some offline actions failed to sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      syncPendingActions();
    }
  }, [isOnline]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatusId(id);
    
    // Auto-upload images if completing job and images are pending
    if (status === 'COMPLETED' && images[id] && (images[id].before || images[id].after)) {
      const success = await submitImages(id);
      if (!success) {
        setUpdatingStatusId(null);
        return;
      }
    }
    
    try {
      if (!isOnline) {
        await addOfflineAction({
          type: 'UPDATE_STATUS',
          payload: { bookingId: id, status }
        });
        toast.success("Offline: Status update saved locally and will sync when online.");
        // Optimistically update React Query cache so UI changes immediately
        queryClient.setQueryData(['partnerBookings'], (old: any) => {
          if (!old?.data?.bookings) return old;
          return {
            ...old,
            data: {
              ...old.data,
              bookings: old.data.bookings.map((b: any) => b.id === id ? { ...b, status } : b)
            }
          };
        });
      } else {
        await api.patch(`/bookings/${id}/status`, { status });
        toast.success("Status updated successfully");
        queryClient.invalidateQueries({ queryKey: ['partnerBookings'] });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleFileChange = (id: string, type: 'before' | 'after', file: File | null | undefined) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImages(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [type]: file,
          [`${type}Preview`]: previewUrl
        }
      }));
    }
  };

  const submitImages = async (id: string): Promise<boolean> => {
    const files = images[id];
    if (!files || (!files.before && !files.after)) {
      toast.error("Please select at least one image to upload");
      return false;
    }
    
    setUploadingImages(id);
    try {
      if (!isOnline) {
        let beforeImageBase64 = null;
        let afterImageBase64 = null;

        if (files.before) beforeImageBase64 = await fileToBase64(files.before);
        if (files.after) afterImageBase64 = await fileToBase64(files.after);

        await addOfflineAction({
          type: 'UPLOAD_IMAGES',
          payload: { bookingId: id, beforeImageBase64, afterImageBase64 }
        });
        toast.success("Offline: Images saved locally and will sync when online.");
      } else {
        let beforeImageUrl;
        let afterImageUrl;

        if (files.before) {
          const formDataBefore = new FormData();
          formDataBefore.append('file', files.before);
          const resBefore = await api.post("/upload", formDataBefore);
          beforeImageUrl = resBefore.data.data.url;
        }
        
        if (files.after) {
          const formDataAfter = new FormData();
          formDataAfter.append('file', files.after);
          const resAfter = await api.post("/upload", formDataAfter);
          afterImageUrl = resAfter.data.data.url;
        }

        await api.patch(`/bookings/${id}/images`, {
          beforeImageUrl,
          afterImageUrl
        });
        toast.success("Images uploaded successfully");
      }
      
      setImages(prev => {
        const next = { ...prev };
        if (next[id]?.beforePreview) URL.revokeObjectURL(next[id].beforePreview!);
        if (next[id]?.afterPreview) URL.revokeObjectURL(next[id].afterPreview!);
        delete next[id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['partnerBookings'] });
      return true;
    } catch (error) {
      toast.error("Failed to upload images");
      return false;
    } finally {
      setUploadingImages(null);
    }
  };

  const openNavigation = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  const completedBookings = useMemo(() => bookings.filter((b: any) => b.status === 'COMPLETED'), [bookings]);
  const lifetimeEarnings = useMemo(() => completedBookings.reduce((sum: any, b: any) => sum + (b.totalAmount * 0.7), 0), [completedBookings]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    completedBookings.forEach((b: any) => {
      const dateStr = format(new Date(b.bookingDate), "MMM d");
      dataMap[dateStr] = (dataMap[dateStr] || 0) + (b.totalAmount * 0.7);
    });
    // Convert to array and take last 7 distinct dates
    const dataArray = Object.entries(dataMap).map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }));
    return dataArray.slice(-7);
  }, [completedBookings]);

  const sortedBookings = useMemo(() => {
    return [...completedBookings].sort((a: any, b: any) => {
      const dateA = new Date(a.bookingDate).getTime();
      const dateB = new Date(b.bookingDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [completedBookings, sortOrder]);

  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycPreview, setKycPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);

  const handleKycUpload = async () => {
    if (!kycFile || !selfieFile) return toast.error("Please select both your ID document and a selfie.");
    setIsUploadingKyc(true);
    try {
      const docFormData = new FormData();
      docFormData.append('file', kycFile);
      
      const selfieFormData = new FormData();
      selfieFormData.append('file', selfieFile);
      
      // Upload both files concurrently
      const [docRes, selfieRes] = await Promise.all([
        api.post('/upload', docFormData, { headers: { 'Content-Type': 'multipart/form-data' } }),
        api.post('/upload', selfieFormData, { headers: { 'Content-Type': 'multipart/form-data' } })
      ]);
      
      const documentUrl = docRes.data.data.url;
      const selfieUrl = selfieRes.data.data.url;

      await api.patch('/users/kyc', { kycDocumentUrl: documentUrl, kycSelfieUrl: selfieUrl });
      toast.success("KYC Documents submitted successfully! Waiting for admin approval.");
      
      setKycFile(null);
      setKycPreview(null);
      setSelfieFile(null);
      setSelfiePreview(null);
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload KYC document");
    } finally {
      setIsUploadingKyc(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Fallback for unverified partners
  if (user && !user.isVerified) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-white/20">
        <Card className="max-w-md w-full bg-[#111] border-white/10 shadow-2xl p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
              <Briefcase className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent font-heading mb-2">Account Not Verified</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              To ensure platform safety, we require all our premium partners to submit a KYC document (like a Driver's License or ID card). 
              If you have already submitted it, please wait for admin approval.
            </p>

            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 transition-colors relative overflow-hidden"
                  onClick={() => document.getElementById('kyc-upload')?.click()}
                >
                  {kycPreview ? (
                    <img src={kycPreview} alt="KYC Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-500 mb-2" />
                      <span className="text-xs text-gray-500 font-medium text-center px-2">ID Document<br/>(Aadhar/DL)</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="kyc-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setKycFile(file);
                        setKycPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>

                <div 
                  className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 transition-colors relative overflow-hidden"
                  onClick={() => document.getElementById('selfie-upload')?.click()}
                >
                  {selfiePreview ? (
                    <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-500 mb-2" />
                      <span className="text-xs text-gray-500 font-medium text-center px-2">Live Selfie<br/>(Face clearly visible)</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    id="selfie-upload" 
                    className="hidden" 
                    accept="image/*"
                    capture="user"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelfieFile(file);
                        setSelfiePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>

              <Button 
                onClick={handleKycUpload}
                disabled={!kycFile || !selfieFile || isUploadingKyc}
                className="w-full bg-white text-black hover:bg-gray-200 h-12 font-medium"
              >
                {isUploadingKyc ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit KYC Document'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 pb-28 pt-20 px-4 md:px-8 selection:bg-white/20">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 px-4 py-3 rounded-lg flex items-center justify-between mb-4 shadow-lg backdrop-blur-sm z-50">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 animate-pulse" />
            <div>
              <p className="font-bold text-sm">Offline Mode Active</p>
              <p className="text-xs opacity-80">You can still update status and upload photos. Changes will sync when connection is restored.</p>
            </div>
          </div>
          {isSyncing && <Loader2 className="w-5 h-5 animate-spin" />}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 mt-4 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent font-heading">Partner Hub</h1>
            <p className="text-gray-400 text-sm mt-1 font-light">Manage your premium assignments and earnings</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUpdateLocation} 
            disabled={isUpdatingLocation}
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hidden sm:flex"
          >
            {isUpdatingLocation ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2 text-blue-400" />}
            Update Location
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 h-12 w-12 shrink-0 hidden sm:flex">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1A] border-white/10 text-white shadow-2xl rounded-xl z-[100] p-2">
            <div className="flex flex-col space-y-1 p-2 pb-3">
              <p className="font-medium text-sm text-white leading-none">{user?.name || 'Partner'}</p>
              <p className="text-xs text-gray-400 leading-none mt-1.5">{user?.email}</p>
              <div className="pt-2.5">
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase tracking-widest px-2 py-0.5">
                  Partner
                </Badge>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={logout} className="py-2.5 px-3 focus:bg-red-500/10 text-red-400 focus:text-red-400 cursor-pointer flex items-center w-full rounded-lg mt-1">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'jobs' && (
          <motion.div 
            key="jobs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {activeBookings.length > 0 && (
              <div className="rounded-2xl overflow-hidden border shadow-sm h-48 relative mb-6">
                <Map bookings={activeBookings} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight font-heading text-white">Active Assignments</h2>
              <Badge variant="outline" className="rounded-full bg-white/5 border-white/10 text-gray-300 px-3 py-1 text-xs">{activeBookings.length}</Badge>
            </div>
            
            {activeBookings.length === 0 ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-[#141414] rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 border border-green-500/20 backdrop-blur-md relative z-10 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <p className="text-2xl font-bold font-heading text-white relative z-10">All caught up!</p>
                <p className="text-gray-400 text-sm max-w-[250px] mx-auto mt-3 font-light relative z-10">You don't have any pending assignments right now. Take a break.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {activeBookings.map((booking: any) => (
                    <motion.div
                      key={booking.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="overflow-hidden border border-white/5 shadow-2xl rounded-3xl bg-[#141414] relative group">
                        <div className={`absolute top-0 inset-x-0 h-1 w-full ${booking.status === 'EN_ROUTE' ? 'bg-orange-500' : booking.status === 'WASH_IN_PROGRESS' ? 'bg-blue-500' : 'bg-white/40'}`} />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        <CardContent className="p-6 relative z-10">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="font-bold text-xl leading-tight font-heading text-white">{booking.service?.name}</h3>
                              <p className="text-sm text-gray-400 mt-1 flex items-center gap-1 font-light">
                                Client: <span className="font-medium text-gray-200">{booking.user?.name}</span>
                              </p>
                            </div>
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-widest px-2.5 py-1 ${booking.status === 'WASH_IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/5 text-gray-300 border-white/10'}`}>
                              {booking.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>

                          <div className="space-y-4 mb-8 bg-black/40 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-start gap-3">
                              <Calendar className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                              <span className="text-sm font-medium text-gray-300">{format(new Date(booking.bookingDate), "PPpp")}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-400 leading-snug font-light">{booking.address}</span>
                            </div>
                          </div>

                          {/* Dynamic Actions */}
                          <div className="space-y-3">
                            {(booking.status === 'CONFIRMED' || booking.status === 'PARTNER_ASSIGNED') && (
                              <Button 
                                className="w-full rounded-xl h-14 text-sm font-bold tracking-widest uppercase bg-white text-black hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                                onClick={() => {
                                  updateStatus(booking.id, 'EN_ROUTE');
                                  openNavigation(booking.address);
                                }}
                              >
                                <Navigation className="w-4 h-4 mr-2" />
                                Accept & Navigate
                              </Button>
                            )}

                            {booking.status === 'EN_ROUTE' && (
                              <div className="grid grid-cols-2 gap-3">
                                <Button 
                                  variant="outline"
                                  className="w-full rounded-xl h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white text-xs tracking-widest uppercase font-bold"
                                  onClick={() => openNavigation(booking.address)}
                                >
                                  <Navigation className="w-4 h-4 mr-2 shrink-0" />
                                  <span className="truncate">Navigate</span>
                                </Button>
                                <Button 
                                  className="w-full rounded-xl h-14 text-xs font-bold tracking-widest uppercase bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                                  onClick={() => updateStatus(booking.id, 'WASH_IN_PROGRESS')}
                                >
                                  Start Wash
                                </Button>
                              </div>
                            )}

                            {booking.status === 'WASH_IN_PROGRESS' && (
                              <div className="space-y-4">
                                <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Required Proof
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4">
                                    {/* Before Image */}
                                    <div className="relative">
                                      {booking.beforeImageUrl ? (
                                        <div className="aspect-square rounded-xl bg-green-500/10 flex flex-col items-center justify-center border border-green-500/20 backdrop-blur-sm">
                                          <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
                                          <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">Uploaded</span>
                                        </div>
                                      ) : images[booking.id]?.beforePreview ? (
                                        <div className="aspect-square rounded-xl overflow-hidden relative border border-white/10 group">
                                          <img src={images[booking.id].beforePreview} alt="Before" className="w-full h-full object-cover" />
                                          <button onClick={() => setImages(p => { const next = {...p}; if(next[booking.id]){ next[booking.id].before = null; delete next[booking.id].beforePreview; } return next; })} className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1.5 backdrop-blur-md cursor-pointer z-10 hover:bg-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="aspect-square rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                                          <Camera className="w-5 h-5 text-gray-400 mb-2" />
                                          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Before</span>
                                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(booking.id, 'before', e.target.files?.[0])} />
                                        </label>
                                      )}
                                    </div>
                                    {/* After Image */}
                                    <div className="relative">
                                      {booking.afterImageUrl ? (
                                        <div className="aspect-square rounded-xl bg-green-500/10 flex flex-col items-center justify-center border border-green-500/20 backdrop-blur-sm">
                                          <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
                                          <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">Uploaded</span>
                                        </div>
                                      ) : images[booking.id]?.afterPreview ? (
                                        <div className="aspect-square rounded-xl overflow-hidden relative border border-white/10 group">
                                          <img src={images[booking.id].afterPreview} alt="After" className="w-full h-full object-cover" />
                                          <button onClick={() => setImages(p => { const next = {...p}; if(next[booking.id]){ next[booking.id].after = null; delete next[booking.id].afterPreview; } return next; })} className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1.5 backdrop-blur-md cursor-pointer z-10 hover:bg-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="aspect-square rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                                          <Camera className="w-5 h-5 text-gray-400 mb-2" />
                                          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">After</span>
                                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(booking.id, 'after', e.target.files?.[0])} />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {(!booking.beforeImageUrl || !booking.afterImageUrl) && (
                                    <Button 
                                      size="sm" 
                                      className="w-full mt-4 rounded-xl h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 tracking-widest uppercase text-xs font-bold"
                                      onClick={() => submitImages(booking.id)}
                                      disabled={uploadingImages === booking.id || (!images[booking.id]?.before && !images[booking.id]?.after)}
                                    >
                                      {uploadingImages === booking.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                                      Upload Photos
                                    </Button>
                                  )}
                                </div>

                                <Button 
                                  className="w-full rounded-xl h-14 text-sm tracking-widest font-bold uppercase bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50" 
                                  onClick={() => updateStatus(booking.id, 'COMPLETED')}
                                  disabled={updatingStatusId === booking.id}
                                >
                                  {updatingStatusId === booking.id ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying Quality...</> : 'Complete Job'}
                                </Button>
                              </div>
                            )}

                            <Button 
                              variant="outline" 
                              className="w-full rounded-xl h-12 border-white/10 text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white transition-colors" 
                              onClick={() => setActiveChat({ bookingId: booking.id, userName: booking.user?.name || 'Customer' })}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message Client
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'earnings' && (
          <motion.div 
            key="earnings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className={`grid grid-cols-1 ${chartData.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
              <Card className="bg-gradient-to-br from-[#141414] to-gray-900 text-white border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <DollarSign className="w-40 h-40" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <CardContent className="p-8 relative z-10">
                  <h3 className="text-gray-400 font-medium text-xs tracking-widest uppercase mb-2">Lifetime Earnings</h3>
                  <div className="text-5xl md:text-6xl font-black mb-8 font-heading">₹{lifetimeEarnings.toFixed(2)}</div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Available</span>
                      <span className="text-xl font-bold font-heading">₹{lifetimeEarnings > 0 ? (lifetimeEarnings * 0.4).toFixed(2) : '0.00'}</span>
                    </div>
                    <Button 
                      className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-[10px] rounded-xl h-14 transition-colors"
                      disabled={lifetimeEarnings === 0}
                      onClick={() => toast.success('Withdrawal request submitted! Funds will arrive in 2-3 business days.')}
                    >
                      Withdraw Funds
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {chartData.length > 0 && (
                <div className="p-8 bg-[#141414] rounded-[2rem] border border-white/5 shadow-2xl flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Recent Earnings</h3>
                  <div className="flex-1 w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                          contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', borderRadius: '12px', color: '#fff' }} 
                          itemStyle={{ color: '#22c55e' }}
                        />
                        <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight font-heading text-white">Completed Jobs</h2>
                <Button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest transition-colors border border-white/10"
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort {sortOrder === 'desc' ? 'Latest' : 'Oldest'}
                </Button>
              </div>

              {sortedBookings.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-[#141414] rounded-[2rem] border border-white/5 shadow-2xl">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-light">No completed jobs yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedBookings.map((b: any) => (
                    <div key={b.id} className="p-5 bg-[#141414] rounded-2xl border border-white/5 shadow-lg flex justify-between items-center group hover:bg-[#1a1a1a] transition-colors">
                      <div>
                        <div className="font-bold text-lg font-heading text-white">{b.service?.name}</div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 font-light">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Completed on {format(new Date(b.bookingDate), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-green-400 text-xl font-heading">+₹{(b.totalAmount * 0.7).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'supplies' && (
          <motion.div 
            key="supplies"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight font-heading text-white">Supply Request</h2>
              <Badge variant="outline" className="rounded-full bg-white/5 border-white/10 text-gray-300 px-3 py-1 text-xs">{inventoryItems.length} Items</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {inventoryItems.map((item: any) => (
                <div key={item.id} className="p-5 bg-[#141414] rounded-2xl border border-white/5 shadow-lg flex justify-between items-center group">
                  <div>
                    <h3 className="font-bold text-lg font-heading text-white">{item.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-2">
                      In Stock: <span className={item.stockLevel > 0 ? 'text-green-400' : 'text-red-400'}>{item.stockLevel}</span>
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      if (item.stockLevel <= 0) return toast.error('Item is out of stock');
                      try {
                        await api.post('/inventory/requests', { itemId: item.id, quantity: 1 });
                        toast.success(`Requested 1x ${item.name}`);
                        queryClient.invalidateQueries({ queryKey: ['supplyRequests'] });
                      } catch (e) {
                        toast.error('Failed to request item');
                      }
                    }}
                    disabled={item.stockLevel <= 0}
                    size="sm"
                    className="bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
                  >
                    Request
                  </Button>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-bold tracking-tight font-heading text-white mb-4">My Requests</h3>
            {supplyRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-[#141414] rounded-[2rem] border border-white/5 shadow-2xl">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-light">You haven't requested any supplies yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {supplyRequests.map((req: any) => (
                  <div key={req.id} className="p-5 bg-[#141414] rounded-2xl border border-white/5 shadow-lg flex justify-between items-center group hover:bg-[#1a1a1a] transition-colors">
                    <div>
                      <div className="font-bold text-lg font-heading text-white">{req.item?.name} <span className="text-sm text-gray-400 font-normal">x{req.quantity}</span></div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 font-light">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" /> {format(new Date(req.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-widest px-2.5 py-1 
                        ${req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          req.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          req.status === 'FULFILLED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'wallet' && (
          <motion.div 
            key="wallet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight font-heading text-white">My Wallet</h2>
            </div>
            
            <div className="p-8 bg-gradient-to-br from-[#141414] to-[#0A0A0A] rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <WalletCards className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Available Balance</p>
                <div className="text-5xl font-black font-heading text-white mb-8">₹{((walletData?.balance || 0) / 100).toFixed(2)}</div>
                
                <Button 
                  onClick={() => {
                    const amountStr = prompt("Enter amount to withdraw (₹):");
                    const amount = parseFloat(amountStr || "0");
                    if (amount > 0 && amount <= (walletData?.balance || 0) / 100) {
                      withdrawMutation.mutate(amount * 100);
                    } else if (amount > (walletData?.balance || 0) / 100) {
                      toast.error("Insufficient funds");
                    }
                  }}
                  disabled={withdrawMutation.isPending || (walletData?.balance || 0) <= 0}
                  className="w-full bg-white hover:bg-gray-200 text-black rounded-xl h-14 text-sm font-bold uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {withdrawMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <WalletCards className="w-5 h-5 mr-2" />}
                  Withdraw Funds
                </Button>
              </div>
            </div>

            <h3 className="text-xl font-bold tracking-tight font-heading text-white mb-4 mt-8">Recent Transactions</h3>
            {!walletData?.transactions || walletData.transactions.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-[#141414] rounded-[2rem] border border-white/5 shadow-2xl">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-light">No transaction history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletData.transactions.map((tx: any) => (
                  <div key={tx.id} className="p-5 bg-[#141414] rounded-2xl border border-white/5 shadow-lg flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {tx.amount > 0 ? <ArrowUpDown className="w-5 h-5" /> : <ArrowUpDown className="w-5 h-5 rotate-180" />}
                      </div>
                      <div>
                        <div className="font-bold text-lg font-heading text-white">{tx.description || tx.type}</div>
                        <div className="text-xs text-gray-400 mt-1 font-light">
                          {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className={`font-black text-xl font-heading ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}₹{(tx.amount / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-[#0A0A0A]/90 backdrop-blur-2xl border-t border-white/10 pb-safe z-40">
        <div className="flex justify-around items-center h-20 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`flex flex-col items-center justify-center w-24 h-full transition-all ${activeTab === 'jobs' ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Briefcase className={`w-6 h-6 mb-1.5 ${activeTab === 'jobs' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Jobs</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center justify-center w-24 h-full transition-all ${activeTab === 'earnings' ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <DollarSign className={`w-6 h-6 mb-1.5 ${activeTab === 'earnings' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Earnings</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('supplies')}
            className={`flex flex-col items-center justify-center w-24 h-full transition-all ${activeTab === 'supplies' ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Package className={`w-6 h-6 mb-1.5 ${activeTab === 'supplies' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Supplies</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center justify-center w-24 h-full transition-all ${activeTab === 'wallet' ? 'text-white scale-110' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <WalletCards className={`w-6 h-6 mb-1.5 ${activeTab === 'wallet' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Wallet</span>
          </button>
        </div>
      </div>

      {activeChat && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:p-4">
          <div className="w-full h-full max-w-lg mx-auto bg-background flex flex-col overflow-hidden sm:rounded-2xl sm:shadow-2xl sm:border sm:h-[80vh] sm:mt-[10vh]">
            <ChatBox 
              bookingId={activeChat.bookingId} 
              userName={activeChat.userName}
              onClose={() => setActiveChat(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
