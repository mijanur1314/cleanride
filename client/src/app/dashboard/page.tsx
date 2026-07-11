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

export default function UserDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewData, setReviewData] = useState<{ [key: string]: { rating: number, comment: string } }>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [bookingsRes, subRes] = await Promise.all([
          api.get("/bookings/my-bookings"),
          api.get("/subscriptions/my-subscription").catch(() => ({ data: { data: { subscription: null } } }))
        ]);
        setBookings(bookingsRes.data.data.bookings);
        setSubscription(subRes.data.data.subscription);
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(null);
    }
  };

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="md:col-span-1 border-primary/10 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-lg">Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-semibold">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-semibold">{user?.email}</p>
            </div>
            <div className="pt-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {user?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {subscription && (
          <Card className="md:col-span-1 border-green-500/20 bg-green-50/50 dark:bg-green-900/10 mt-6">
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

        <div className="md:col-span-3 space-y-4 md:row-span-2">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Bookings</h2>
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
                    <Badge variant="outline" className="mt-2">
                      {booking.payment?.status || 'PENDING'}
                    </Badge>
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
        </div>
      </div>
    </div>
  );
}
