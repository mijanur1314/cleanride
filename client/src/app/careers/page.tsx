import { Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Careers() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300 pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white font-heading tracking-tight mb-4">Join Our Mission</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            We're building the future of premium on-demand vehicle care. If you're passionate about tech, logistics, or automotive perfection, we want you on our team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Senior Full Stack Engineer</h3>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-6">Remote (Global) • Engineering</p>
            <p className="text-gray-400 font-light mb-8">Help us scale our real-time matching algorithms and build ultra-premium user interfaces using Next.js, Node, and WebSockets.</p>
            <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-xs h-12">Apply Now</Button>
          </div>

          <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Operations Manager</h3>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-6">New York, NY • Operations</p>
            <p className="text-gray-400 font-light mb-8">Oversee partner onboarding, quality assurance, and regional fleet logistics. Ensure every CleanRide experience is flawless.</p>
            <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-xs h-12">Apply Now</Button>
          </div>

          <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Product Designer</h3>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-6">Remote (US) • Design</p>
            <p className="text-gray-400 font-light mb-8">Shape the visual language of our consumer app and partner dashboard. Must have an obsession with micro-interactions and dark mode aesthetics.</p>
            <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-xs h-12">Apply Now</Button>
          </div>

          <div className="p-8 rounded-3xl bg-[#141414] border border-white/5 shadow-2xl flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Don't see a fit?</h3>
            <p className="text-gray-400 font-light mb-6">We're always looking for exceptional talent. Send us your resume and tell us how you can contribute.</p>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold uppercase tracking-widest text-xs h-12 px-8">
              Open Application <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
