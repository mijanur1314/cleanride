"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 0,
    imageUrl: "",
    isActive: true,
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices(res.data.data.services);
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", price: 0, duration: 0, imageUrl: "", isActive: true });
    setIsOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      imageUrl: service.imageUrl || "",
      isActive: service.isActive,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
      };

      if (editingId) {
        await api.patch(`/services/${editingId}`, payload);
        toast.success("Service updated successfully");
      } else {
        await api.post("/services", payload);
        toast.success("Service created successfully");
      }
      setIsOpen(false);
      fetchServices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save service");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success("Service deleted");
      fetchServices();
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
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

      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-4xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Services
          </h1>
          <p className="text-gray-400 mt-2 font-medium tracking-wide text-sm">Manage wash packages and pricing.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#111] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Service Name</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Express Wash"
                  className="bg-black/50 border-white/10 text-white placeholder:text-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea 
                  id="description" 
                  required 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the wash package..."
                  className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-300">Price (₹)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    min="1" 
                    required 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-gray-300">Duration (mins)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min="1" 
                    required 
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                    className="bg-black/50 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-gray-300">Image URL (Optional)</Label>
                <Input 
                  id="imageUrl" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://..."
                  className="bg-black/50 border-white/10 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-600 bg-black/50"
                />
                <Label htmlFor="isActive" className="cursor-pointer text-gray-300">Active (Visible to customers)</Label>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {editingId ? "Save Changes" : "Create Service"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#0A0A0A]/80 backdrop-blur-xl border-white/5 shadow-2xl relative z-10">
        <CardHeader>
          <CardTitle className="text-xl text-white">All Services</CardTitle>
          <CardDescription className="text-gray-400">A list of all services you currently offer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto rounded-xl border border-white/5 bg-black/20">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 hover:bg-transparent">
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Service</TableHead>
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Duration</TableHead>
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Price</TableHead>
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-400">Status</TableHead>
                  <TableHead className="h-14 px-6 text-right align-middle font-semibold text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.04]">
                    <TableCell className="p-5 align-middle">
                      <div className="font-bold text-gray-200">{service.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1 max-w-xs mt-1">{service.description}</div>
                    </TableCell>
                    <TableCell className="p-5 align-middle text-gray-400 font-medium">{service.duration} mins</TableCell>
                    <TableCell className="p-5 align-middle font-bold text-green-400">₹{service.price}</TableCell>
                    <TableCell className="p-5 align-middle">
                      <Badge variant="outline" className={`px-3 py-1 font-semibold ${
                        service.isActive 
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }`}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-5 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEdit(service)} className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="bg-red-500/10 border-red-500/20 text-red-400 hover:text-white hover:bg-red-500/30" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-gray-500">
                      No services found. Click "Add Service" to create one.
                    </TableCell>
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
