"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarCheck, DollarSign, Activity, Loader2, AlertCircle, TrendingUp, Medal, CheckCircle2 } from "lucide-react";
import { format, isPast, addHours } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setData(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch admin stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll every 30 seconds for live operations queue updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignPartner = async (bookingId: string, partnerId: string) => {
    if (!partnerId) return;
    setAssigningId(bookingId);
    try {
      await api.patch(`/admin/bookings/${bookingId}/assign`, { partnerId });
      toast.success("Partner assigned successfully");
      // Refresh data
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign partner");
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentBookings, revenueByDay, topPartners, assignmentQueue, availablePartners } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold">Operations Center</h1>
        <p className="text-muted-foreground mt-1">Real-time metrics, assignments, and performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 shadow-xl hover:bg-[#0f0f0f] transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">₹{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 shadow-xl hover:bg-[#0f0f0f] transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <CalendarCheck className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 shadow-xl hover:bg-[#0f0f0f] transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Users className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 shadow-xl hover:bg-[#0f0f0f] transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Service Partners</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.totalPartners}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="col-span-1 lg:col-span-2 bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              7-Day Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay ? [...revenueByDay].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) : []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-primary, #3b82f6)" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Partners Leaderboard */}
        <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-500" />
              Top Partners
            </CardTitle>
            <CardDescription>Most completed jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPartners?.map((partner: any, idx: number) => (
                <div key={partner.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      idx === 1 ? 'bg-slate-200 text-slate-700' :
                      idx === 2 ? 'bg-amber-100/50 text-amber-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">{partner.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {partner.completedJobs} jobs
                  </Badge>
                </div>
              ))}
              {(!topPartners || topPartners.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No completed jobs yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Queue */}
      <Card className="bg-[#0A0A0A]/60 backdrop-blur-md border-white/5 shadow-xl">
        <CardHeader>
          <CardTitle>Operations & Dispatch</CardTitle>
          <CardDescription>Manage incoming bookings and dispatch partners</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="queue">
                Assignment Queue
                {assignmentQueue?.length > 0 && (
                  <Badge variant="destructive" className="ml-2 w-5 h-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                    {assignmentQueue.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="recent">Recent History</TabsTrigger>
            </TabsList>

            <TabsContent value="queue">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer & Service</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Assign Partner</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {assignmentQueue?.map((booking: any) => {
                      const isDelayed = isPast(addHours(new Date(booking.bookingDate), -2)); // Alert if within 2 hours or past
                      
                      return (
                        <tr key={booking.id} className={`border-b transition-colors hover:bg-muted/50 ${isDelayed ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                          <td className="p-4 align-middle">
                            <div className="font-medium">{format(new Date(booking.bookingDate), "MMM d, h:mm a")}</div>
                            {isDelayed && (
                              <div className="flex items-center text-xs text-red-600 mt-1 font-medium">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Action Required
                              </div>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="font-medium">{booking.user?.name}</div>
                            <div className="text-xs text-muted-foreground">{booking.service?.name}</div>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                              Awaiting Dispatch
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-right flex justify-end">
                            <div className="w-[200px] flex items-center gap-2">
                              <Select onValueChange={(val) => handleAssignPartner(booking.id, val)} disabled={assigningId === booking.id}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select partner..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availablePartners?.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {assigningId === booking.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!assignmentQueue || assignmentQueue.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2 opacity-50" />
                          All caught up! No pending assignments.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="recent">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {recentBookings?.map((booking: any) => (
                      <tr key={booking.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">
                          {booking.user?.name || "Unknown"}
                        </td>
                        <td className="p-4 align-middle">{booking.service?.name}</td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {format(new Date(booking.bookingDate), "MMM d, yyyy")}
                        </td>
                        <td className="p-4 align-middle font-medium">₹{booking.totalAmount}</td>
                        <td className="p-4 align-middle">
                          <Badge variant={
                            booking.status === 'COMPLETED' ? 'default' :
                            booking.status === 'CONFIRMED' || booking.status === 'PARTNER_ASSIGNED' ? 'secondary' :
                            booking.status === 'CANCELLED' ? 'destructive' : 'outline'
                          }>
                            {booking.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!recentBookings || recentBookings.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No recent bookings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
