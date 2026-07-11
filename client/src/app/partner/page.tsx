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

export default function PartnerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: { before: string, after: string } }>({});
  const [uploadingImages, setUploadingImages] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'PARTNER') {
      router.push("/login");
      return;
    }

    fetchBookings();
  }, [isAuthenticated, user, router]);

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

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success("Status updated successfully");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const submitImages = async (id: string) => {
    const urls = imageUrls[id];
    if (!urls || (!urls.before && !urls.after)) {
      toast.error("Please provide at least one image URL");
      return;
    }
    
    setUploadingImages(id);
    try {
      await api.patch(`/bookings/${id}/images`, { 
        beforeImageUrl: urls.before || undefined, 
        afterImageUrl: urls.after || undefined 
      });
      toast.success("Images uploaded successfully");
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

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
        <p className="text-muted-foreground">Manage your assigned services</p>
      </div>

      <div className="space-y-6">
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
                </CardContent>
                <CardFooter className="bg-muted/30 border-t flex-col items-start gap-4 p-4">
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-muted-foreground" /> Service Images (URLs)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <Input 
                          placeholder="Before image URL" 
                          className="text-xs h-9" 
                          value={imageUrls[booking.id]?.before || booking.beforeImageUrl || ''}
                          onChange={(e) => setImageUrls({ ...imageUrls, [booking.id]: { ...imageUrls[booking.id], before: e.target.value } })}
                        />
                      </div>
                      <div>
                        <Input 
                          placeholder="After image URL" 
                          className="text-xs h-9"
                          value={imageUrls[booking.id]?.after || booking.afterImageUrl || ''}
                          onChange={(e) => setImageUrls({ ...imageUrls, [booking.id]: { ...imageUrls[booking.id], after: e.target.value } })}
                        />
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => submitImages(booking.id)}
                      disabled={uploadingImages === booking.id}
                    >
                      {uploadingImages === booking.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Images
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
