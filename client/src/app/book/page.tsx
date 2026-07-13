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
import { Loader2, Car, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { step, nextStep, prevStep, setService, setVehicleDetails, setBookingDate, setLocation, service, vehicleType, vehicleNumber, resetBooking } = useBookingStore();
  
  const [services, setServices] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="container max-w-3xl mx-auto pt-28 pb-12 px-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Book a Service</h1>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className={step >= 1 ? "text-blue-600" : ""}>Service</span> &rarr;
          <span className={step >= 2 ? "text-blue-600" : ""}>Vehicle</span> &rarr;
          <span className={step >= 3 ? "text-blue-600" : ""}>Schedule & Location</span> &rarr;
          <span className={step >= 4 ? "text-blue-600" : ""}>Payment</span>
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
                    className={`cursor-pointer transition-all hover:border-blue-500 ${service?.id === s.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => setService(s)}
                  >
                    <CardHeader>
                      <CardTitle>{s.name}</CardTitle>
                      <CardDescription className="text-xl font-bold text-foreground">${s.price}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                      <p className="text-sm font-medium mt-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> {s.duration} mins</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {service && addons.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Enhance Your Wash (Add-ons)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addons.map(addon => {
                      const isSelected = useBookingStore.getState().addonIds.includes(addon.id);
                      return (
                        <Card 
                          key={addon.id} 
                          className={`cursor-pointer transition-all hover:border-blue-500 ${isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => useBookingStore.getState().toggleAddon(addon.id)}
                        >
                          <CardHeader className="py-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{addon.name}</CardTitle>
                                {addon.description && <CardDescription>{addon.description}</CardDescription>}
                              </div>
                              <span className="font-bold text-green-600">+${addon.price}</span>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <Button onClick={nextStep} disabled={!service} className="bg-blue-600 hover:bg-blue-700">Continue to Vehicle Details</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Details</CardTitle>
                  <CardDescription>Tell us about the vehicle you want to wash</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vehicles.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <Label>Select Saved Vehicle</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {vehicles.map(v => (
                          <div 
                            key={v.id} 
                            onClick={() => setVehicleDetails(v.type, v.plateNumber || '')}
                            className={`p-3 border rounded-md cursor-pointer flex items-center gap-3 transition-colors ${vehicleType === v.type && vehicleNumber === (v.plateNumber || '') ? 'border-blue-500 bg-blue-50/50' : 'hover:border-gray-400'}`}
                          >
                            <Car className="w-5 h-5" />
                            <div>
                              <p className="font-medium text-sm">{v.make} {v.model} ({v.type})</p>
                              {v.plateNumber && <p className="text-xs text-muted-foreground">{v.plateNumber}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Enter Manually</span></div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Vehicle Type</Label>
                    <Select onValueChange={(v) => setVehicleDetails(v)} value={vehicleType || ""}>
                      <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Hatchback">Hatchback</SelectItem>
                        <SelectItem value="Bike">Motorcycle / Bike</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle License Plate (Optional)</Label>
                    <Input placeholder="ABC 1234" value={useBookingStore.getState().vehicleNumber || ''} onChange={(e) => setVehicleDetails(vehicleType!, e.target.value)} />
                  </div>
                </CardContent>
              </Card>
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prevStep}>Back</Button>
                <Button onClick={nextStep} disabled={!vehicleType} className="bg-blue-600 hover:bg-blue-700">Continue to Schedule</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Schedule & Location</CardTitle>
                  <CardDescription>When and where do you want the service?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Input type="datetime-local" onChange={(e) => setBookingDate(new Date(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Address (For Doorstep)</Label>
                    <Input placeholder="123 Main St, City, ZIP" onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={prevStep}>Back</Button>
                <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">Continue to Payment</Button>
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
  );
}

function PaymentStep({ availableAddons }: { availableAddons: any[] }) {
  const { user } = useAuthStore();
  const { service, vehicleType, bookingDate, address, addonIds, prevStep, resetBooking } = useBookingStore();
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
    } catch (error: any) {
      setCouponError(error.response?.data?.message || "Invalid coupon");
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
        handler: async function (response: any) {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId
            });
            toast.success("Payment successful! Booking confirmed.");
            resetBooking();
            router.push("/dashboard");
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment verification failed");
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
      rzp.on('payment.failed', function (response: any) {
        toast.error(response.error.description || "Payment failed");
      });
      rzp.open();

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review & Payment</CardTitle>
          <CardDescription>Review your booking details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{service?.name}</h4>
              <p className="text-sm text-muted-foreground">{vehicleType}</p>
              <p className="text-sm text-muted-foreground">{bookingDate?.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{address}</p>
              {addonIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Add-ons</p>
                  {availableAddons.filter(a => addonIds.includes(a.id)).map(a => (
                    <p key={a.id} className="text-sm text-muted-foreground flex justify-between">
                      <span>{a.name}</span>
                      <span>+${a.price}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {appliedCoupon ? (
                <>
                  <div className="text-lg font-bold line-through text-muted-foreground">${service?.price}</div>
                  <div className="text-2xl font-bold text-green-500">${calculateFinalPrice()}</div>
                </>
              ) : (
                <div className="text-2xl font-bold">${service?.price}</div>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Label>Coupon Code</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                placeholder="Enter coupon code" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                disabled={!!appliedCoupon}
              />
              <Button onClick={handleApplyCoupon} disabled={!couponCode || !!appliedCoupon} variant="secondary">
                {appliedCoupon ? 'Applied' : 'Apply'}
              </Button>
            </div>
            {couponError && <p className="text-sm text-red-500 mt-1">{couponError}</p>}
          </div>

          {user && (user.loyaltyPoints || 0) > 0 && (
            <div className="pt-4 border-t">
              <Label>Redeem Loyalty Points</Label>
              <p className="text-xs text-muted-foreground mb-2">You have {user.loyaltyPoints} points available (10 points = $1)</p>
              <div className="flex items-center gap-4">
                <Input 
                  type="number"
                  min={0}
                  max={user.loyaltyPoints}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Math.min(parseInt(e.target.value) || 0, user.loyaltyPoints || 0))}
                />
                <span className="text-sm text-green-500 whitespace-nowrap">
                  -${(redeemPoints * 0.1).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={isProcessing}>Back</Button>
        <Button onClick={handlePayment} disabled={isProcessing} className="bg-orange-500 hover:bg-orange-600 text-white">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Pay ${calculateFinalPrice().toFixed(2)}
        </Button>
      </div>
    </>
  );
}
