"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, Ticket, Search, AlertCircle, Percent, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create Form State
  const [code, setCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/coupons");
      setCoupons(res.data.data.coupons);
    } catch (error) {
      toast.error("Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountPercentage || !validUntil) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsCreating(true);
    try {
      await api.post("/coupons", {
        code,
        discountPercentage,
        maxDiscount: maxDiscount || undefined,
        validUntil
      });
      toast.success("Coupon created successfully");
      setIsCreateOpen(false);
      setCode("");
      setDiscountPercentage("");
      setMaxDiscount("");
      setValidUntil("");
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create coupon");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/coupons/${id}`, { isActive: !currentStatus });
      setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      toast.success(currentStatus ? "Coupon deactivated" : "Coupon activated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success("Coupon deleted successfully");
    } catch (error) {
      toast.error("Failed to delete coupon");
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-500" />
            Promo Codes
          </h1>
          <p className="text-gray-400 mt-1">Manage discount campaigns and promotional offers.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Plus className="w-4 h-4 mr-2" /> New Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#141414] border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Create Promo Code</DialogTitle>
              <DialogDescription className="text-gray-400">
                Generate a new discount code for your customers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Coupon Code <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input 
                    value={code} 
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} 
                    placeholder="e.g. SUMMER20" 
                    className="bg-black/50 border-white/10 pl-10 uppercase h-11" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount % <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={discountPercentage} 
                      onChange={e => setDiscountPercentage(e.target.value)} 
                      placeholder="e.g. 20" 
                      className="bg-black/50 border-white/10 pl-10 h-11" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Discount (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <Input 
                      type="number" 
                      min="1" 
                      value={maxDiscount} 
                      onChange={e => setMaxDiscount(e.target.value)} 
                      placeholder="Optional" 
                      className="bg-black/50 border-white/10 pl-8 h-11" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valid Until <span className="text-red-500">*</span></Label>
                <Input 
                  type="datetime-local" 
                  value={validUntil} 
                  onChange={e => setValidUntil(e.target.value)} 
                  className="bg-black/50 border-white/10 h-11 [color-scheme:dark]" 
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isCreating} className="w-full h-11 bg-white text-black hover:bg-gray-200">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Generate Code
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
              placeholder="Search codes..." 
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
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-24 text-gray-500 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 mb-4 text-gray-600" />
              <p className="text-lg">No promo codes found</p>
              <p className="text-sm">Create a new code to start a campaign.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-black/40 text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Code</th>
                    <th className="px-6 py-4 font-semibold">Discount</th>
                    <th className="px-6 py-4 font-semibold">Expiry Date</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCoupons.map((coupon) => {
                    const isExpired = new Date(coupon.validUntil) < new Date();
                    return (
                      <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold tracking-wider text-white px-2 py-1 bg-white/10 rounded-md">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-green-400">{coupon.discountPercentage}% OFF</div>
                          {coupon.maxDiscount && (
                            <div className="text-xs text-gray-500 mt-1">Upto ₹{coupon.maxDiscount}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className={isExpired ? "text-red-400" : "text-gray-300"}>
                            {format(new Date(coupon.validUntil), "MMM dd, yyyy h:mm a")}
                          </div>
                          {isExpired && <span className="text-[10px] uppercase text-red-500 font-bold">Expired</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                            disabled={isExpired}
                            className={`p-2 rounded-full transition-all ${
                              isExpired 
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                                : coupon.isActive
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                            title={coupon.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
