"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/axios";
import { toast } from "sonner";
import { 
  Building2, 
  CarFront, 
  Settings2, 
  WalletCards, 
  Plus, 
  Search,
  MoreVertical,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

export default function FleetDashboard() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add Vehicle Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    type: "SUV", // default
    make: "",
    model: "",
    plateNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated && !user) {
      router.push("/login");
    }
  }, [user, _hasHydrated, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchFleetData = async () => {
      try {
        const [vehiclesRes, bookingsRes] = await Promise.all([
          api.get("/vehicles/my-vehicles"),
          api.get("/bookings/my-bookings")
        ]);
        
        setVehicles(vehiclesRes.data.data.vehicles);
        setBookings(bookingsRes.data.data.bookings);
      } catch (error) {
        toast.error("Failed to load fleet data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFleetData();
  }, [user]);

  if (!mounted || !_hasHydrated || !user) return null;

  // KPIs
  const totalVehicles = vehicles.length;
  const totalWashes = bookings.filter(b => b.status === "COMPLETED").length;
  const activeBookings = bookings.filter(b => ["PENDING", "CONFIRMED", "IN_PROGRESS", "EN_ROUTE"].includes(b.status)).length;
  const estimatedSavings = totalWashes * 15; // Mock: $15 saved per corporate wash

  const handleAddVehicle = async () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.plateNumber) {
      toast.error("Please fill in all vehicle details");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await api.post("/vehicles", {
        type: newVehicle.type,
        make: newVehicle.make,
        model: newVehicle.model,
        plateNumber: newVehicle.plateNumber,
        name: `${newVehicle.make} ${newVehicle.model}`
      });
      
      setVehicles([res.data.data.vehicle, ...vehicles]);
      toast.success("Vehicle added to fleet!");
      setIsAdding(false);
      setNewVehicle({ type: "SUV", make: "", model: "", plateNumber: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Remove this vehicle from your fleet?")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(vehicles.filter(v => v.id !== id));
      toast.success("Vehicle removed");
    } catch (error) {
      toast.error("Failed to remove vehicle");
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-500" />
              Corporate Fleet Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Manage your company vehicles and bulk wash schedules.</p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => router.push('/book')} variant="outline" className="border-white/10 text-white bg-transparent hover:bg-white/5 h-11 px-6 rounded-xl">
              Book Fleet Wash
            </Button>
            <Button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-11 px-6 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> Add Vehicle
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#141414] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <CarFront className="w-16 h-16" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Total Fleet</p>
            <p className="text-4xl font-heading font-bold text-white">{isLoading ? "..." : totalVehicles}</p>
          </motion.div>
          
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-[#141414] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Washes Completed</p>
            <p className="text-4xl font-heading font-bold text-white">{isLoading ? "..." : totalWashes}</p>
          </motion.div>

          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} className="bg-[#141414] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Clock className="w-16 h-16" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Active Services</p>
            <p className="text-4xl font-heading font-bold text-blue-400">{isLoading ? "..." : activeBookings}</p>
          </motion.div>

          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="bg-gradient-to-br from-blue-900/40 to-[#141414] border border-blue-500/20 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <WalletCards className="w-16 h-16 text-blue-400" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300/70 mb-2">Est. B2B Savings</p>
            <p className="text-4xl font-heading font-bold text-white">${isLoading ? "..." : estimatedSavings}</p>
          </motion.div>
        </div>

        {/* Fleet Data Table */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h3 className="text-xl font-bold text-white">Fleet Roster</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input 
                placeholder="Search plate or model..." 
                className="pl-9 bg-black border-white/10 text-white w-full sm:w-64"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-xs uppercase tracking-widest font-bold text-gray-500">
                  <th className="p-4 pl-6">Vehicle</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">License Plate</th>
                  <th className="p-4">Added On</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Loading fleet data...</td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No vehicles in your fleet yet. Click "Add Vehicle" to get started.</td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{v.make || "Unknown"} {v.model}</span>
                          <span className="text-xs text-gray-500">{v.name || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded border border-white/10">{v.type}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">{v.plateNumber || "N/A"}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Fleet Vehicle</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the vehicle details to add it to your corporate roster.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Make</label>
                <Input 
                  placeholder="e.g. Ford" 
                  value={newVehicle.make}
                  onChange={e => setNewVehicle({...newVehicle, make: e.target.value})}
                  className="bg-black border-white/10 text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Model</label>
                <Input 
                  placeholder="e.g. Transit" 
                  value={newVehicle.model}
                  onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                  className="bg-black border-white/10 text-white" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">License Plate</label>
              <Input 
                placeholder="e.g. ABC-1234" 
                value={newVehicle.plateNumber}
                onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value.toUpperCase()})}
                className="bg-black border-white/10 text-white uppercase" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Vehicle Type</label>
              <select 
                value={newVehicle.type}
                onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
                className="w-full h-10 px-3 rounded-md bg-black border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Luxury/Sports">Luxury/Sports</option>
                <option value="Commercial">Commercial Van/Truck</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAdding(false)} className="hover:bg-white/5">Cancel</Button>
            <Button onClick={handleAddVehicle} disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
              {isSubmitting ? "Adding..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
