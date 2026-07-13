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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      const { user } = response.data.data;
      const { token } = response.data;
      
      login(user, token);
      toast.success("Welcome back!");
      
      if (user.role === "ADMIN") router.push("/admin");
      else if (user.role === "PARTNER") router.push("/partner");
      else router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(error.response?.data?.message || "Login failed");
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
        <div className="bg-[#141414]/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl mt-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome Back
            </h1>
            <p className="text-gray-400 font-light">Sign in to manage your bookings</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                {...register("email")} 
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30 text-lg"
              />
              {errors.email && <p className="text-xs text-red-400 ml-1 mt-1">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</Label>
                <Link href="#" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  {...register("password")} 
                  className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30 text-lg pr-12"
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
              className="w-full h-14 mt-6 rounded-xl bg-gradient-to-r from-gray-900 to-[#141414] border border-white/10 text-white hover:border-white/30 text-lg font-bold tracking-widest uppercase transition-all shadow-xl group" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-white hover:underline transition-all">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
