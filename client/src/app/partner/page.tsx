"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, CheckCircle2, Camera, Navigation, Briefcase, DollarSign, X, MessageCircle, ArrowUpDown, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { ChatBox } from "@/components/ChatBox";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function PartnerDashboard() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<{ [key: string]: { before: File | null, after: File | null, beforePreview?: string, afterPreview?: string } }>({});
  const [uploadingImages, setUploadingImages] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ bookingId: string, userName: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings'>('jobs');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['partnerBookings'],
    queryFn: async () => {
      const res = await api.get("/bookings/partner-bookings?limit=50");
      return res.data.data.bookings;
    },
    enabled: isAuthenticated && user?.role === 'PARTNER',
  });

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
    
    if (user && user.role !== 'PARTNER') {
      router.push("/");
    }
  }, [isAuthenticated, user, router, _hasHydrated]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ['partnerBookings'] });
    } catch (error) {
      toast.error("Failed to update status");
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

  const submitImages = async (id: string) => {
    const files = images[id];
    if (!files || (!files.before && !files.after)) {
      toast.error("Please select at least one image to upload");
      return;
    }
    
    setUploadingImages(id);
    try {
      const formData = new FormData();
      if (files.before) formData.append('beforeImage', files.before);
      if (files.after) formData.append('afterImage', files.after);

      await api.patch(`/bookings/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success("Images uploaded successfully");
      setImages(prev => {
        const next = { ...prev };
        if (next[id]?.beforePreview) URL.revokeObjectURL(next[id].beforePreview!);
        if (next[id]?.afterPreview) URL.revokeObjectURL(next[id].afterPreview!);
        delete next[id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['partnerBookings'] });
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(null);
    }
  };

  const openNavigation = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');
  const activeBookings = bookings.filter((b: any) => b.status !== 'COMPLETED');
  const lifetimeEarnings = completedBookings.reduce((sum: any, b: any) => sum + (b.totalAmount * 0.7), 0);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    completedBookings.forEach((b: any) => {
      const dateStr = format(new Date(b.bookingDate), "MMM d");
      dataMap[dateStr] = (dataMap[dateStr] || 0) + (b.totalAmount * 0.7);
    });
    // Convert to array and take last 7 distinct dates
    const dataArray = Object.entries(dataMap).map(([date, amount]) => ({ date, amount }));
    return dataArray.slice(-7);
  }, [completedBookings]);

  const sortedBookings = useMemo(() => {
    return [...completedBookings].sort((a: any, b: any) => {
      const dateA = new Date(a.bookingDate).getTime();
      const dateB = new Date(b.bookingDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [completedBookings, sortOrder]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 pb-28 pt-20 px-4 md:px-8 selection:bg-white/20">
      {/* Header */}
      <div className="mb-8 mt-4 relative z-10 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-full bg-white/5 hover:bg-white/10 text-white shrink-0 h-12 w-12 border border-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent font-heading">Partner Hub</h1>
          <p className="text-gray-400 text-sm mt-1 font-light">Manage your premium assignments and earnings</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'jobs' ? (
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
                              <div className="flex gap-3">
                                <Button 
                                  variant="outline"
                                  className="rounded-xl h-14 w-14 shrink-0 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                                  onClick={() => openNavigation(booking.address)}
                                >
                                  <Navigation className="w-5 h-5" />
                                </Button>
                                <Button 
                                  className="w-full rounded-xl h-14 text-sm font-bold tracking-widest uppercase bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
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
                                  className="w-full rounded-xl h-14 text-sm tracking-widest font-bold uppercase bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)]" 
                                  onClick={() => updateStatus(booking.id, 'COMPLETED')}
                                >
                                  Complete Job
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
        ) : (
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
