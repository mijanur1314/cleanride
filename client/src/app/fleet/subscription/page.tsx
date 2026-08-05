"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { 
  Building2, 
  CheckCircle2, 
  Loader2, 
  WalletCards, 
  ArrowLeft,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function FleetSubscriptionPage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [mySubscription, setMySubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.push("/login");
    }
  }, [user, _hasHydrated, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        const [plansRes, mySubRes] = await Promise.all([
          api.get("/subscriptions/plans"),
          api.get("/subscriptions/my-subscription").catch(() => ({ data: { data: { subscription: null } } }))
        ]);
        
        setPlans(plansRes.data.data.plans || []);
        setMySubscription(mySubRes.data.data.subscription);
      } catch (error) {
        toast.error("Failed to load subscription data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Dynamically load Razorpay SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (plan: any) => {
    setIsProcessingId(plan.id);
    try {
      // 1. Create Subscription on Backend (Razorpay Order)
      const res = await api.post("/subscriptions/create-subscription", { planId: plan.id });
      const { subscription } = res.data.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        subscription_id: subscription.id,
        name: "CleanRide Corporate",
        description: `Subscription to ${plan.name}`,
        image: "/logo.png",
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            await api.post("/subscriptions/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id
            });
            toast.success("Subscription activated successfully! Welcome to Premium Fleet.");
            
            // Reload subscription
            const mySubRes = await api.get("/subscriptions/my-subscription");
            setMySubscription(mySubRes.data.data.subscription);
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || ""
        },
        theme: {
          color: "#2563EB"
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        toast.error(response.error.description || "Payment failed");
      });
      rzp1.open();

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to initiate subscription");
    } finally {
      setIsProcessingId(null);
    }
  };

  if (!_hasHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-black text-gray-100 pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <button 
          onClick={() => router.push('/fleet')}
          className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fleet Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-heading font-black text-white flex items-center gap-3 tracking-tight">
              <WalletCards className="w-10 h-10 text-blue-500" />
              Billing & Subscriptions
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Manage your corporate fleet plan and payment methods.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Active Subscription Banner */}
            {mySubscription && mySubscription.isActive ? (
              <div className="bg-gradient-to-r from-blue-900/40 to-black border border-blue-500/30 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-32 h-32 text-blue-400" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-500/30">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      Active Plan
                    </div>
                    <h2 className="text-3xl font-bold font-heading text-white">{mySubscription.plan.name}</h2>
                    <p className="text-gray-300 mt-2 text-lg">Your corporate fleet is fully covered for priority washes.</p>
                    <div className="mt-6 flex items-center gap-6 text-sm text-gray-400 font-medium">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Renews on {format(new Date(mySubscription.endDate), "MMMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <span className="font-bold">₹{mySubscription.plan.price / 100}</span> / {mySubscription.plan.durationDays} days
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl h-12 px-6 shadow-xl">
                    Manage Billing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <WalletCards className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">No Active Subscription</h3>
                  <p className="text-gray-400 text-sm">You are currently paying per wash. Upgrade to a fleet plan to save money and get priority support.</p>
                </div>
              </div>
            )}

            {/* Available Plans */}
            <div>
              <h2 className="text-2xl font-bold font-heading text-white mb-6">Available Plans</h2>
              
              {plans.length === 0 ? (
                <div className="text-center py-16 bg-[#141414] rounded-[2rem] border border-white/5">
                  <p className="text-gray-400">No subscription plans available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id} 
                      className={`relative bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] p-8 rounded-[2rem] border transition-all duration-300 ${
                        mySubscription?.planId === plan.id 
                          ? 'border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.15)] transform md:-translate-y-2' 
                          : 'border-white/5 shadow-2xl hover:border-white/20'
                      }`}
                    >
                      {mySubscription?.planId === plan.id && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                          Current Plan
                        </div>
                      )}
                      
                      <h3 className="text-2xl font-bold font-heading text-white mb-2">{plan.name}</h3>
                      <p className="text-sm text-gray-400 mb-8 min-h-[40px]">{plan.description}</p>
                      
                      <div className="flex items-end gap-1 mb-8">
                        <span className="text-5xl font-black text-white font-heading">₹{(plan.price / 100).toFixed(0)}</span>
                        <span className="text-gray-500 font-bold tracking-widest uppercase text-xs mb-2">/ {plan.durationDays} Days</span>
                      </div>
                      
                      <div className="space-y-4 mb-10 flex-grow">
                        {plan.benefits?.map((b: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={() => handleSubscribe(plan)}
                        disabled={isProcessingId === plan.id || mySubscription?.planId === plan.id}
                        className={`w-full h-14 rounded-xl text-sm font-bold tracking-widest uppercase transition-all ${
                          mySubscription?.planId === plan.id
                            ? 'bg-white/10 text-white/50 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        {isProcessingId === plan.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : mySubscription?.planId === plan.id ? (
                          "Active"
                        ) : (
                          "Subscribe Now"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
