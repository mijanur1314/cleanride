"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarCheck, DollarSign, Activity, Loader2, AlertCircle, TrendingUp, Medal, CheckCircle2 } from "lucide-react";
import { format, isPast, addHours } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Star } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIReviewSummary } from "@/components/AIReviewSummary";

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
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="relative w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentBookings, revenueByDay, topPartners, assignmentQueue, availablePartners, vehicleDistribution, serviceDistribution } = data;

  const PREMIUM_COLORS = ['#38bdf8', '#c084fc', '#fbbf24', '#34d399', '#f472b6'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div>
        <h1 className="text-4xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Command Center
        </h1>
        <p className="text-gray-400 mt-2 font-medium tracking-wide text-sm">Real-time telemetry and operational intelligence.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl hover:border-blue-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Gross Revenue</CardTitle>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold font-heading text-white">₹{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl hover:border-purple-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Bookings</CardTitle>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-500">
              <CalendarCheck className="w-4 h-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold font-heading text-white">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl hover:border-green-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Active Customers</CardTitle>
            <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-xl group-hover:scale-110 transition-transform duration-500">
              <Users className="w-4 h-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold font-heading text-white">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl hover:border-amber-500/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">Service Partners</CardTitle>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-500">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold font-heading text-white">{stats.totalPartners}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="col-span-1 lg:col-span-2 bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              7-Day Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByDay ? [...revenueByDay].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    dy={10}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(val) => `₹${val}`}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                    itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#38bdf8" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Partners Leaderboard */}
        <Card className="bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg relative z-10">
              <Medal className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              Elite Partners
            </CardTitle>
            <CardDescription className="relative z-10">Most completed jobs this week</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {topPartners?.map((partner: any, idx: number) => (
                <div key={partner.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold shadow-lg ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-500 text-black drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 
                      idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black drop-shadow-[0_0_10px_rgba(148,163,184,0.3)]' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-black drop-shadow-[0_0_10px_rgba(251,146,60,0.3)]' : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-100 group-hover:text-white transition-colors">{partner.name}</p>
                      <p className="text-[11px] text-gray-500 tracking-wide">{partner.email}</p>
                    </div>
                  </div>
                  <Badge className="font-bold bg-white/10 text-white hover:bg-white/20 px-3 py-1 border-0">
                    {partner.completedJobs} jobs
                  </Badge>
                </div>
              ))}
              {(!topPartners || topPartners.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8">No completed jobs yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Distribution Chart */}
        <Card className="bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 blur-[60px] pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg relative z-10">
              <Car className="w-5 h-5 text-purple-400" />
              Vehicle Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={6}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    stroke="none"
                  >
                    {(vehicleDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Package Popularity */}
        <Card className="bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-pink-500/10 blur-[60px] pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg relative z-10">
              <Star className="w-5 h-5 text-pink-400" />
              Top Services
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceDistribution || []} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} stroke="#6b7280" />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                    {(serviceDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[(index + 2) % PREMIUM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Operations & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Operations Queue */}
        <Card className="col-span-1 lg:col-span-2 bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Operations & Dispatch</CardTitle>
          <CardDescription>Manage incoming bookings and dispatch partners</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="mb-6 bg-black/40 border border-white/5 p-1 rounded-xl">
              <TabsTrigger value="queue" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
                Assignment Queue
                {assignmentQueue?.length > 0 && (
                  <Badge className="ml-2 w-5 h-5 p-0 flex items-center justify-center rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                    {assignmentQueue.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="recent" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
                Recent History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-0">
              <div className="relative w-full overflow-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b border-white/5 bg-white/[0.02]">
                    <tr className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Service Date</th>
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Customer & Service</th>
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Status</th>
                      <th className="h-14 px-6 text-right align-middle font-semibold text-gray-400">Assign Partner</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {assignmentQueue?.map((booking: any) => {
                      const isDelayed = isPast(addHours(new Date(booking.bookingDate), -2)); // Alert if within 2 hours or past
                      
                      return (
                        <tr key={booking.id} className={`border-b border-white/5 transition-colors hover:bg-white/[0.04] ${isDelayed ? 'bg-red-950/20' : ''}`}>
                          <td className="p-6 align-middle">
                            <div className="font-bold text-gray-200">{format(new Date(booking.bookingDate), "MMM d, h:mm a")}</div>
                            {isDelayed && (
                              <div className="flex items-center text-[11px] uppercase tracking-widest text-red-400 mt-2 font-bold">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Action Required
                              </div>
                            )}
                          </td>
                          <td className="p-6 align-middle">
                            <div className="font-bold text-gray-200">{booking.user?.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{booking.service?.name}</div>
                          </td>
                          <td className="p-6 align-middle">
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1 font-semibold">
                              Awaiting Dispatch
                            </Badge>
                          </td>
                          <td className="p-6 align-middle text-right flex justify-end">
                            <div className="w-[220px] flex items-center gap-3">
                              <Select onValueChange={(val) => handleAssignPartner(booking.id, val)} disabled={assigningId === booking.id}>
                                <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white rounded-xl focus:ring-1 focus:ring-white/20">
                                  <SelectValue placeholder="Select partner..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111] border-white/10 rounded-xl shadow-2xl text-white">
                                  {availablePartners?.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id} className="focus:bg-white/10 rounded-lg cursor-pointer my-1">{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {assigningId === booking.id && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!assignmentQueue || assignmentQueue.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-gray-500">
                          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500/50 mb-4 opacity-80" />
                          <p className="font-medium text-lg text-gray-400">All caught up!</p>
                          <p className="text-sm mt-1">No pending assignments in the queue.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-0">
              <div className="relative w-full overflow-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b border-white/5 bg-white/[0.02]">
                    <tr className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Customer</th>
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Service</th>
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Date</th>
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Amount</th>
                      <th className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {recentBookings?.map((booking: any) => (
                      <tr key={booking.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.04]">
                        <td className="p-5 align-middle font-bold text-gray-200">
                          {booking.user?.name || "Unknown"}
                        </td>
                        <td className="p-5 align-middle text-gray-300">{booking.service?.name}</td>
                        <td className="p-5 align-middle text-gray-400">
                          {format(new Date(booking.bookingDate), "MMM d, yyyy")}
                        </td>
                        <td className="p-5 align-middle font-bold text-white">₹{booking.totalAmount}</td>
                        <td className="p-5 align-middle">
                          <Badge variant="outline" className={`px-3 py-1 font-semibold ${
                            booking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            booking.status === 'CONFIRMED' || booking.status === 'PARTNER_ASSIGNED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                            {booking.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!recentBookings || recentBookings.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">No recent bookings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

        {/* AI Review Summary */}
        <div className="col-span-1">
          <AIReviewSummary />
        </div>
      </div>
    </div>
  );
}
