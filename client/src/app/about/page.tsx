"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-32 pb-24 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-bold tracking-widest uppercase text-gray-300"
          >
            The CleanRide Story
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Redefining <br className="md:hidden" /> Vehicle Care.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed"
          >
            CleanRide was founded on a simple principle: your time is valuable, and your vehicle deserves showroom-quality detailing without the hassle of waiting in line.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative h-[600px] rounded-[2rem] overflow-hidden border border-white/10"
          >
            <Image 
              src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=1000&auto=format&fit=crop" 
              alt="Detailing Process" 
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10">
              <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Precision in Every Detail</h3>
              <p className="text-gray-300 text-lg">Our partners use industry-leading tools and eco-friendly products.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-12 pl-0 md:pl-10"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">01</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Vetted Professionals</h3>
              <p className="text-gray-400 leading-relaxed">Every CleanRide partner undergoes rigorous background checks and comprehensive training to ensure your vehicle is in the safest hands.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">02</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Seamless Technology</h3>
              <p className="text-gray-400 leading-relaxed">From instant booking to live tracking and secure payments, our platform is designed to make vehicle care entirely frictionless.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold">03</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Eco-Conscious Approach</h3>
              <p className="text-gray-400 leading-relaxed">We utilize water-saving techniques and biodegradable solutions that are tough on dirt but gentle on the environment.</p>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { label: "Vehicles Detailed", value: "10,000+" },
            { label: "Active Partners", value: "250+" },
            { label: "Cities Covered", value: "15" },
            { label: "Customer Rating", value: "4.9/5" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 text-center hover:border-white/20 transition-colors">
              <h4 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">{stat.value}</h4>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">{stat.label}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
