"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, DollarSign, Activity, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentBookings } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <CalendarCheck className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">+4 new today</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <Users className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Service Partners</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.totalPartners}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">
                      {booking.user?.name || "Unknown"}
                      <span className="block text-xs text-muted-foreground font-normal">{booking.user?.email}</span>
                    </td>
                    <td className="p-4 align-middle">{booking.service?.name || "Custom"}</td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {format(new Date(booking.bookingDate), "MMM d, yyyy")}
                    </td>
                    <td className="p-4 align-middle font-medium">₹{booking.totalAmount}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={
                        booking.status === 'COMPLETED' ? 'default' :
                        booking.status === 'CONFIRMED' ? 'secondary' :
                        booking.status === 'CANCELLED' ? 'destructive' : 'outline'
                      }>
                        {booking.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">No recent bookings found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
