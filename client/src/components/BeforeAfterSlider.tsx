"use client";

import { useState } from "react";
import Image from "next/image";

export default function BeforeAfterSlider({ 
  imageUrl = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop" 
}: { 
  imageUrl?: string 
}) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="w-full max-w-5xl mx-auto relative group overflow-hidden rounded-3xl shadow-2xl border border-white/10" style={{ aspectRatio: '16/9' }}>
      
      {/* Background (Clean Car) */}
      <div className="absolute inset-0">
        <Image 
          src={imageUrl}
          alt="Clean Car"
          fill
          className="object-cover"
          style={{ filter: "brightness(1.1) contrast(1.1) saturate(1.2)" }}
        />
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-white/10 text-white z-10 pointer-events-none">
          Showroom Clean
        </div>
      </div>

      {/* Foreground (Dirty Car - Clipped) */}
      <div 
        className="absolute inset-0" 
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <Image 
          src={imageUrl}
          alt="Dirty Car"
          fill
          className="object-cover"
          // Applying heavy CSS filters to simulate dust and grime
          style={{ filter: "sepia(40%) grayscale(30%) brightness(0.5) contrast(0.8) blur(0.5px)" }}
        />
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-white/10 text-gray-300 z-10 pointer-events-none">
          Before Detailing
        </div>
      </div>

      {/* Slider Thumb / Divider */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.5)] z-20 pointer-events-none"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200 text-black">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-ml-1"><path d="m15 18-6-6 6-6"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-mr-1"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>

      {/* Invisible Range Input */}
      <input 
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 m-0 p-0"
      />
    </div>
  );
}
