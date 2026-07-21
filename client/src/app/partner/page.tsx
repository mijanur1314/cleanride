"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, CheckCircle2, Camera, Navigation, Briefcase, DollarSign, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { ChatBox } from "@/components/ChatBox";
import { motion, AnimatePresence } from "framer-motion";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function PartnerDashboard() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<{ [key: string]: { before: File | null, after: File | null, beforePreview?: string, afterPreview?: string } }>({});
  const [uploadingImages, setUploadingImages] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ bookingId: string, userName: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings'>('jobs');

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings/partner-bookings");
      setBookings(res.data.data.bookings);
    } catch (error) {
      toast.error("Failed to load assigned bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
    
    if (user && user.role !== 'PARTNER') {
      router.push("/");
    }

    if (isAuthenticated && user?.role === 'PARTNER') {
      fetchBookings();
    }
  }, [isAuthenticated, user, router, _hasHydrated]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success("Status updated successfully");
      fetchBookings();
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
      fetchBookings();
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(null);
    }
  };

  const openNavigation = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const activeBookings = bookings.filter(b => b.status !== 'COMPLETED');
  const lifetimeEarnings = completedBookings.reduce((sum, b) => sum + (b.totalAmount * 0.7), 0);

  return (
    <div className="min-h-screen bg-muted/20 pb-24 pt-20 px-4 md:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Partner Hub</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your jobs and earnings</p>
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
              <h2 className="text-xl font-bold tracking-tight">Active Assignments</h2>
              <Badge variant="secondary" className="rounded-full">{activeBookings.length}</Badge>
            </div>
            
            {activeBookings.length === 0 ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-3xl border shadow-sm"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-lg font-bold">All caught up!</p>
                <p className="text-muted-foreground text-sm max-w-[200px] mx-auto mt-2">You don't have any pending assignments right now.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {activeBookings.map((booking) => (
                    <motion.div
                      key={booking.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="overflow-hidden border-0 shadow-md rounded-2xl bg-gradient-to-b from-card to-card/50">
                        <div className={`h-2 w-full ${booking.status === 'EN_ROUTE' ? 'bg-orange-500' : booking.status === 'WASH_IN_PROGRESS' ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg leading-tight">{booking.service?.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                Customer: <span className="font-medium text-foreground">{booking.user?.name}</span>
                              </p>
                            </div>
                            <Badge variant={booking.status === 'WASH_IN_PROGRESS' ? 'default' : 'secondary'} className="text-[10px] uppercase tracking-wider px-2 py-1">
                              {booking.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>

                          <div className="space-y-3 mb-6 bg-muted/40 rounded-xl p-3">
                            <div className="flex items-start gap-3">
                              <Calendar className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              <span className="text-sm font-medium">{format(new Date(booking.bookingDate), "PPpp")}</span>
                            </div>
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground leading-snug">{booking.address}</span>
                            </div>
                          </div>

                          {/* Dynamic Actions */}
                          <div className="space-y-3">
                            {(booking.status === 'CONFIRMED' || booking.status === 'PARTNER_ASSIGNED') && (
                              <Button 
                                className="w-full rounded-xl h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white" 
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
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline"
                                  className="rounded-xl h-12 flex-1"
                                  onClick={() => openNavigation(booking.address)}
                                >
                                  <Navigation className="w-4 h-4" />
                                </Button>
                                <Button 
                                  className="w-full rounded-xl h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white flex-[4]" 
                                  onClick={() => updateStatus(booking.id, 'WASH_IN_PROGRESS')}
                                >
                                  Arrived - Start Wash
                                </Button>
                              </div>
                            )}

                            {booking.status === 'WASH_IN_PROGRESS' && (
                              <div className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Required Proof
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Before Image */}
                                    <div className="relative">
                                      {booking.beforeImageUrl ? (
                                        <div className="aspect-square rounded-lg bg-green-50 flex flex-col items-center justify-center border border-green-200">
                                          <CheckCircle2 className="w-6 h-6 text-green-500 mb-1" />
                                          <span className="text-[10px] font-medium text-green-700">Uploaded</span>
                                        </div>
                                      ) : images[booking.id]?.beforePreview ? (
                                        <div className="aspect-square rounded-lg overflow-hidden relative border group">
                                          <img src={images[booking.id].beforePreview} alt="Before" className="w-full h-full object-cover" />
                                          <button onClick={() => setImages(p => { const next = {...p}; if(next[booking.id]){ next[booking.id].before = null; delete next[booking.id].beforePreview; } return next; })} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 backdrop-blur-sm cursor-pointer z-10">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="aspect-square rounded-lg bg-background border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                                          <Camera className="w-5 h-5 text-muted-foreground mb-1" />
                                          <span className="text-[10px] font-medium text-muted-foreground">Before</span>
                                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(booking.id, 'before', e.target.files?.[0])} />
                                        </label>
                                      )}
                                    </div>
                                    {/* After Image */}
                                    <div className="relative">
                                      {booking.afterImageUrl ? (
                                        <div className="aspect-square rounded-lg bg-green-50 flex flex-col items-center justify-center border border-green-200">
                                          <CheckCircle2 className="w-6 h-6 text-green-500 mb-1" />
                                          <span className="text-[10px] font-medium text-green-700">Uploaded</span>
                                        </div>
                                      ) : images[booking.id]?.afterPreview ? (
                                        <div className="aspect-square rounded-lg overflow-hidden relative border group">
                                          <img src={images[booking.id].afterPreview} alt="After" className="w-full h-full object-cover" />
                                          <button onClick={() => setImages(p => { const next = {...p}; if(next[booking.id]){ next[booking.id].after = null; delete next[booking.id].afterPreview; } return next; })} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 backdrop-blur-sm cursor-pointer z-10">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="aspect-square rounded-lg bg-background border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                                          <Camera className="w-5 h-5 text-muted-foreground mb-1" />
                                          <span className="text-[10px] font-medium text-muted-foreground">After</span>
                                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(booking.id, 'after', e.target.files?.[0])} />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {(!booking.beforeImageUrl || !booking.afterImageUrl) && (
                                    <Button 
                                      size="sm" 
                                      className="w-full mt-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
                                      onClick={() => submitImages(booking.id)}
                                      disabled={uploadingImages === booking.id || (!images[booking.id]?.before && !images[booking.id]?.after)}
                                    >
                                      {uploadingImages === booking.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                                      Upload Photos
                                    </Button>
                                  )}
                                </div>

                                <Button 
                                  className="w-full rounded-xl h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white" 
                                  onClick={() => updateStatus(booking.id, 'COMPLETED')}
                                >
                                  Complete Job
                                </Button>
                              </div>
                            )}

                            <Button 
                              variant="outline" 
                              className="w-full rounded-xl h-10 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100" 
                              onClick={() => setActiveChat({ bookingId: booking.id, userName: booking.user?.name || 'Customer' })}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message Customer
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
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-0 shadow-lg rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <DollarSign className="w-32 h-32" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-indigo-200 font-medium text-sm mb-1">Lifetime Earnings</h3>
                  <div className="text-5xl font-black mb-4">${lifetimeEarnings.toFixed(2)}</div>
                  
                  <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-indigo-100">Available to Withdraw</span>
                      <span className="text-lg font-bold">${lifetimeEarnings > 0 ? (lifetimeEarnings * 0.4).toFixed(2) : '0.00'}</span>
                    </div>
                    <Button 
                      className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl h-11"
                      disabled={lifetimeEarnings === 0}
                      onClick={() => toast.success('Withdrawal request submitted! Funds will arrive in 2-3 business days.')}
                    >
                      Withdraw Funds
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-4">Completed Jobs</h2>
              {completedBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border shadow-sm">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No completed jobs yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {completedBookings.map(b => (
                    <div key={b.id} className="p-4 bg-white rounded-2xl border shadow-sm flex justify-between items-center">
                      <div>
                        <div className="font-bold">{b.service?.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> Completed on {format(new Date(b.bookingDate), "MMM d")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-green-600 text-lg">+${(b.totalAmount * 0.7).toFixed(2)}</div>
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
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-xl border-t pb-safe z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${activeTab === 'jobs' ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Briefcase className={`w-6 h-6 mb-1 ${activeTab === 'jobs' ? 'fill-indigo-100' : ''}`} />
            <span className="text-[10px] font-medium">Jobs</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center justify-center w-20 h-full transition-colors ${activeTab === 'earnings' ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <DollarSign className={`w-6 h-6 mb-1 ${activeTab === 'earnings' ? 'fill-indigo-100' : ''}`} />
            <span className="text-[10px] font-medium">Earnings</span>
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
