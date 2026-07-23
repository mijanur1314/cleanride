"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useBookingStore } from "@/store/useBookingStore";
import api from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Car, CheckCircle2, Upload, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VEHICLE_CATEGORIES: Record<string, string[]> = {
  "Two-Wheelers": ["Motorcycles", "Scooters and Scootettes", "Mopeds"],
  "Passenger Cars & Vehicles": ["Hatchbacks", "Sedans", "SUVs", "MPVs / MUVs", "Electric Vehicles (EVs)"],
  "Three-Wheelers": ["Auto-Rickshaws", "E-Rickshaws"],
  "Commercial Vehicles (CVs)": ["Buses", "Light Commercial Vehicles (LCVs)", "Heavy Commercial Vehicles (HCVs)"],
  "Utility & Special Purpose Vehicles": ["Agricultural Vehicles", "Emergency & Construction Vehicles"]
};

export default function BookingPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { step, nextStep, prevStep, setService, setVehicleDetails, setBookingDate, setLocation, service, vehicleCategory, vehicleType, vehicleNumber, vehicleImageUrl, bookingDate, address, resetBooking } = useBookingStore();
  
  const [services, setServices] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload", formData);
      useBookingStore.getState().setVehicleImage(res.data.data.url);
      toast.success("Vehicle image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      toast.error("Please login to book a service");
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [servRes, vehRes, addonRes] = await Promise.all([
          api.get("/services"),
          api.get("/vehicles/my-vehicles").catch(() => ({ data: { data: { vehicles: [] } } })),
          api.get("/addons").catch(() => ({ data: { data: { addons: [] } } }))
        ]);
        setServices(servRes.data.data.services);
        setVehicles(vehRes.data.data.vehicles);
        setAddons(addonRes.data.data.addons);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 pt-32 pb-12 px-4 selection:bg-white/20">
      <div className="container max-w-4xl mx-auto">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4 font-heading bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Book a Service</h1>
          <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-600">
            <span className={step >= 1 ? "text-white" : ""}>Service</span> <span className="opacity-50">&rarr;</span>
            <span className={step >= 2 ? "text-white" : ""}>Vehicle</span> <span className="opacity-50">&rarr;</span>
            <span className={step >= 3 ? "text-white" : ""}>Schedule</span> <span className="opacity-50">&rarr;</span>
            <span className={step >= 4 ? "text-white" : ""}>Payment</span>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s) => (
                  <Card 
                    key={s.id} 
                    className={`cursor-pointer transition-all duration-300 rounded-3xl overflow-hidden relative group ${service?.id === s.id ? 'border-white/40 bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'border-white/5 bg-[#141414] hover:bg-white/[0.02]'}`}
                    onClick={() => setService(s)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                    <CardHeader className="pb-4 border-b border-white/5 relative z-10">
                      <CardTitle className="font-heading text-xl text-white">{s.name}</CardTitle>
                      <CardDescription className="text-3xl font-black text-white mt-1">₹{s.price}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5 relative z-10">
                      <p className="text-sm font-light text-gray-400 leading-relaxed">{s.description}</p>
                      <p className="text-xs font-bold uppercase tracking-widest mt-6 flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-4 h-4 text-green-400"/> {s.duration} mins</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {service && addons.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 text-center">Enhance Your Wash (Add-ons)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addons.map(addon => {
                      const isSelected = useBookingStore.getState().addonIds.includes(addon.id);
                      return (
                        <Card 
                          key={addon.id} 
                          className={`cursor-pointer transition-all rounded-2xl relative overflow-hidden ${isSelected ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-white/5 bg-[#141414] hover:bg-white/[0.02]'}`}
                          onClick={() => useBookingStore.getState().toggleAddon(addon.id)}
                        >
                          <CardHeader className="py-5 px-6 relative z-10">
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="text-base font-heading text-white">{addon.name}</CardTitle>
                                {addon.description && <CardDescription className="text-xs font-light text-gray-400 mt-1">{addon.description}</CardDescription>}
                              </div>
                              <span className="font-bold text-green-400 text-lg">+₹{addon.price}</span>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-10 flex justify-end">
                <Button onClick={nextStep} disabled={!service} className="bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs h-14 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">Continue to Vehicle Details</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <CardHeader className="pb-6 relative z-10 border-b border-white/5">
                  <CardTitle className="font-heading text-2xl text-white">Vehicle Details</CardTitle>
                  <CardDescription className="text-gray-400 font-light">Tell us about the vehicle you want to wash</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-8 relative z-10">
                  {vehicles.length > 0 && (
                    <div className="space-y-4 mb-8">
                      <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Select Saved Vehicle</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {vehicles.map(v => (
                          <div 
                            key={v.id} 
                            onClick={() => setVehicleDetails("Passenger Cars & Vehicles", v.type, v.plateNumber || '')}
                            className={`p-5 rounded-2xl cursor-pointer flex items-center gap-4 transition-all border ${vehicleType === v.type && vehicleNumber === (v.plateNumber || '') ? 'border-white/40 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-white/10 hover:bg-white/[0.02]'}`}
                          >
                            <Car className={`w-6 h-6 ${vehicleType === v.type && vehicleNumber === (v.plateNumber || '') ? 'text-white' : 'text-gray-500'}`} />
                            <div>
                              <p className="font-bold text-white text-sm">{v.make} {v.model}</p>
                              <p className="text-xs font-light text-gray-400 mt-1">{v.type} {v.plateNumber && `• ${v.plateNumber}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="relative py-6">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
                        <div className="relative flex justify-center text-[10px] tracking-widest uppercase font-bold"><span className="bg-[#141414] px-4 text-gray-500">Or Enter Manually</span></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Vehicle Category *</Label>
                      <Select 
                        onValueChange={(v) => setVehicleDetails(v, "", vehicleNumber || undefined)} 
                        value={vehicleCategory || ""}
                      >
                        <SelectTrigger className="bg-black/50 border-white/10 rounded-xl h-14 text-white focus:ring-white/20"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent className="bg-[#141414] border-white/10 text-white">
                          {Object.keys(VEHICLE_CATEGORIES).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Vehicle Type *</Label>
                      <Select 
                        onValueChange={(v) => setVehicleDetails(vehicleCategory!, v, vehicleNumber || undefined)} 
                        value={vehicleType || ""}
                        disabled={!vehicleCategory}
                      >
                        <SelectTrigger className="bg-black/50 border-white/10 rounded-xl h-14 text-white focus:ring-white/20 disabled:opacity-50"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent className="bg-[#141414] border-white/10 text-white">
                          {vehicleCategory && VEHICLE_CATEGORIES[vehicleCategory].map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Vehicle License Plate (Optional)</Label>
                    <Input placeholder="e.g. ABC 1234" value={vehicleNumber || ''} onChange={(e) => setVehicleDetails(vehicleCategory!, vehicleType!, e.target.value)} className="bg-black/50 border-white/10 rounded-xl h-14 text-white placeholder:text-gray-600 focus-visible:ring-white/20 uppercase" />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Current Vehicle Condition *</Label>
                    <p className="text-xs font-light text-gray-400">Please upload a picture of your vehicle to help our detailers prepare.</p>
                    
                    <div className="relative border-2 border-dashed border-white/10 rounded-2xl bg-black/30 p-8 text-center hover:bg-white/[0.02] transition-colors group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                      />
                      
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          <p className="text-sm font-medium text-gray-400">Uploading image...</p>
                        </div>
                      ) : vehicleImageUrl ? (
                        <div className="flex flex-col items-center space-y-3 relative z-10">
                          <div className="w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-white/10 relative">
                            <img src={vehicleImageUrl} alt="Vehicle" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2"><Upload className="w-4 h-4" /> Change Image</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
                          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 group-hover:text-white transition-colors group-hover:scale-110">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-gray-300">Tap to upload vehicle photo</p>
                          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Required for booking</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="mt-8 flex justify-between gap-4">
                <Button variant="outline" onClick={prevStep} className="border-white/10 text-white bg-transparent hover:bg-white/5 h-14 px-8 rounded-xl font-bold tracking-widest uppercase text-xs transition-colors">Back</Button>
                <Button onClick={nextStep} disabled={!vehicleType || !vehicleImageUrl || isUploadingImage} className="bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs h-14 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">Continue to Schedule</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <CardHeader className="pb-6 relative z-10 border-b border-white/5">
                  <CardTitle className="font-heading text-2xl text-white">Schedule & Location</CardTitle>
                  <CardDescription className="text-gray-400 font-light">When and where do you want the service?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-8 relative z-10">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Date & Time *</Label>
                    <Input type="datetime-local" onChange={(e) => setBookingDate(new Date(e.target.value))} className="bg-black/50 border-white/10 rounded-xl h-14 text-white focus-visible:ring-white/20 [color-scheme:dark]" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block">Service Address (For Doorstep) *</Label>
                    <Input placeholder="123 Main St, City, ZIP" onChange={(e) => setLocation(e.target.value)} className="bg-black/50 border-white/10 rounded-xl h-14 text-white placeholder:text-gray-600 focus-visible:ring-white/20" />
                  </div>
                </CardContent>
              </Card>
              <div className="mt-8 flex justify-between gap-4">
                <Button variant="outline" onClick={prevStep} className="border-white/10 text-white bg-transparent hover:bg-white/5 h-14 px-8 rounded-xl font-bold tracking-widest uppercase text-xs transition-colors">Back</Button>
                <Button onClick={nextStep} disabled={!bookingDate || !address} className="bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs h-14 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">Continue to Payment</Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <PaymentStep availableAddons={addons} />
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PaymentStep({ availableAddons }: { availableAddons: { id: string; name: string; price: number }[] }) {
  const { user } = useAuthStore();
  const { service, vehicleType, vehicleNumber, vehicleImageUrl, bookingDate, address, addonIds, prevStep, resetBooking } = useBookingStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const router = useRouter();

  const handleApplyCoupon = async () => {
    try {
      setCouponError("");
      const res = await api.post("/coupons/validate", { code: couponCode });
      setAppliedCoupon(res.data.data.coupon);
      toast.success("Coupon applied!");
    } catch (error: unknown) {
      setCouponError((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Invalid coupon");
      setAppliedCoupon(null);
    }
  };

  const calculateFinalPrice = () => {
    if (!service) return 0;
    
    let finalAmount = service.price;
    
    // Add addon prices
    const selectedAddons = availableAddons.filter(a => addonIds.includes(a.id));
    for (const addon of selectedAddons) {
      finalAmount += addon.price;
    }

    if (appliedCoupon) {
      const discount = (service.price * appliedCoupon.discountPercentage) / 100;
      finalAmount -= appliedCoupon.maxDiscount ? Math.min(discount, appliedCoupon.maxDiscount) : discount;
    }

    if (redeemPoints > 0) {
      finalAmount -= (redeemPoints * 0.1);
    }
    
    return Math.max(finalAmount, 0);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create Booking in DB
      const bookingRes = await api.post("/bookings", {
        serviceId: service?.id,
        vehicleType,
        vehicleNumber,
        vehicleImage: vehicleImageUrl,
        bookingDate: bookingDate?.toISOString(),
        address,
        couponId: appliedCoupon?.id,
        addonIds,
        redeemPoints: redeemPoints > 0 ? redeemPoints : undefined
      });
      
      const bookingId = bookingRes.data.data.booking.id;

      // 2. Create Razorpay order
      const orderRes = await api.post("/payments/create-order", { bookingId });
      const order = orderRes.data.data.order;

      // 3. Initialize Razorpay Checkout
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        toast.error("Payment configuration missing. Please contact support.");
        return;
      }

      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        name: "CleanRide",
        description: `Payment for ${service?.name}`,
        order_id: order.id,
        handler: async function (response: unknown) {
          try {
            const rzp = response as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; };
            await api.post("/payments/verify", {
              razorpay_order_id: rzp.razorpay_order_id,
              razorpay_payment_id: rzp.razorpay_payment_id,
              razorpay_signature: rzp.razorpay_signature,
              bookingId
            });
            toast.success("Payment successful! Booking confirmed.");
            resetBooking();
            router.push("/dashboard");
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: (user as any)?.phone || ""
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: unknown) {
        const errRzp = response as { error?: { description?: string } };
        toast.error(errRzp.error?.description || "Payment failed");
      });
      rzp.open();

    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Booking failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <CardHeader className="pb-6 relative z-10 border-b border-white/5">
          <CardTitle className="font-heading text-2xl text-white">Review & Payment</CardTitle>
          <CardDescription className="text-gray-400 font-light">Review your booking details before checking out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8 relative z-10">
          <div className="p-6 bg-black/40 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-6 border border-white/5">
            <div>
              <h4 className="font-bold text-xl text-white font-heading mb-1">{service?.name}</h4>
              <p className="text-sm font-light text-gray-400">{vehicleType}</p>
              <p className="text-sm font-light text-gray-400">{bookingDate?.toLocaleString()}</p>
              <p className="text-sm font-light text-gray-400 mt-2 flex items-start gap-1 max-w-sm"><span className="opacity-50">📍</span> {address}</p>
              {addonIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Selected Add-ons</p>
                  {availableAddons.filter(a => addonIds.includes(a.id)).map(a => (
                    <p key={a.id} className="text-sm font-medium text-gray-300 flex justify-between max-w-sm">
                      <span>{a.name}</span>
                      <span className="text-green-400">+₹{a.price}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="md:text-right flex-shrink-0 bg-[#141414] p-5 rounded-xl border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total to Pay</p>
              {appliedCoupon ? (
                <>
                  <div className="text-sm font-medium line-through text-gray-500">₹{service?.price}</div>
                  <div className="text-4xl font-black text-white font-heading">₹{calculateFinalPrice()}</div>
                </>
              ) : (
                <div className="text-4xl font-black text-white font-heading">₹{calculateFinalPrice()}</div>
              )}
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5">
            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Coupon Code</Label>
            <div className="flex gap-3">
              <Input 
                placeholder="Enter promo code" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                disabled={!!appliedCoupon}
                className="bg-black/50 border-white/10 rounded-xl h-14 text-white placeholder:text-gray-600 focus-visible:ring-white/20 uppercase max-w-sm"
              />
              <Button onClick={handleApplyCoupon} disabled={!couponCode || !!appliedCoupon} className="bg-white/10 text-white hover:bg-white/20 h-14 px-8 rounded-xl font-bold tracking-widest uppercase text-xs transition-colors">
                {appliedCoupon ? 'Applied ✓' : 'Apply'}
              </Button>
            </div>
            {couponError && <p className="text-sm font-medium text-red-400 mt-2">{couponError}</p>}
          </div>

          {user && (user.loyaltyPoints || 0) > 0 && (
            <div className="pt-8 border-t border-white/5">
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Redeem Loyalty Points</Label>
              <p className="text-xs font-light text-gray-400 mb-4">You have <strong className="text-white">{user.loyaltyPoints}</strong> points available (10 points = ₹1)</p>
              <div className="flex items-center gap-4">
                <Input 
                  type="number"
                  min={0}
                  max={user.loyaltyPoints}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Math.min(parseInt(e.target.value) || 0, user.loyaltyPoints || 0))}
                  className="bg-black/50 border-white/10 rounded-xl h-14 text-white focus-visible:ring-white/20 max-w-[150px]"
                />
                <span className="text-sm font-bold text-green-400 tracking-widest">
                  -₹{(redeemPoints * 0.1).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-between gap-4">
        <Button variant="outline" onClick={prevStep} disabled={isProcessing} className="border-white/10 text-white bg-transparent hover:bg-white/5 h-14 px-8 rounded-xl font-bold tracking-widest uppercase text-xs transition-colors">Back</Button>
        <Button onClick={handlePayment} disabled={isProcessing} className="bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs h-14 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Pay ₹{calculateFinalPrice().toFixed(2)}
        </Button>
      </div>
    </>
  );
}
