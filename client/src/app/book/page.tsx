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
  const { user } = useAuthStore();
  const { step, nextStep, prevStep, setService, setVehicleDetails, setBookingDate, setLocation, service, vehicleType, resetBooking } = useBookingStore();
  
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to book a service");
      router.push("/login");
      return;
    }

    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        setServices(res.data.data.services);
      } catch (error) {
        toast.error("Failed to load services");
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, [user, router]);

  if (isLoading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
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
                    <Input placeholder="ABC 1234" onChange={(e) => setVehicleDetails(vehicleType!, e.target.value)} />
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
               <PaymentStep />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PaymentStep() {
  const { service, vehicleType, bookingDate, address, prevStep, resetBooking } = useBookingStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
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
    if (appliedCoupon) {
      const discount = (service.price * appliedCoupon.discountPercentage) / 100;
      finalAmount -= appliedCoupon.maxDiscount ? Math.min(discount, appliedCoupon.maxDiscount) : discount;
    }
    return finalAmount;
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
        couponId: appliedCoupon?.id
      });

      const bookingId = bookingRes.data.data.booking.id;

      // 2. Create Razorpay order
      const orderRes = await api.post("/payments/create-order", { bookingId });
      const order = orderRes.data.data.order;

      // 3. Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Fallback for dev
        amount: order.amount,
        currency: order.currency,
        name: "CleanRide",
        description: `Payment for ${service?.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await api.post("/payments/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });
            toast.success("Payment successful! Booking confirmed.");
            resetBooking();
            router.push("/dashboard");
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        theme: {
          color: "#0A0A0A"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error("Payment failed. Please try again.");
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
            </div>
            <div className="text-right">
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
        </CardContent>
      </Card>
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={isProcessing}>Back</Button>
        <Button onClick={handlePayment} disabled={isProcessing} className="bg-orange-500 hover:bg-orange-600 text-white">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Pay ${calculateFinalPrice()}
        </Button>
      </div>
    </>
  );
}
