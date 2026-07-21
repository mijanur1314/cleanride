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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">Manage wash packages and pricing</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Express Wash"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  required 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the wash package..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    min="1" 
                    required 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (mins)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min="1" 
                    required 
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input 
                  id="imageUrl" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active (Visible to customers)</Label>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full">
                  {editingId ? "Save Changes" : "Create Service"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>A list of all services you currently offer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{service.description}</div>
                    </TableCell>
                    <TableCell>{service.duration} mins</TableCell>
                    <TableCell className="font-medium text-green-600">₹{service.price}</TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEdit(service)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
