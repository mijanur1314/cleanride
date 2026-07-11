"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Users, Briefcase, CreditCard, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const [bookingsRes, usersRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/users")
      ]);
      setBookings(bookingsRes.data.data.bookings);
      const allUsers = usersRes.data.data.users;
      setUsers(allUsers.filter((u: any) => u.role === 'USER'));
      setPartners(allUsers.filter((u: any) => u.role === 'PARTNER'));
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const assignPartner = async (bookingId: string, partnerId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/assign`, { partnerId });
      toast.success("Partner assigned successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to assign partner");
    }
  };

  const totalRevenue = bookings.reduce((acc, curr) => curr.payment?.status === 'COMPLETED' ? acc + curr.totalAmount : acc, 0);

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground">Manage your entire platform from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Bookings" value={bookings.length.toString()} icon={<Briefcase className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Total Revenue" value={`$${totalRevenue}`} icon={<CreditCard className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Total Users" value={users.length.toString()} icon={<Users className="w-4 h-4 text-muted-foreground" />} />
        <StatCard title="Active Partners" value={partners.length.toString()} icon={<CheckCircle2 className="w-4 h-4 text-muted-foreground" />} />
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>View and manage all customer bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead className="text-right">Assign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.user?.name}</TableCell>
                      <TableCell>{booking.service?.name}</TableCell>
                      <TableCell>{format(new Date(booking.bookingDate), "MMM d, h:mm a")}</TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>{booking.status}</Badge>
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{format(new Date(u.createdAt), "PPP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{format(new Date(p.createdAt), "PPP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
