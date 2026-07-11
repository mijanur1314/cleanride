"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ChevronRight, Zap, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/useBookingStore";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setService } = useBookingStore();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        setServices(res.data.data.services);
      } catch (error) {
        console.error("Failed to fetch services", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleBook = (service: any) => {
    setService(service);
    router.push("/book");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-32 pb-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-900/40 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Elite Packages
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto font-light"
          >
            Choose the perfect level of detailing for your vehicle. Premium care delivered directly to your doorstep.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-[2rem] overflow-hidden bg-[#141414] border border-white/5 hover:border-white/20 transition-all shadow-2xl flex flex-col"
              >
                <div className="p-8 flex-1 flex flex-col relative z-20">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:bg-white group-hover:text-black transition-colors">
                    {index % 3 === 0 ? <Zap className="w-6 h-6" /> : index % 3 === 1 ? <Shield className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  
                  <h3 className="font-bold text-2xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{service.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 h-10">{service.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-8 mt-auto">
                    <span className="text-gray-400 font-medium">$</span>
                    <span className="text-5xl font-black tracking-tighter text-white">{service.price}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-10 border-t border-white/5 pt-6">
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors shrink-0" />
                      Duration: {service.duration} mins
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors shrink-0" />
                      Premium Equipment
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors shrink-0" />
                      Satisfaction Guaranteed
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={() => handleBook(service)}
                    className="w-full rounded-xl h-14 text-lg font-bold transition-all bg-white/10 text-white hover:bg-white hover:text-black mt-auto"
                  >
                    Select Package
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 bg-gradient-to-r from-blue-900/20 to-[#141414] border border-white/10 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div>
            <h3 className="text-2xl font-bold mb-2">Need a Custom Detail?</h3>
            <p className="text-gray-400">Contact us for commercial fleets or specialized restoration services.</p>
          </div>
          <Button variant="outline" className="h-12 px-8 rounded-full border-white/20 hover:bg-white hover:text-black transition-colors" onClick={() => router.push('/contact')}>
            Contact Specialists
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
