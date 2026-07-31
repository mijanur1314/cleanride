"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // We use the public cached endpoint
        const res = await api.get("/subscriptions/plans");
        setPlans(res.data.data.plans);
      } catch (error) {
        toast.error("Failed to load subscription plans");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: any) => {
    if (!isAuthenticated) {
      toast.error("Please login to subscribe");
      router.push("/login?redirect=/subscriptions");
      return;
    }

    setProcessingId(plan.id);
    try {
      // 1. Create Subscription on our backend (which calls Razorpay API)
      const res = await api.post("/subscriptions/create-subscription", { planId: plan.id });
      const { subscription } = res.data.data;

      // 2. Open Razorpay Checkout for Subscription
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Ensure this is set in .env.local
        subscription_id: subscription.id,
        name: "CleanRide",
        description: `Subscription: ${plan.name}`,
        image: "/logo.png",
        handler: async function (response: any) {
          try {
            // 3. Verify on our backend
            await api.post("/subscriptions/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id
            });
            toast.success("Subscription activated successfully!");
            router.push("/dashboard");
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || "",
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(response.error.description || "Payment failed");
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to initiate subscription");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4 relative overflow-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/20 to-transparent -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 font-medium text-sm border border-blue-500/20 mb-4">
            <Sparkles className="w-4 h-4" />
            Join the Elite Club
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tight">
            Keep your ride pristine, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">always.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
            Subscribe to our premium plans and enjoy priority bookings, exclusive discounts, and complimentary services every month. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center pt-8">
          {plans.map((plan, index) => {
            const isPopular = index === 1 || plans.length === 1; // Highlight the middle one or if there's only one

            return (
              <div 
                key={plan.id}
                className={`relative group rounded-3xl p-px transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 ${
                  isPopular 
                    ? "bg-gradient-to-b from-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.4)] md:-translate-y-4 z-10" 
                    : "bg-white/10 hover:bg-white/20"
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {isPopular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className={`h-full rounded-3xl bg-[#0a0a0a] p-8 flex flex-col ${isPopular ? "border-none" : ""}`}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">₹{plan.price}</span>
                      <span className="text-gray-400 font-medium">/ {plan.durationDays} days</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 mb-8">
                    {plan.benefits?.map((benefit: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="p-1 rounded-full bg-blue-500/10 shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-blue-400" strokeWidth={3} />
                        </div>
                        <span className="text-gray-300 text-sm leading-tight">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={processingId === plan.id}
                    className={`w-full h-12 rounded-xl text-base font-bold transition-all duration-300 ${
                      isPopular 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {processingId === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-50 text-blue-500" />
            <h3 className="text-xl font-bold text-white mb-2">No active plans available</h3>
            <p>Our team is currently crafting new subscription plans. Check back soon!</p>
          </div>
        )}

        <div className="text-center pt-10">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Secure payments powered by Razorpay. Cancel anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
