"use client"

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, Calendar, Shield, Clock, Zap, ChevronRight, Navigation } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Ref to prevent fetching right after user clicks a suggestion
  const selectedFromList = useRef(false);

  useEffect(() => {
    if (location.length < 3 || selectedFromList.current) {
      setSuggestions([]);
      selectedFromList.current = false;
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Failed to fetch location suggestions", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timeoutId);
  }, [location]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setIsFetching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            const simplified = parts.slice(0, 3).join(', ');
            selectedFromList.current = true;
            setLocation(simplified);
          } else {
            selectedFromList.current = true;
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (error) {
          selectedFromList.current = true;
          setLocation("Location detected");
        } finally {
          setIsFetching(false);
        }
      },
      (error) => {
        setIsFetching(false);
        console.error("Geolocation error:", error);
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white selection:bg-primary selection:text-primary-foreground">
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center pt-40 pb-32 overflow-hidden">
        {/* Background Gradients & Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/50 to-[#0A0A0A] z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop" 
            alt="Luxury Dark Car" 
            className="w-full h-full object-cover opacity-60 object-center"
          />
        </div>

        <div className="container px-6 mx-auto relative z-20 flex flex-col items-center text-center">
          <div className="max-w-4xl flex flex-col items-center mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block mb-8"
            >
              <span className="px-5 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-sm font-bold tracking-widest uppercase text-gray-300 shadow-xl">
                Premium Doorstep Detailing
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[1.1] mb-8"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Showroom <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">Perfection.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-16 font-light"
            >
              We bring ultimate luxury car care directly to your location. Book our elite detailers in seconds.
            </motion.p>
          </div>

          {/* Dribbble-style Horizontal Booking Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full max-w-5xl bg-[#141414]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-2xl flex flex-col gap-6 relative z-30 mx-auto"
          >
            {/* INPUTS ROW (Higher Z-Index to prevent select menu clipping) */}
            <div className="flex flex-col md:flex-row gap-4 w-full relative z-40">
              <div className="flex-1 px-6 py-2 border-b md:border-b-0 md:border-r border-white/10 text-left relative z-50">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Location</label>
                <div className="flex items-center gap-3 text-gray-200">
                  <button 
                    onClick={handleGetLocation}
                    disabled={isFetching}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors shrink-0 group relative"
                    title="Get Current Location"
                  >
                    {isFetching ? (
                      <div className="w-5 h-5 border-2 border-t-white border-white/20 rounded-full animate-spin" />
                    ) : (
                      <Navigation className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    )}
                  </button>
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      value={location}
                      onChange={(e) => {
                        selectedFromList.current = false;
                        setLocation(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Enter your address" 
                      className="bg-transparent border-none outline-none text-lg w-full placeholder:text-gray-600 font-medium" 
                    />
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-[calc(100%+16px)] left-0 w-full min-w-[280px] bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]">
                        {suggestions.map((sugg: { id: string; name: string; type: string }, idx: number) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              const parts = sugg.display_name.split(',');
                              const simplified = parts.slice(0, 3).join(', ');
                              selectedFromList.current = true;
                              setLocation(simplified);
                              setShowSuggestions(false);
                            }}
                            className="px-5 py-3 hover:bg-white/5 cursor-pointer text-sm text-gray-300 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3"
                          >
                            <MapPin className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                            <span>{sugg.display_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 px-6 py-2 border-b md:border-b-0 md:border-r border-white/10 text-left relative z-40">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Service Type</label>
                <div className="flex items-center gap-3 text-gray-200">
                  <Shield className="w-5 h-5 text-gray-400 shrink-0" />
                  <select className="bg-transparent border-none outline-none text-lg w-full appearance-none font-medium cursor-pointer">
                    <option className="bg-[#141414] py-2">The Signature Detail</option>
                    <option className="bg-[#141414] py-2">Express Exterior</option>
                    <option className="bg-[#141414] py-2">Interior Deep Clean</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 px-6 py-2 text-left relative z-30">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Date & Time</label>
                <div className="flex items-center gap-3 text-gray-200">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                  <input type="datetime-local" className="bg-transparent border-none outline-none text-lg w-full font-medium cursor-pointer [color-scheme:dark]" />
                </div>
              </div>
            </div>

            {/* Centered Book Now Button (Lower Z-Index) */}
            <div className="flex justify-center w-full pt-2 relative z-10">
              <Button onClick={() => router.push('/book')} className="w-full md:w-[60%] py-7 rounded-2xl bg-gradient-to-r from-gray-900 to-[#141414] border border-white/10 text-white hover:border-white/30 text-xl font-bold tracking-widest uppercase transition-all hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                Secure Booking
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brand Trust Section */}
      <section className="py-12 border-y border-white/5 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold tracking-widest text-gray-600 uppercase mb-8">Trusted by owners of</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            {/* Using text for brands to maintain aesthetic without needing external SVGs */}
            <h3 className="text-2xl font-bold tracking-tighter" style={{ fontFamily: 'var(--font-heading)' }}>PORSCHE</h3>
            <h3 className="text-2xl font-bold tracking-widest">TESLA</h3>
            <h3 className="text-2xl font-serif italic">Mercedes-Benz</h3>
            <h3 className="text-3xl font-black tracking-tighter">BMW</h3>
            <h3 className="text-2xl font-bold tracking-widest">AUDI</h3>
          </div>
        </div>
      </section>

      {/* Services/Packages Section (Car Rental Card Style) */}
      <section className="py-32 relative bg-[#0A0A0A]">
        <div className="container px-6 mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Elite Packages</h2>
              <p className="text-gray-400 text-lg">Select the tier that matches your vehicle's needs.</p>
            </div>
            <div className="hidden md:flex gap-4">
              <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <button className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white text-black bg-white transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PackageCard 
              image="https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=1000&auto=format&fit=crop"
              title="Express Wash"
              price="39"
              time="45 mins"
              type="Exterior Only"
              features={["Foam Cannon Wash", "Microfiber Dry", "Tire Dressing", "Glass Cleaning"]}
            />
            <PackageCard 
              image="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000&auto=format&fit=crop"
              title="The Signature"
              price="89"
              time="2 hours"
              type="Full Detail"
              isPopular
              features={["Express Wash included", "Interior Vacuum", "Leather Wipe", "Dashboard UV Protect"]}
            />
            <PackageCard 
              image="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop"
              title="Showroom Reset"
              price="199"
              time="4+ hours"
              type="Premium Care"
              features={["The Signature included", "Paint Sealant", "Leather Condition", "Carpet Extraction"]}
            />
          </div>
        </div>
      </section>

      {/* App Promo / CTA */}
      <section className="py-32 relative overflow-hidden bg-[#111111] border-t border-white/5">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="container px-6 mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex-1 max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Your car's spa, <br />in your pocket.
            </h2>
            <p className="text-xl text-gray-400 mb-10 font-light">
              Track your detailer in real-time, manage bookings, and access exclusive membership perks with the CleanRide app.
            </p>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={() => {
                  import('sonner').then((mod) => mod.toast.info("Our iOS and Android apps are launching soon! Stay tuned."));
                }}
                className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-14 text-lg font-bold"
              >
                Download App
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="border-white/20 hover:bg-white/5 rounded-full px-8 h-14 text-lg bg-transparent text-white"
              >
                View Membership
              </Button>
            </div>
          </div>
          
          {/* Aesthetic UI Mockup Placeholder */}
          <div className="flex-1 w-full relative">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-gray-600 rounded-[3rem] shadow-2xl transform rotate-6 border border-white/10" />
              <div className="absolute inset-0 bg-[#1A1A1A] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col">
                <div className="p-8 pb-0">
                  <div className="w-full h-48 rounded-2xl bg-[url('https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white font-bold text-xl">Arriving in 15 mins</p>
                      <p className="text-gray-300 text-sm">John D. • The Signature</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-16 rounded-xl bg-white/5 flex items-center px-4 border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="ml-4 flex-1">
                        <div className="h-3 w-24 bg-white/20 rounded-full mb-2" />
                        <div className="h-2 w-16 bg-white/10 rounded-full" />
                      </div>
                    </div>
                    <div className="h-16 rounded-xl bg-white/5 flex items-center px-4 border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="ml-4 flex-1">
                        <div className="h-3 w-32 bg-white/20 rounded-full mb-2" />
                        <div className="h-2 w-20 bg-white/10 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function PackageCard({ image, title, price, time, type, features, isPopular = false }: { image: React.ReactNode, title: string, price: number | string, time: string, type: string, features: string[], isPopular?: boolean }) {
  const router = useRouter();
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
      className={`group relative rounded-[2rem] overflow-hidden bg-[#141414] border ${isPopular ? 'border-gray-500' : 'border-white/5'} shadow-2xl flex flex-col`}
    >
      {isPopular && (
        <div className="absolute top-4 right-4 z-20 bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
          Best Value
        </div>
      )}
      
      {/* Image Header */}
      <div className="relative h-56 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent z-10" />
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute bottom-4 left-6 z-20 flex gap-3">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-gray-300 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {time}
          </span>
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-gray-300 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> {type}
          </span>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col relative z-20">
        <h3 className="font-bold text-2xl mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
        
        <div className="flex items-baseline gap-1 mb-8 mt-4">
          <span className="text-gray-400 font-medium">$</span>
          <span className="text-5xl font-black tracking-tighter text-white">{price}</span>
        </div>
        
        <ul className="space-y-4 mb-10 flex-1">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              {feature}
            </li>
          ))}
        </ul>
        
        <Button onClick={() => router.push('/book')} className={`w-full rounded-xl h-14 text-lg font-bold transition-all ${isPopular ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/10 text-white hover:bg-white/20'}`}>
          Select Details
        </Button>
      </div>
    </motion.div>
  );
}
