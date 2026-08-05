"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Package, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Box,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', stockLevel: 0 });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['adminInventoryItems'],
    queryFn: async () => {
      const res = await api.get('/inventory/items');
      return res.data.data.items;
    }
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['adminInventoryRequests'],
    queryFn: async () => {
      const res = await api.get('/inventory/requests');
      return res.data.data.requests;
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: typeof newItem) => {
      const res = await api.post('/inventory/items', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Supply item added successfully");
      setIsAddItemOpen(false);
      setNewItem({ name: '', description: '', stockLevel: 0 });
      queryClient.invalidateQueries({ queryKey: ['adminInventoryItems'] });
    },
    onError: () => toast.error("Failed to add item")
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/items/${id}`);
    },
    onSuccess: () => {
      toast.success("Supply item deleted");
      queryClient.invalidateQueries({ queryKey: ['adminInventoryItems'] });
    },
    onError: () => toast.error("Failed to delete item")
  });

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/inventory/requests/${id}`, { status });
      toast.success(`Request marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ['adminInventoryRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminInventoryItems'] });
    } catch (e) {
      toast.error("Failed to update request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'APPROVED': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'FULFILLED': return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Fulfilled</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage cleaning supplies and partner requests</p>
        </div>
        
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-white/10 shadow-lg font-bold tracking-wide">
              <Plus className="w-4 h-4 mr-2" /> Add Supply Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supply Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g., Premium Wax 1L" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Optional description" />
              </div>
              <div className="space-y-2">
                <Label>Initial Stock Level</Label>
                <Input type="number" min="0" value={newItem.stockLevel} onChange={e => setNewItem({...newItem, stockLevel: parseInt(e.target.value) || 0})} />
              </div>
              <Button onClick={() => addItemMutation.mutate(newItem)} disabled={!newItem.name || addItemMutation.isPending} className="w-full">
                {addItemMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="requests"><Package className="w-4 h-4 mr-2" /> Partner Requests</TabsTrigger>
          <TabsTrigger value="inventory"><Box className="w-4 h-4 mr-2" /> Master Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Supply Requests</CardTitle>
              <CardDescription>Review and fulfill items requested by partners.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                  <Package className="w-12 h-12 mb-3 text-muted" />
                  <p>No supply requests found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                      <tr>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Partner</th>
                        <th className="px-6 py-3 font-medium">Item & Qty</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {requests.map((req: any) => (
                        <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{format(new Date(req.createdAt), 'MMM d, h:mm a')}</td>
                          <td className="px-6 py-4 font-medium">{req.partner?.name || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-foreground">{req.item?.name}</span>
                            <span className="text-muted-foreground ml-2">x{req.quantity}</span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <Select 
                              defaultValue={req.status} 
                              onValueChange={(val) => updateRequestStatus(req.id, val)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs ml-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approve</SelectItem>
                                <SelectItem value="FULFILLED">Mark Fulfilled</SelectItem>
                                <SelectItem value="REJECTED">Reject</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingItems ? (
              <div className="col-span-3 py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : items.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-muted-foreground flex flex-col items-center bg-card rounded-lg border shadow-sm">
                <Box className="w-12 h-12 mb-3 text-muted" />
                <p>Your inventory is empty. Add some supplies!</p>
              </div>
            ) : (
              items.map((item: any) => (
                <Card key={item.id} className="bg-[#0A0A0A] border-white/10 shadow-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300">
                        <Box className="w-5 h-5" />
                      </div>
                      <Badge className={item.stockLevel > 10 ? 'bg-zinc-800 text-zinc-300 border-white/10' : item.stockLevel > 0 ? 'bg-yellow-900/30 text-yellow-500 border-yellow-900/50' : 'bg-red-900/30 text-red-500 border-red-900/50'}>
                        {item.stockLevel} in stock
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg font-heading text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description || 'No description provided.'}</p>
                    <div className="mt-6 flex gap-2 w-full">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent border-white/10 text-gray-300 hover:bg-white/5 hover:text-white" onClick={() => {
                        api.patch(`/inventory/items/${item.id}`, { stockLevel: item.stockLevel + 10 })
                           .then(() => queryClient.invalidateQueries({queryKey: ['adminInventoryItems']}));
                      }}>
                        +10 Stock
                      </Button>
                      <Button variant="outline" size="sm" className="w-10 flex-shrink-0 px-0 bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => {
                        if (confirm('Are you sure you want to delete this item?')) {
                          deleteItemMutation.mutate(item.id);
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
