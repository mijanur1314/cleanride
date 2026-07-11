"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, usersRes] = await Promise.all([
        api.get("/admin/bookings"),
        api.get("/admin/users") // To get partners for assignment
      ]);
      setBookings(bookingsRes.data.data.bookings);
      setPartners(usersRes.data.data.users.filter((u: any) => u.role === 'PARTNER'));
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const assignPartner = async (bookingId: string, partnerId: string) => {
    try {
      await api.patch(`/admin/bookings/${bookingId}/assign`, { partnerId });
      toast.success("Partner assigned successfully");
      fetchData(); // Refresh list
    } catch (error) {
      toast.error("Failed to assign partner");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold">Manage Bookings</h1>
        <p className="text-muted-foreground mt-1">View all bookings and assign service partners.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Comprehensive list of customer bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.user?.name}
                      <span className="block text-xs text-muted-foreground font-normal">{booking.user?.email}</span>
                    </TableCell>
                    <TableCell>
                      {booking.service?.name}
                      {booking.addons?.length > 0 && (
                        <span className="block text-xs text-muted-foreground font-normal">
                          +{booking.addons.length} Add-on(s)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(booking.bookingDate), "MMM d, h:mm a")}</TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === 'COMPLETED' ? 'default' :
                        booking.status === 'CONFIRMED' ? 'secondary' :
                        booking.status === 'CANCELLED' ? 'destructive' : 'outline'
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{booking.partner ? booking.partner.name : <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                    <TableCell className="text-right">
                      {(!booking.partner || booking.status === 'PENDING') ? (
                        <Select onValueChange={(val) => assignPartner(booking.id, val)}>
                          <SelectTrigger className="w-[140px] ml-auto h-8 text-xs">
                            <SelectValue placeholder="Assign Partner" />
                          </SelectTrigger>
                          <SelectContent>
                            {partners.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>Assigned</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No bookings found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
