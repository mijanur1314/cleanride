"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Eye, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const limit = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users?page=${page}&limit=${limit}`);
      setUsers(res.data.data.users);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const verifyPartner = async (userId: string, isVerified: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/verify`, { isVerified });
      toast.success(`Partner ${isVerified ? 'verified' : 'unverified'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update partner verification status");
    }
  };

  const toggleBan = async (userId: string, isBanned: boolean) => {
    try {
      await api.patch(`/users/${userId}/ban`, { isBanned });
      toast.success(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user ban status");
    }
  };

  const customers = users.filter((u) => u.role === 'USER');
  const partners = users.filter((u) => u.role === 'PARTNER');

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div>
        <h1 className="text-4xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Users & Partners
        </h1>
        <p className="text-gray-400 mt-2 font-medium tracking-wide text-sm">Manage all registered accounts on the platform.</p>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="mb-6 bg-black/40 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
            Customers ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="partners" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">
            Service Partners ({partners.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers" className="mt-0">
          <Card className="bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Customers</CardTitle>
              <CardDescription>Users who book services.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto rounded-xl border border-white/5 bg-black/20">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Name</TableHead>
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Email</TableHead>
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">CleanCoins</TableHead>
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Joined Date</TableHead>
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Status</TableHead>
                      <TableHead className="h-14 px-6 text-right align-middle font-semibold text-gray-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((u) => (
                      <TableRow key={u.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.04]">
                        <TableCell className="p-5 align-middle font-bold text-gray-200">{u.name}</TableCell>
                        <TableCell className="p-5 align-middle text-gray-400">{u.email}</TableCell>
                        <TableCell className="p-5 align-middle">
                          <Badge variant="outline" className="text-blue-400 font-bold border-blue-500/20 bg-blue-500/10 px-3 py-1">
                            {u.loyaltyPoints} pts
                          </Badge>
                        </TableCell>
                        <TableCell className="p-5 align-middle text-gray-400">{format(new Date(u.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell className="p-5 align-middle">
                          {u.isBanned ? (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 font-semibold">Banned</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 font-semibold">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="p-5 align-middle text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleBan(u.id, !u.isBanned)}
                            className={`border-white/10 ${u.isBanned ? "bg-white/5 text-gray-300 hover:text-white" : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"}`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {customers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-8 text-center text-gray-500">No customers found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="mt-0">
          <Card className="bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Service Partners</CardTitle>
              <CardDescription>Your workforce assigned to bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto rounded-xl border border-white/5 bg-black/20">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Name</TableHead>
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Email</TableHead>
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Joined Date</TableHead>
                      <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Verification</TableHead>
                      <TableHead className="h-14 px-6 text-right align-middle font-semibold text-gray-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((p) => (
                      <TableRow key={p.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.04]">
                        <TableCell className="p-5 align-middle font-bold text-gray-200">{p.name}</TableCell>
                        <TableCell className="p-5 align-middle text-gray-400">{p.email}</TableCell>
                        <TableCell className="p-5 align-middle text-gray-400">{format(new Date(p.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell className="p-5 align-middle">
                          {p.isBanned ? (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 font-semibold">Banned</Badge>
                          ) : p.isVerified ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 font-semibold">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 py-1 font-semibold">Pending Approval</Badge>
                          )}
                        </TableCell>
                        <TableCell className="p-5 align-middle text-right">
                          {!p.isVerified ? (
                            <div className="flex justify-end gap-2">
                              {p.kycDocumentUrl && (
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => window.open(p.kycDocumentUrl, '_blank')}
                                    title="View KYC Document"
                                    className="bg-white/5 border-white/10 hover:bg-white/10"
                                  >
                                    <Eye className="w-4 h-4 text-blue-400" />
                                  </Button>
                                  {p.kycSelfieUrl && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => window.open(p.kycSelfieUrl, '_blank')}
                                      title="View Selfie"
                                      className="bg-white/5 border-white/10 hover:bg-white/10"
                                    >
                                      <Camera className="w-4 h-4 text-purple-400" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              <Button size="sm" onClick={() => verifyPartner(p.id, true)} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20">Approve</Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {p.isBanned ? (
                                <Button size="sm" variant="outline" onClick={() => toggleBan(p.id, false)} className="bg-white/5 border-white/10 text-gray-300 hover:text-white">Unban</Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => toggleBan(p.id, true)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">Ban</Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => verifyPartner(p.id, false)} className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20">Revoke Verification</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {partners.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-8 text-center text-gray-500">No partners found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-xl p-4 mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-sm font-semibold text-gray-400">
            Page <span className="text-white">{pagination.page}</span> of <span className="text-white">{pagination.pages}</span>
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
