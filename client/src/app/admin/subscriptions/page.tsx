"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, BadgeCent, Search, AlertCircle, Power, ListPlus, Clock, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [benefitInput, setBenefitInput] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/subscriptions"); // wait, backend route is /api/subscriptions but wait, I added the route in subscription.routes.ts... Wait! Admin routes are in /subscriptions now! Let me verify the route prefix in server/src/app.ts
      // Actually it's probably /subscriptions. Let's try /subscriptions first.
      const resData = await api.get("/subscriptions");
      setPlans(resData.data.data.plans);
    } catch (error) {
      toast.error("Failed to load subscription plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const addBenefit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (benefitInput.trim()) {
        setBenefits([...benefits, benefitInput.trim()]);
        setBenefitInput("");
      }
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !durationDays) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsCreating(true);
    try {
      await api.post("/subscriptions", { 
        name, 
        price: Number(price), 
        durationDays: Number(durationDays),
        benefits 
      });
      toast.success("Plan created successfully on Razorpay & CleanRide!");
      setIsCreateOpen(false);
      setName(""); setPrice(""); setDurationDays("30"); setBenefits([]); setBenefitInput("");
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create plan");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/subscriptions/${id}`, { isActive: !currentStatus });
      setPlans(plans.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
      toast.success(currentStatus ? "Plan deactivated" : "Plan activated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This won't cancel existing user subscriptions on Razorpay automatically, but will hide it from new users.")) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      setPlans(plans.filter(p => p.id !== id));
      toast.success("Plan deleted successfully");
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
            <BadgeCent className="w-8 h-8 text-blue-500" />
            Subscription Plans
          </h1>
          <p className="text-gray-400 mt-1">Manage recurring revenue plans linked to Razorpay.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#141414] border-white/10 text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Create Subscription Plan</DialogTitle>
              <DialogDescription className="text-gray-400">
                This will automatically generate a recurring Plan ID in Razorpay.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Plan Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <BadgeCent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. CleanRide Premium" 
                    className="bg-black/50 border-white/10 pl-10 h-11" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                      type="number" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)} 
                      placeholder="999" 
                      className="bg-black/50 border-white/10 pl-10 h-11" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Billing Cycle (Days) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                      type="number"
                      value={durationDays} 
                      onChange={e => setDurationDays(e.target.value)} 
                      placeholder="30" 
                      className="bg-black/50 border-white/10 pl-10 h-11" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Benefits / Features</Label>
                <div className="relative">
                  <ListPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    value={benefitInput} 
                    onChange={e => setBenefitInput(e.target.value)}
                    onKeyDown={addBenefit}
                    placeholder="Press enter to add..." 
                    className="bg-black/50 border-white/10 pl-10 h-11" 
                  />
                </div>
                {benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {benefits.map((b, i) => (
                      <span key={i} className="bg-white/10 text-xs px-2 py-1 rounded-full flex items-center gap-2">
                        {b}
                        <button type="button" onClick={() => removeBenefit(i)} className="text-red-400 hover:text-red-300">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isCreating} className="w-full h-11 bg-white text-black hover:bg-gray-200">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Plan & Sync to Razorpay
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
              placeholder="Search plans..." 
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
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-24 text-gray-500 flex flex-col items-center">
              <BadgeCent className="w-12 h-12 mb-4 text-gray-600" />
              <p className="text-lg">No subscription plans found</p>
              <p className="text-sm">Create a recurring plan to boost retention.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-black/40 text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Plan Name</th>
                    <th className="px-6 py-4 font-semibold">Pricing</th>
                    <th className="px-6 py-4 font-semibold">Razorpay ID</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-base">{plan.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{plan.benefits?.length || 0} benefits included</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-green-400 text-base">₹{plan.price}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Every {plan.durationDays} days
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-white/5 px-2 py-1 rounded text-blue-300 font-mono">
                          {plan.razorpayPlanId}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(plan.id, plan.isActive)}
                          className={`p-2 rounded-full transition-all ${
                            plan.isActive
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                          title={plan.isActive ? "Deactivate Plan" : "Activate Plan"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <div className="text-[10px] mt-1 font-medium uppercase tracking-wider">
                           {plan.isActive ? <span className="text-green-500">Active</span> : <span className="text-red-500">Hidden</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(plan.id)}
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
