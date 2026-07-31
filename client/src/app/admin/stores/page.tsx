"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, MapPin, Search, AlertCircle, Power, Building2, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function AdminStoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/stores");
      setStores(res.data.data.stores);
    } catch (error) {
      toast.error("Failed to load stores");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !city || !state || !zipCode) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsCreating(true);
    try {
      await api.post("/stores", { name, address, city, state, zipCode });
      toast.success("Location created successfully");
      setIsCreateOpen(false);
      setName(""); setAddress(""); setCity(""); setState(""); setZipCode("");
      fetchStores();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create location");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/stores/${id}`, { isActive: !currentStatus });
      setStores(stores.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
      toast.success(currentStatus ? "Location closed" : "Location opened");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this location? This action cannot be undone.")) return;
    try {
      await api.delete(`/stores/${id}`);
      setStores(stores.filter(s => s.id !== id));
      toast.success("Location deleted successfully");
    } catch (error) {
      toast.error("Failed to delete location");
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-blue-500" />
            Service Locations
          </h1>
          <p className="text-gray-400 mt-1">Manage your physical franchise and service centers.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> New Location
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#141414] border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Add Service Location</DialogTitle>
              <DialogDescription className="text-gray-400">
                Register a new physical store to the network.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Location Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. CleanRide Downtown" 
                    className="bg-black/50 border-white/10 pl-10 h-11" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Street Address <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="123 Main St" 
                    className="bg-black/50 border-white/10 pl-10 h-11" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City <span className="text-red-500">*</span></Label>
                  <Input 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    placeholder="Mumbai" 
                    className="bg-black/50 border-white/10 h-11" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <Input 
                    value={state} 
                    onChange={e => setState(e.target.value)} 
                    placeholder="MH" 
                    className="bg-black/50 border-white/10 h-11" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zip Code <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    value={zipCode} 
                    onChange={e => setZipCode(e.target.value)} 
                    placeholder="400001" 
                    className="bg-black/50 border-white/10 pl-10 h-11" 
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isCreating} className="w-full h-11 bg-white text-black hover:bg-gray-200">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Register Location
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#141414] border-white/5 shadow-xl rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input 
              placeholder="Search locations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/40 border-white/10 pl-9 rounded-xl h-10 w-full"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-24 text-gray-500 flex flex-col items-center">
              <MapPin className="w-12 h-12 mb-4 text-gray-600" />
              <p className="text-lg">No service locations found</p>
              <p className="text-sm">Register a new physical store to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-black/40 text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Location Name</th>
                    <th className="px-6 py-4 font-semibold">Address</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{store.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{store.city}, {store.state}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300">{store.address}</div>
                        <div className="text-xs text-gray-500 mt-1">Zip: {store.zipCode}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(store.id, store.isActive)}
                          className={`p-2 rounded-full transition-all ${
                            store.isActive
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                          title={store.isActive ? "Mark as Closed" : "Mark as Open"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <div className="text-[10px] mt-1 font-medium uppercase tracking-wider">
                           {store.isActive ? <span className="text-green-500">Open</span> : <span className="text-red-500">Closed</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
