"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
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
import { Trash2, Plus, MessageCircle } from "lucide-react";
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
  const [newVehicle, setNewVehicle] = useState({ type: '', make: '', model: '', plateNumber: '' });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [activeChat, setActiveChat] = useState<{ bookingId: string, partnerName: string } | null>(null);

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
    <div className="container mx-auto pt-28 pb-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">My Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>

          <Card className="border-primary/10 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader>
              <CardTitle className="text-lg">Profile Info</CardTitle>
            </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Name:</p>
              <p className="font-semibold">{user?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Email:</p>
              <p className="font-semibold">{user?.email}</p>
            </div>
            
            {user?.loyaltyPoints !== undefined && (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Loyalty Points:</p>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Zap className="w-3 h-3 mr-1" /> {user.loyaltyPoints}
                </Badge>
              </div>
            )}
            
            {user?.referralCode && (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Referral Code:</p>
                <code className="bg-muted px-2 py-0.5 rounded text-sm">{user.referralCode}</code>
              </div>
            )}

            <div className="pt-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {subscription && (
          <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-900/10 mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                Active Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <p className="font-semibold">{subscription.plan?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                <p className="font-semibold">{format(new Date(subscription.endDate), "PPP")}</p>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Right Column: Content */}
        <div className="md:col-span-3 space-y-4">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
              <TabsTrigger value="garage">My Garage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bookings" className="space-y-4">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Car className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium">No bookings yet</p>
                <p className="text-muted-foreground">You haven't booked any services yet.</p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl">{booking.service?.name}</h3>
                        <Badge className={
                          booking.status === 'COMPLETED' ? 'bg-green-500 hover:bg-green-600' :
                          booking.status === 'PENDING' ? 'bg-orange-500 hover:bg-orange-600' :
                          'bg-blue-500 hover:bg-blue-600'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(booking.bookingDate), "PPpp")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          <span>{booking.vehicleType} {booking.vehicleNumber ? `(${booking.vehicleNumber})` : ''}</span>
                        </div>
                        <div className="flex items-start gap-2 sm:col-span-2 mt-1">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{booking.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-6 sm:w-48 flex flex-col items-end justify-center border-t sm:border-t-0 sm:border-l">
                    <p className="text-sm text-muted-foreground font-medium mb-1">Total Amount</p>
                    <p className="text-3xl font-extrabold">${booking.totalAmount}</p>
                    {booking.coupon && (
                      <Badge variant="outline" className="mt-1 text-green-500 border-green-500/20 bg-green-500/10">
                        Coupon Applied
                      </Badge>
                    )}
                    <Badge variant="outline" className="mt-2 mb-4">
                      {booking.payment?.status || 'PENDING'}
                    </Badge>
                    {booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' ? (
                      <Button variant="outline" size="sm" className="w-full gap-2 border-blue-500 text-blue-600 hover:bg-blue-50" onClick={() => setActiveChat({ bookingId: booking.id, partnerName: booking.partner?.name || 'Partner' })}>
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Advanced Details: Images & Reviews */}
                {(booking.beforeImageUrl || booking.afterImageUrl || booking.status === 'COMPLETED') && (
                  <div className="border-t bg-muted/10 p-6">
                    {/* Images */}
                    {(booking.beforeImageUrl || booking.afterImageUrl) && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Camera className="w-4 h-4" /> Service Images
                        </h4>
                        <div className="flex gap-4">
                          {booking.beforeImageUrl && (
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Before</p>
                              <img src={booking.beforeImageUrl} alt="Before" className="w-full h-32 object-cover rounded-md" />
                            </div>
                          )}
                          {booking.afterImageUrl && (
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">After</p>
                              <img src={booking.afterImageUrl} alt="After" className="w-full h-32 object-cover rounded-md border-2 border-green-500/20" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {booking.status === 'COMPLETED' && (
                      <div>
                        {booking.review ? (
                          <div className="bg-muted/30 p-4 rounded-md">
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < booking.review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                            <p className="text-sm italic">"{booking.review.comment}"</p>
                          </div>
                        ) : (
                          <div className="bg-muted/30 p-4 rounded-md">
                            <h4 className="text-sm font-medium mb-3">Leave a Review</h4>
                            <div className="flex items-center gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-6 h-6 cursor-pointer hover:scale-110 transition-transform ${
                                    (reviewData[booking.id]?.rating || 0) >= star ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                                  }`} 
                                  onClick={() => setReviewData({ ...reviewData, [booking.id]: { ...reviewData[booking.id], rating: star } })}
                                />
                              ))}
                            </div>
                            <Textarea 
                              placeholder="How was the service?" 
                              className="mb-3 text-sm" 
                              value={reviewData[booking.id]?.comment || ''}
                              onChange={(e) => setReviewData({ ...reviewData, [booking.id]: { ...reviewData[booking.id], comment: e.target.value } })}
                            />
                            <Button 
                              size="sm" 
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
              </Card>
            ))
          )}
          </TabsContent>

          <TabsContent value="garage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Vehicle</CardTitle>
                <CardDescription>Save your vehicles for faster booking checkout.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type (e.g., Sedan, SUV) *</label>
                    <Input value={newVehicle.type} onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})} placeholder="SUV" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Make (e.g., Toyota)</label>
                    <Input value={newVehicle.make} onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})} placeholder="Toyota" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model (e.g., RAV4)</label>
                    <Input value={newVehicle.model} onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})} placeholder="RAV4" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">License Plate</label>
                    <Input value={newVehicle.plateNumber} onChange={(e) => setNewVehicle({...newVehicle, plateNumber: e.target.value})} placeholder="ABC-1234" />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <Button type="submit" disabled={addingVehicle}>
                      {addingVehicle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Vehicle
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map((v) => (
                <Card key={v.id} className="relative overflow-hidden group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20" onClick={() => handleDeleteVehicle(v.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      {v.type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {v.make && <p><span className="font-medium text-foreground">Make:</span> {v.make}</p>}
                      {v.model && <p><span className="font-medium text-foreground">Model:</span> {v.model}</p>}
                      {v.plateNumber && <p><span className="font-medium text-foreground">Plate:</span> {v.plateNumber}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {vehicles.length === 0 && (
                <div className="sm:col-span-2 text-center p-8 border border-dashed rounded-lg text-muted-foreground">
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
    </div>
  );
}
