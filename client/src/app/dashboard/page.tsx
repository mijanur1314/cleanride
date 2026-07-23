"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, Car, Camera, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, MessageCircle, Clock, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChatBox } from "@/components/ChatBox";

export default function UserDashboard() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewData, setReviewData] = useState<{ [key: string]: { rating: number, comment: string } }>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});

  const toggleBooking = (id: string) => {
    setExpandedBookings(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [newVehicle, setNewVehicle] = useState({ type: '', make: '', model: '', plateNumber: '' });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [activeChat, setActiveChat] = useState<{ bookingId: string, partnerName: string } | null>(null);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async (id: string) => {
    setIsProcessing(true);
    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast.success("Booking cancelled successfully");
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'CANCELLED', payment: b.payment ? { ...b.payment, status: b.payment.status === 'COMPLETED' ? 'REFUNDED' : b.payment.status } : null } : b));
      setCancelModal(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReschedule = async (id: string) => {
    if (!newDate) {
      toast.error("Please select a new date and time");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await api.patch(`/bookings/${id}/reschedule`, { newDate });
      toast.success("Booking rescheduled successfully");
      setBookings(bookings.map(b => b.id === id ? { ...b, bookingDate: res.data.data.booking.bookingDate } : b));
      setRescheduleModal(null);
      setNewDate('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reschedule booking");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [bookingsRes, subRes, vehiclesRes] = await Promise.all([
          api.get("/bookings/my-bookings"),
          api.get("/subscriptions/my-subscription").catch(() => ({ data: { data: { subscription: null } } })),
          api.get("/vehicles/my-vehicles")
        ]);
        setBookings(bookingsRes.data.data.bookings);
        setSubscription(subRes.data.data.subscription);
        setVehicles(vehiclesRes.data.data.vehicles);
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Polling for live status updates every 15 seconds
    const intervalId = setInterval(fetchData, 15000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, router]);

  const submitReview = async (bookingId: string) => {
    const data = reviewData[bookingId];
    if (!data || !data.rating) {
      toast.error("Please provide a rating");
      return;
    }
    setSubmittingReview(bookingId);
    try {
      await api.post("/reviews", { bookingId, rating: data.rating, comment: data.comment });
      toast.success("Review submitted!");
      // Update local state to show review
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, review: { rating: data.rating, comment: data.comment } } : b));
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(null);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.type) {
      toast.error("Vehicle type is required");
      return;
    }
    setAddingVehicle(true);
    try {
      const res = await api.post("/vehicles", newVehicle);
      setVehicles([res.data.data.vehicle, ...vehicles]);
      setNewVehicle({ type: '', make: '', model: '', plateNumber: '' });
      toast.success("Vehicle added to garage!");
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to add vehicle");
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(vehicles.filter(v => v.id !== id));
      toast.success("Vehicle removed");
    } catch (error) {
      toast.error("Failed to remove vehicle");
    }
  };

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 pt-32 pb-12 px-4 selection:bg-white/20">
      <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent font-heading">My Dashboard</h1>
              <p className="text-gray-400 font-light">Welcome back, <span className="text-gray-200 font-medium">{user?.name}</span></p>
            </div>
            <Link href="/book">
              <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-xs h-14 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                Book a Wash
              </Button>
            </Link>
          </div>

          <Card className="border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            <CardHeader className="pb-4 relative z-10 border-b border-white/5">
              <CardTitle className="text-sm uppercase tracking-widest font-bold text-gray-400">Profile Info</CardTitle>
            </CardHeader>
          <CardContent className="space-y-4 pt-6 relative z-10">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Name</p>
              <p className="font-semibold text-white">{user?.name}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Email</p>
              <p className="font-semibold text-white">{user?.email}</p>
            </div>
            
            {user?.loyaltyPoints !== undefined && (
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Loyalty Points</p>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-2 py-1">
                  <Zap className="w-3 h-3 mr-1.5" /> {user.loyaltyPoints}
                </Badge>
              </div>
            )}
            
            {user?.referralCode && (
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Referral Code</p>
                <code className="bg-black border border-white/10 px-2.5 py-1 rounded-md text-xs font-mono text-gray-300">{user.referralCode}</code>
              </div>
            )}

            <div className="pt-2">
              <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/10 uppercase tracking-widest text-[10px]">
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {subscription && (
          <Card className="border-green-500/20 bg-gradient-to-br from-[#141414] to-green-950/20 mt-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Zap className="w-16 h-16 text-green-500" />
            </div>
            <CardHeader className="pb-2 border-b border-white/5 relative z-10">
              <CardTitle className="text-sm uppercase tracking-widest font-bold text-green-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Active Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 relative z-10">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Plan</p>
                <p className="font-semibold text-white text-lg">{subscription.plan?.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Valid Until</p>
                <p className="font-semibold text-gray-300">{format(new Date(subscription.endDate), "PPP")}</p>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-3 space-y-4">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="mb-6 bg-[#141414] border border-white/10 p-1 rounded-xl w-full sm:w-auto h-auto">
              <TabsTrigger value="bookings" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 rounded-lg py-2.5 px-6 font-medium transition-all">Recent Bookings</TabsTrigger>
              <TabsTrigger value="garage" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 rounded-lg py-2.5 px-6 font-medium transition-all">My Garage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookings" className="space-y-6">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-[#141414] rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              <div className="w-20 h-20 bg-white/5 text-gray-500 rounded-full flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md relative z-10">
                <Car className="w-10 h-10" />
              </div>
              <p className="text-2xl font-bold font-heading text-white relative z-10 mb-2">No bookings yet</p>
              <p className="text-gray-400 font-light relative z-10 mb-8 max-w-xs">You haven't booked any premium services yet. Treat your vehicle today.</p>
              <Link href="/book" className="relative z-10">
                <Button className="h-12 px-8 bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs rounded-xl transition-all">Book a Wash</Button>
              </Link>
            </div>
          ) : (
            bookings.map((booking, index) => {
              const isExpanded = expandedBookings[booking.id] ?? index === 0; // First one expanded by default
              return (
              <Card key={booking.id} className="overflow-hidden border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                
                {/* Header (Always Visible) */}
                <div 
                  className="flex justify-between items-center p-6 lg:p-8 cursor-pointer hover:bg-white/[0.02] transition-colors relative z-10"
                  onClick={() => toggleBooking(booking.id)}
                >
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-2xl font-heading text-white">{booking.service?.name}</h3>
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-widest px-2.5 py-1 ${
                      booking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      booking.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {booking.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="text-gray-500">
                    {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <>
                    <div className="flex flex-col lg:flex-row relative z-10 p-6 pt-0 lg:p-8 lg:pt-0 gap-8 items-center border-t border-white/5 mt-4">
                      <div className="flex-1 flex flex-col justify-between w-full">
                        <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mt-4 text-sm text-gray-400 bg-black/40 rounded-2xl p-5 border border-white/5 font-light">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300 font-medium">{format(new Date(booking.bookingDate), "PPpp")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Car className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300">{booking.vehicleType} {booking.vehicleNumber ? `(${booking.vehicleNumber})` : ''}</span>
                        </div>
                        <div className="flex items-start gap-3 sm:col-span-2">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                          <span className="line-clamp-2 leading-snug">{booking.address}</span>
                        </div>
                      </div>

                      {/* Booking Status Timeline */}
                      {booking.status !== 'PENDING' && booking.status !== 'CANCELLED' && (
                        <div className="mt-8 mb-2 flex items-center justify-between w-full max-w-md mx-auto">
                          {[
                            { label: 'Confirmed', step: 1, statuses: ['CONFIRMED', 'PARTNER_ASSIGNED', 'EN_ROUTE', 'WASH_IN_PROGRESS', 'REVIEW_PENDING', 'COMPLETED'] },
                            { label: 'Assigned', step: 2, statuses: ['PARTNER_ASSIGNED', 'EN_ROUTE', 'WASH_IN_PROGRESS', 'REVIEW_PENDING', 'COMPLETED'] },
                            { label: 'Washing', step: 3, statuses: ['WASH_IN_PROGRESS', 'REVIEW_PENDING', 'COMPLETED'] },
                            { label: 'Completed', step: 4, statuses: ['REVIEW_PENDING', 'COMPLETED'] },
                          ].map((s, idx, arr) => {
                            const isPast = s.statuses.includes(booking.status);
                            return (
                              <div key={s.label} className="flex-1 flex flex-col items-center relative group">
                                {idx > 0 && (
                                  <div className={`w-full h-[2px] absolute top-3.5 right-1/2 ${isPast ? 'bg-blue-500' : 'bg-white/10'}`} />
                                )}
                                <div className={`w-7 h-7 rounded-full z-10 flex items-center justify-center text-xs font-bold transition-all duration-300 ${isPast ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-[#141414] border-2 border-white/10 text-gray-500'}`}>
                                  {isPast ? '✓' : s.step}
                                </div>
                                <span className={`text-[10px] mt-2 text-center uppercase tracking-widest font-bold ${isPast ? 'text-white' : 'text-gray-600'}`}>{s.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-3xl border border-white/5 w-full lg:w-72 lg:shrink-0 flex flex-col items-center justify-center shadow-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 text-center">Total Amount</p>
                    <p className="text-4xl font-black font-heading text-white text-center">₹{booking.totalAmount}</p>
                    {booking.coupon && (
                      <Badge variant="outline" className="mt-2 text-[10px] text-green-400 border-green-500/20 bg-green-500/10 tracking-widest uppercase">
                        Coupon Applied
                      </Badge>
                    )}
                    <Badge variant="outline" className={`mt-3 mb-6 text-[10px] tracking-widest uppercase ${
                      (booking.payment?.status || 'PENDING') === 'COMPLETED' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      Payment: {booking.payment?.status || 'PENDING'}
                    </Badge>
                    {booking.status === 'CONFIRMED' || booking.status === 'PARTNER_ASSIGNED' || booking.status === 'EN_ROUTE' || booking.status === 'WASH_IN_PROGRESS' || booking.status === 'REVIEW_PENDING' ? (
                      <Button variant="outline" className="w-full gap-2 border-white/10 text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white rounded-xl mb-3 h-12" onClick={() => setActiveChat({ bookingId: booking.id, partnerName: booking.partner?.name || 'Partner' })}>
                        <MessageCircle className="w-4 h-4" />
                        Message Detailer
                      </Button>
                    ) : null}
                    
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <div className="w-full flex gap-2">
                        <Button variant="outline" className="flex-1 text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300 rounded-xl h-10 text-xs tracking-widest uppercase font-bold" onClick={() => setCancelModal(booking.id)}>
                          Cancel
                        </Button>
                        <Button variant="outline" className="flex-1 text-white border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-10 text-xs tracking-widest uppercase font-bold" onClick={() => setRescheduleModal(booking.id)}>
                          Move
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Advanced Details: Images & Reviews */}
                {(booking.beforeImageUrl || booking.afterImageUrl || booking.status === 'COMPLETED') && (
                  <div className="border-t border-white/5 bg-black/20 p-8 relative z-10">
                    {/* Images */}
                    {(booking.beforeImageUrl || booking.afterImageUrl) && (
                      <div className="mb-8">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                          <Camera className="w-4 h-4" /> Service Images
                        </h4>
                        <div className="flex gap-4">
                          {booking.beforeImageUrl && (
                            <div className="flex-1 group relative">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl z-10 flex items-end p-3">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Before Wash</span>
                              </div>
                              <img src={booking.beforeImageUrl} alt="Before" className="w-full h-40 object-cover rounded-xl border border-white/10 group-hover:border-white/30 transition-colors" />
                            </div>
                          )}
                          {booking.afterImageUrl && (
                            <div className="flex-1 group relative">
                              <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl z-10 flex items-end p-3">
                                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">After Wash</span>
                              </div>
                              <img src={booking.afterImageUrl} alt="After" className="w-full h-40 object-cover rounded-xl border-2 border-green-500/30 group-hover:border-green-500/60 transition-colors" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {booking.status === 'COMPLETED' && (
                      <div>
                        {booking.review ? (
                          <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-1 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < booking.review.rating ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/10'}`} />
                              ))}
                            </div>
                            <p className="text-sm font-light text-gray-300 italic leading-relaxed">"{booking.review.comment}"</p>
                          </div>
                        ) : (
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                            <h4 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">Leave a Review</h4>
                            <div className="flex items-center gap-2 mb-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-8 h-8 cursor-pointer hover:scale-110 transition-all ${
                                    (reviewData[booking.id]?.rating || 0) >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]' : 'text-white/10'
                                  }`} 
                                  onClick={() => setReviewData({ ...reviewData, [booking.id]: { ...reviewData[booking.id], rating: star } })}
                                />
                              ))}
                            </div>
                            <Textarea 
                              placeholder="How did our detailer do?" 
                              className="mb-4 text-sm bg-black/50 border-white/10 rounded-xl resize-none text-white placeholder:text-gray-600 focus:border-white/30 transition-colors h-24" 
                              value={reviewData[booking.id]?.comment || ''}
                              onChange={(e) => setReviewData({ ...reviewData, [booking.id]: { ...reviewData[booking.id], comment: e.target.value } })}
                            />
                            <Button 
                              className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl transition-colors" 
                              onClick={() => submitReview(booking.id)}
                              disabled={submittingReview === booking.id}
                            >
                              {submittingReview === booking.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Submit Review
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                  </>
                )}
              </Card>
            )})
          )}
          </TabsContent>

          <TabsContent value="garage" className="space-y-6">
            <Card className="bg-[#141414] border-white/10 shadow-2xl rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="font-heading text-2xl text-white">Add New Vehicle</CardTitle>
                <CardDescription className="text-gray-400 font-light">Save your vehicles for faster booking checkout.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Type *</label>
                    <Input value={newVehicle.type} onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})} placeholder="e.g. Sedan, SUV" required className="bg-black/50 border-white/10 rounded-xl h-12 text-white placeholder:text-gray-600 focus-visible:ring-white/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Make</label>
                    <Input value={newVehicle.make} onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})} placeholder="e.g. Toyota" className="bg-black/50 border-white/10 rounded-xl h-12 text-white placeholder:text-gray-600 focus-visible:ring-white/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Model</label>
                    <Input value={newVehicle.model} onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})} placeholder="e.g. RAV4" className="bg-black/50 border-white/10 rounded-xl h-12 text-white placeholder:text-gray-600 focus-visible:ring-white/20" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">License Plate</label>
                    <Input value={newVehicle.plateNumber} onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value})} placeholder="ABC-1234" className="bg-black/50 border-white/10 rounded-xl h-12 text-white placeholder:text-gray-600 focus-visible:ring-white/20 uppercase" />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <Button type="submit" disabled={addingVehicle} className="bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs h-12 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      {addingVehicle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Vehicle
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map((v) => (
                <Card key={v.id} className="relative overflow-hidden group bg-[#141414] border-white/5 shadow-xl rounded-2xl">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full h-8 w-8" onClick={() => handleDeleteVehicle(v.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                  <CardHeader className="pb-3 pt-5 relative z-10 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2 text-white font-heading">
                      <Car className="w-5 h-5 text-gray-400" />
                      {v.type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 relative z-10">
                    <div className="space-y-3">
                      {v.make && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Make</p>
                          <p className="text-sm font-medium text-white">{v.make}</p>
                        </div>
                      )}
                      {v.model && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Model</p>
                          <p className="text-sm font-medium text-white">{v.model}</p>
                        </div>
                      )}
                      {v.plateNumber && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Plate Number</p>
                          <p className="text-sm font-medium text-white uppercase">{v.plateNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {vehicles.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-16 border border-dashed border-white/10 rounded-3xl text-gray-500 font-light bg-[#141414]/50">
                  <Car className="w-10 h-10 mx-auto mb-4 opacity-20" />
                  No vehicles in your garage yet. Add one above!
                </div>
              )}
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {activeChat && (
        <ChatBox 
          bookingId={activeChat.bookingId} 
          partnerName={activeChat.partnerName}
          onClose={() => setActiveChat(null)}
        />
      )}

      <Dialog open={!!cancelModal} onOpenChange={() => setCancelModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking?
              {bookings.find(b => b.id === cancelModal)?.payment?.status === 'COMPLETED' && (
                <span className="block mt-2 text-green-600 font-medium bg-green-50 p-2 rounded-md border border-green-200">
                  Your payment has been processed. A full refund will be issued to your original payment method.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModal(null)} disabled={isProcessing}>Keep Booking</Button>
            <Button variant="destructive" onClick={() => cancelModal && handleCancel(cancelModal)} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rescheduleModal} onOpenChange={() => setRescheduleModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Select a new date and time for your booking.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="datetime-local" 
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleModal(null)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={() => rescheduleModal && handleReschedule(rescheduleModal)} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
              Confirm New Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
