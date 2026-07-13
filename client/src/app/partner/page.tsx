"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, CheckCircle2, Camera } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function PartnerDashboard() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<{ [key: string]: { before: File | null, after: File | null } }>({});
  const [uploadingImages, setUploadingImages] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ bookingId: string, userName: string } | null>(null);

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
      setImages(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [type]: file
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

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const lifetimeEarnings = completedBookings.reduce((sum, b) => sum + (b.totalAmount * 0.7), 0);

  return (
    <div className="container mx-auto pt-28 pb-12 px-4">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
          <p className="text-muted-foreground">Manage your assigned services</p>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="jobs">Assigned Jobs</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Live Service Map</h2>
            <Card className="p-1 mb-8 shadow-sm">
              <Map bookings={bookings.filter(b => b.status !== 'COMPLETED')} />
            </Card>

            <h2 className="text-2xl font-bold tracking-tight mb-4">Assigned Bookings</h2>
            
            {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4 opacity-50" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground">You don't have any pending assignments.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-t-4 border-t-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{booking.service?.name}</CardTitle>
                    <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium pt-1">Customer: {booking.user?.name}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-foreground">{format(new Date(booking.bookingDate), "PPpp")}</span>
                    </div>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{booking.address}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-sm font-medium">Update Status</label>
                    <Select defaultValue={booking.status} onValueChange={(val) => updateStatus(booking.id, val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' ? (
                    <Button variant="outline" size="sm" className="w-full gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 mt-2" onClick={() => setActiveChat({ bookingId: booking.id, userName: booking.user?.name || 'Customer' })}>
                      <MessageCircle className="w-4 h-4" />
                      Chat with Customer
                    </Button>
                  ) : null}
                </CardContent>
                <CardFooter className="bg-muted/30 border-t flex-col items-start gap-4 p-4">
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-muted-foreground" /> Service Images
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Before Wash</label>
                        {booking.beforeImageUrl ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium">Uploaded</span>
                          </div>
                        ) : (
                          <Input 
                            type="file" 
                            accept="image/*"
                            className="text-xs h-9 cursor-pointer" 
                            onChange={(e) => handleFileChange(booking.id, 'before', e.target.files?.[0])}
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">After Wash</label>
                        {booking.afterImageUrl ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium">Uploaded</span>
                          </div>
                        ) : (
                          <Input 
                            type="file"
                            accept="image/*"
                            className="text-xs h-9 cursor-pointer"
                            onChange={(e) => handleFileChange(booking.id, 'after', e.target.files?.[0])}
                          />
                        )}
                      </div>
                    </div>
                    
                    {(!booking.beforeImageUrl || !booking.afterImageUrl) && (
                      <Button 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => submitImages(booking.id)}
                        disabled={uploadingImages === booking.id || !images[booking.id]}
                      >
                        {uploadingImages === booking.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Upload Images
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
          </div>
        </TabsContent>

        <TabsContent value="earnings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Lifetime Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-extrabold text-primary">${lifetimeEarnings.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-2">Calculated at 70% commission rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available for Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-extrabold">${lifetimeEarnings > 0 ? (lifetimeEarnings * 0.4).toFixed(2) : '0.00'}</div>
                <p className="text-sm text-muted-foreground mt-2">Funds settled in the last 7 days</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={lifetimeEarnings === 0}
                  onClick={() => toast.success('Withdrawal request submitted! Funds will arrive in 2-3 business days.')}
                >
                  Withdraw Funds
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight mb-4">Earning History</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {completedBookings.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No completed jobs yet.</div>
                ) : (
                  completedBookings.map(b => (
                    <div key={b.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="font-semibold">{b.service?.name}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(b.bookingDate), "MMM d, yyyy")}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-500">+${(b.totalAmount * 0.7).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Booking: ${b.totalAmount}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {activeChat && (
        <ChatBox 
          bookingId={activeChat.bookingId} 
          userName={activeChat.userName}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
