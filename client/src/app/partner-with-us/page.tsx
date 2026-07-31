"use client";

import { CheckCircle2, TrendingUp, Calendar, Zap, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BecomeAPartner() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#141414] to-[#0A0A0A] -z-10" />
        
        <div className="container px-6 mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <TrendingUp className="w-4 h-4" /> Earn up to ₹5,000/day
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white font-heading tracking-tight mb-6 leading-tight">
              Turn your skills into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">premium earnings.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 font-light max-w-lg">
              Join the elite network of CleanRide partners. Set your own hours, access high-paying clientele, and manage everything from our futuristic Partner Dashboard.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => router.push('/register?role=PARTNER')} 
                className="bg-white text-black hover:bg-gray-200 h-14 px-8 rounded-xl font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Apply to Partner
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <div className="aspect-square relative max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full blur-[100px] opacity-20" />
              <Image 
                src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1000&auto=format&fit=crop" 
                alt="Detailer at work"
                fill
                className="object-cover rounded-[3rem] border border-white/10 shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Perks Section */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white font-heading mb-4">Why Partner with us?</h2>
            <p className="text-gray-400 font-light">We handle the marketing and logistics. You focus on perfection.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#141414] p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Guaranteed Demand</h3>
              <p className="text-gray-400 font-light text-sm">Access an exclusive network of luxury car owners waiting for premium mobile services.</p>
            </div>

            <div className="bg-[#141414] p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Total Flexibility</h3>
              <p className="text-gray-400 font-light text-sm">Be your own boss. Accept jobs that fit your schedule, right from your phone.</p>
            </div>

            <div className="bg-[#141414] p-8 rounded-3xl border border-white/5 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Fast Payouts</h3>
              <p className="text-gray-400 font-light text-sm">Track your earnings in real-time on our dedicated dashboard and withdraw instantly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
