"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password: data.password });
      if (res.data.status === "success") {
        toast.success("Password reset successfully! You can now sign in.");
        router.push("/login");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password. The link might be expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background aesthetics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-[100%] blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-[#141414]/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl mt-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Create New Password
            </h1>
            <p className="text-gray-400 font-light">Your new password must be different from previous used passwords.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</Label>
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
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 ml-1 mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                {...register("confirmPassword")} 
                className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-white/30 text-lg"
              />
              {errors.confirmPassword && <p className="text-xs text-red-400 ml-1 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 rounded-xl text-lg font-bold bg-white text-black hover:bg-gray-200 transition-all mt-4"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Reset Password"}
            </Button>
          </form>

        </div>
      </motion.div>
    </div>
  );
}
