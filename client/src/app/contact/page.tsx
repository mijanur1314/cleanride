"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import { Loader2, MapPin, Building, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ContactLocationsPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get("/stores");
        setStores(res.data.data.stores);
      } catch (error) {
        console.error("Failed to fetch stores", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-32 pb-24 relative overflow-hidden">
      
      {/* Background aesthetic */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Our Locations
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 font-light"
            >
              Prefer to bring your vehicle to us? Visit one of our premium detailing centers for specialized care.
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button onClick={() => router.push('/book')} className="bg-white text-black hover:bg-gray-200 rounded-full h-12 px-8 font-bold">
              Book Doorstep Instead
            </Button>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-white/50" />
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-[#141414] border border-white/5 rounded-[2rem] p-16 text-center">
            <Building className="w-16 h-16 mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold mb-2">No Centers Found</h3>
            <p className="text-gray-400">We are currently operating purely via doorstep service in your region.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-[2rem] overflow-hidden bg-[#141414] border border-white/5 hover:border-white/20 transition-all p-8 flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{store.name}</h3>
                  <div className="space-y-2 mt-4">
                    <p className="text-gray-400 flex items-start gap-3">
                      <span className="text-white mt-1">•</span> {store.address}, {store.city}, {store.state} {store.zipCode}
                    </p>
                    <p className="text-gray-400 flex items-center gap-3">
                      <span className="text-white">•</span> Open Mon-Sat, 9AM - 7PM
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    className="mt-8 rounded-full border-white/20 hover:bg-white hover:text-black transition-colors px-6"
                    onClick={() => router.push('/book')}
                  >
                    Book at this center
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Global Support Contact */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-32 border-t border-white/10 pt-20 pb-10 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Need Assistance?</h2>
          <p className="text-gray-400 mb-10 max-w-lg mx-auto">Our support team is available 24/7 to help you with bookings, memberships, and partner inquiries.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="mailto:support@cleanride.com" className="bg-[#141414] border border-white/10 px-8 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition-colors font-bold">
              support@cleanride.com
            </a>
            <a href="tel:1800123456" className="bg-[#141414] border border-white/10 px-8 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition-colors font-bold">
              <Phone className="w-5 h-5" /> 1-800-CLEANRIDE
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
