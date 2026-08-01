"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Shield, Crown, Sparkles, ChevronRight, ChevronLeft, Gift, Coins, Car, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TIERS = [
  { name: "Bronze", minPoints: 0, color: "from-amber-700 to-amber-900", iconColor: "text-amber-500", glow: "rgba(217, 119, 6, 0.4)" },
  { name: "Silver", minPoints: 500, color: "from-slate-400 to-slate-600", iconColor: "text-slate-300", glow: "rgba(148, 163, 184, 0.4)" },
  { name: "Gold", minPoints: 1500, color: "from-yellow-400 to-yellow-600", iconColor: "text-yellow-400", glow: "rgba(234, 179, 8, 0.4)" },
  { name: "Platinum", minPoints: 5000, color: "from-indigo-400 via-purple-500 to-pink-500", iconColor: "text-white", glow: "rgba(168, 85, 247, 0.6)" }
];

export default function RewardsPage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const handleInvite = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (user as any)?.referralCode;
    if (!code) {
      toast.error("Referral code not found. Please contact support.");
      return;
    }
    const inviteLink = `${window.location.origin}/register?ref=${code}`;
    
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Invite link copied to clipboard!");
      }).catch(() => {
        toast.error("Failed to copy link");
      });
    };

    if (navigator.share) {
      navigator.share({
        title: 'Join CleanRide',
        text: 'Sign up for CleanRide and get 10% off your first wash!',
        url: inviteLink
      }).catch((err) => {
        if (err.name !== 'AbortError') {
           copyToClipboard(inviteLink);
        }
      });
    } else {
      copyToClipboard(inviteLink);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated && !user) {
      router.push("/login");
    }
  }, [user, _hasHydrated, router]);

  if (!mounted || !_hasHydrated || !user) return null;

  const points = user.loyaltyPoints || 0;
  
  // Calculate Tier
  let currentTierIndex = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) {
      currentTierIndex = i;
      break;
    }
  }

  const currentTier = TIERS[currentTierIndex];
  const nextTier = currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;
  
  const progressPercentage = nextTier 
    ? Math.min(100, Math.max(0, ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100))
    : 100;

  const pointsNeeded = nextTier ? nextTier.minPoints - points : 0;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 overflow-hidden relative">
      {/* Background ambient glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] blur-[150px] opacity-30 pointer-events-none transition-all duration-1000"
        style={{ background: `radial-gradient(circle, ${currentTier.glow}, transparent 70%)` }}
      />
      
      <div className="container mx-auto px-6 relative z-10 max-w-5xl">
        
        {/* Back Button */}
        <div className="absolute left-6 top-0 md:top-2 z-20">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()} 
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <Trophy className={`w-4 h-4 ${currentTier.iconColor}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">CleanRide Rewards</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">Your Loyalty <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Status</span></h1>
          <p className="text-gray-400 max-w-lg">Earn points with every wash, level up your tier, and unlock exclusive VIP benefits.</p>
        </motion.div>

        {/* 3D Tier Card & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Main Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="lg:col-span-5 relative perspective-1000"
          >
            <motion.div 
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }}
              style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
              className={`w-full aspect-[1.6/1] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${currentTier.color} shadow-2xl border border-white/20`}
            >
              {/* Card Glare effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-50 transform -skew-x-12 translate-x-full group-hover:animate-glare" />
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Current Tier</p>
                  <h2 className="text-4xl font-black text-white flex items-center gap-3 drop-shadow-md">
                    {currentTier.name} 
                    {currentTier.name === "Platinum" ? <Crown className="w-8 h-8 text-white" /> : <Shield className="w-8 h-8 text-white/80" />}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">Total Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{points.toLocaleString()}</span>
                  <span className="text-white/80 font-medium">PTS</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Progress Tracker */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7 bg-[#141414] border border-white/10 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Sparkles className="w-32 h-32 text-white" />
            </div>

            <div className="relative z-10">
              {nextTier ? (
                <>
                  <h3 className="text-2xl font-bold text-white mb-2">You're on your way to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400">{nextTier.name}</span></h3>
                  <p className="text-gray-400 mb-8 font-light">Earn <strong className="text-white">{pointsNeeded.toLocaleString()} more points</strong> to unlock {nextTier.name} benefits.</p>

                  <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`absolute top-0 left-0 h-full bg-gradient-to-r ${currentTier.color} shadow-[0_0_20px_${currentTier.glow}]`}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                    <span>{currentTier.name}</span>
                    <span className="text-white">{nextTier.name}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">You are a Platinum Member</h3>
                  <p className="text-gray-400 font-light">You have reached the highest tier possible. Enjoy all the ultimate perks!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Unlockable Rewards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Gift className="w-6 h-6 text-gray-400" />
            <h3 className="text-2xl font-bold">Unlockable Perks</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier, idx) => {
              const isUnlocked = points >= tier.minPoints;
              return (
                <div 
                  key={tier.name}
                  className={`rounded-2xl p-6 border transition-all ${isUnlocked ? 'bg-[#141414] border-white/20 shadow-xl' : 'bg-[#0a0a0a] border-white/5 opacity-50 grayscale'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${isUnlocked ? `bg-gradient-to-br ${tier.color}` : 'bg-gray-800'}`}>
                    <Shield className={`w-5 h-5 ${isUnlocked ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">{tier.name} Perks</h4>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-4">
                    {idx === 0 ? "Default" : `At ${tier.minPoints} PTS`}
                  </p>
                  <ul className="space-y-2">
                    <li className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span> 
                      {idx === 0 ? "Standard Booking" : idx === 1 ? "5% Off Washes" : idx === 2 ? "10% Off & Free Wax" : "15% Off & Priority"}
                    </li>
                    <li className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span> 
                      {idx === 0 ? "Basic Support" : "Priority Support"}
                    </li>
                  </ul>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Ways to Earn */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Coins className="w-6 h-6 text-gray-400" />
            <h3 className="text-2xl font-bold">Ways to Earn</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-2xl p-6 flex items-center gap-6 transition-all cursor-pointer" onClick={() => router.push('/book')}>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Car className="w-8 h-8 text-gray-300" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-1">Book a Wash</h4>
                <p className="text-sm text-gray-400 font-light">Earn 10 points for every $1 spent on any wash package.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </div>

            <div className="group bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-2xl p-6 flex items-center gap-6 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-1">Refer a Friend</h4>
                <p className="text-sm text-gray-400 font-light">Give a friend 10% off and earn 500 points when they book.</p>
              </div>
              <Button onClick={(e) => { e.stopPropagation(); handleInvite(); }} variant="outline" className="rounded-full h-8 text-xs px-4 bg-transparent border-white/20 hover:bg-white/10">Invite</Button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
