"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Check, Loader2, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Script from "next/script";

export default function MembershipsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get('/subscriptions/plans'),
          api.get('/subscriptions/my-subscription').catch(() => ({ data: { data: { subscription: null } } }))
        ]);
        setPlans(plansRes.data.data.plans);
        setCurrentSub(subRes.data.data.subscription);
      } catch (error) {
        toast.error("Failed to load subscription plans");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to subscribe");
      router.push("/login");
      return;
    }

    setSubscribing(planId);
    try {
      // 1. Create Subscription Order
      const orderRes = await api.post('/subscriptions/create-order', { planId });
      const { order, plan } = orderRes.data.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency,
        name: "CleanRide Premium",
        description: `Subscription to ${plan.name} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await api.post("/subscriptions/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId
            });
            toast.success("Welcome to Premium! Subscription activated.");
            router.push("/dashboard");
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Subscription verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: (user as any).phone || ""
        },
        theme: { color: "#8b5cf6" } // Purple theme for premium feel
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(response.error.description || "Payment failed");
      });
      rzp.open();

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to initiate subscription");
    } finally {
      setSubscribing(null);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 bg-[#0A0A0A] relative overflow-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-white/10 text-white hover:bg-white/20 border-0">Premium Memberships</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Keep Your Ride Pristine, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Always.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Choose a plan that fits your lifestyle. Save money and enjoy priority bookings, exclusive discounts, and a spotless vehicle year-round.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => {
            const isPopular = plan.price > 50 && plan.price < 150;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-3xl p-8 backdrop-blur-xl border transition-all hover:-translate-y-2 hover:shadow-2xl ${
                  isPopular 
                    ? 'bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] md:-mt-8 md:mb-8' 
                    : 'bg-[#141414]/80 border-white/5 hover:border-white/20'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
                    <Star className="w-3 h-3 fill-white" /> Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-400 min-h-[40px]">{plan.benefits?.[0] || 'Exclusive member benefits'}</p>
                
                <div className="my-8 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-white">${plan.price}</span>
                  <span className="text-gray-400">/mo</span>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.benefits?.map((benefit: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-500" /></div>
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-500" /></div>
                    <span className="text-sm text-gray-300">Cancel Anytime</span>
                  </div>
                </div>

                <Button 
                  className={`w-full h-12 rounded-xl text-md font-bold transition-all shadow-lg ${
                    currentSub?.planId === plan.id
                      ? 'bg-green-600 hover:bg-green-700 text-white opacity-100'
                      : isPopular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25' 
                        : 'bg-white text-black hover:bg-gray-200'
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing === plan.id || currentSub?.planId === plan.id}
                >
                  {subscribing === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentSub?.planId === plan.id ? (
                    'Current Plan'
                  ) : (
                    'Choose Plan'
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Inline Badge component to avoid creating another file just for this page
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${className}`}>{children}</span>;
}
