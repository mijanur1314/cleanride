"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Eye, Camera } from "lucide-react";
import { format } from "date-fns";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data.users);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold">Users & Partners</h1>
        <p className="text-muted-foreground mt-1">Manage all registered accounts on the platform.</p>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="partners">Service Partners ({partners.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Users who book services.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CleanCoins</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-primary font-bold border-primary/20 bg-primary/10">
                            {u.loyaltyPoints} pts
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(u.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {u.isBanned ? (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Banned</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant={u.isBanned ? "outline" : "destructive"} 
                            onClick={() => toggleBan(u.id, !u.isBanned)}
                            className={u.isBanned ? "text-green-500 hover:text-green-600" : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Service Partners</CardTitle>
              <CardDescription>Your workforce assigned to bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{format(new Date(p.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {p.isBanned ? (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Banned</Badge>
                          ) : p.isVerified ? (
                            <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Verified</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending Approval</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!p.isVerified ? (
                            <div className="flex justify-end gap-2">
                              {p.kycDocumentUrl && (
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => window.open(p.kycDocumentUrl, '_blank')}
                                    title="View KYC Document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {p.kycSelfieUrl && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => window.open(p.kycSelfieUrl, '_blank')}
                                      title="View Selfie"
                                    >
                                      <Camera className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              <Button size="sm" onClick={() => verifyPartner(p.id, true)} className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {p.isBanned ? (
                                <Button size="sm" variant="outline" onClick={() => toggleBan(p.id, false)} className="text-green-500 hover:text-green-600">Unban</Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => toggleBan(p.id, true)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white">Ban</Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => verifyPartner(p.id, false)} className="text-yellow-600 hover:text-yellow-700">Revoke Verification</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
