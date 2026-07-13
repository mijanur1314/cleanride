"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["USER", "PARTNER"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"USER" | "PARTNER">("USER");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "USER" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/signup", { ...data, role });
      const { user } = response.data.data;
      const { token } = response.data;
      
      login(user, token);
      toast.success("Account created successfully!");
      
      if (user.role === "PARTNER") router.push("/partner");
      else router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen pt-32 pb-12 bg-[#0A0A0A] px-4 relative overflow-hidden">
      {/* Aesthetic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20 blur-sm"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-[#141414]/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Join CleanRide
            </h1>
            <p className="text-gray-400 font-light">Experience premium vehicle care</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-black/50 p-1 rounded-xl mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => { setRole("USER"); setValue("role", "USER"); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "USER" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setRole("PARTNER"); setValue("role", "PARTNER"); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "PARTNER" ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"}`}
            >
              Wash Partner
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                {...register("name")} 
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30"
              />
              {errors.name && <p className="text-xs text-red-400 ml-1 mt-1">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                {...register("email")} 
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30"
              />
              {errors.email && <p className="text-xs text-red-400 ml-1 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number <span className="text-gray-600">(Optional)</span></Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+1 234 567 890" 
                {...register("phone")} 
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  {...register("password")} 
                  className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 ml-1 mt-1">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 mt-4 rounded-xl bg-gradient-to-r from-gray-900 to-[#141414] border border-white/10 text-white hover:border-white/30 text-lg font-bold tracking-widest uppercase transition-all shadow-xl group" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-white hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
