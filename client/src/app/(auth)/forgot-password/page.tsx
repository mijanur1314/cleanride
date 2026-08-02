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
import { Loader2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", data);
      if (res.data.status === "success") {
        setIsSuccess(true);
        toast.success("Password reset link sent to your email!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
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
              Reset Password
            </h1>
            <p className="text-gray-400 font-light">Enter your email and we'll send you a link to reset your password.</p>
          </div>

          {isSuccess ? (
             <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <span className="text-2xl text-white">✉️</span>
                </div>
                <h3 className="text-xl font-bold text-white">Check your email</h3>
                <p className="text-gray-400 text-sm">We've sent a password reset link to your email address. It will expire in 1 hour.</p>
                <Link href="/login">
                  <Button className="w-full mt-6 h-14 rounded-xl text-lg font-bold bg-white text-black hover:bg-gray-200">
                    Return to Login
                  </Button>
                </Link>
             </div>
          ) : (
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
                
                <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 rounded-xl text-lg font-bold bg-white text-black hover:bg-gray-200 transition-all mt-4"
                >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Reset Link"}
                </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Remember your password?{" "}
              <Link href="/login" className="text-white hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
