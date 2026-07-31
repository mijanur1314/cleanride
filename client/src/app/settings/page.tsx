"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, Shield, Save, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { user, login, isAuthenticated, _hasHydrated, token } = useAuthStore();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribeToPush = async () => {
    setIsSubscribing(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error("Push notifications are not supported in this browser.");
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Permission for notifications was denied.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID key is missing");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      await api.post("/notifications/subscribe", subscription);
      toast.success("Successfully subscribed to real-time notifications!");
    } catch (error: any) {
      toast.error(error.message || "Failed to subscribe to notifications");
      console.error(error);
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user) {
      setName(user.name || "");
      setPhone((user as any).phone || "");
    }
  }, [isAuthenticated, user, router, _hasHydrated]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.patch("/users/updateMe", { name, phone });
      login(res.data.data.user, token!); // Update zustand store
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center bg-[#0A0A0A]"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 pt-32 pb-12 px-4 selection:bg-white/20">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent font-heading">Account Settings</h1>
          <p className="text-gray-400 font-light">Manage your profile, preferences, and security.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full flex flex-col md:flex-row gap-8">
          <TabsList className="flex md:flex-col bg-transparent justify-start items-start w-full md:w-64 h-auto gap-2 p-0 rounded-none border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4 overflow-x-auto custom-scrollbar">
            <TabsTrigger value="profile" className="w-full justify-start gap-3 data-[state=active]:bg-[#141414] data-[state=active]:text-white text-gray-400 rounded-xl py-3 px-4 font-medium transition-all text-left">
              <User className="w-4 h-4" /> Profile Details
            </TabsTrigger>
            <TabsTrigger value="security" className="w-full justify-start gap-3 data-[state=active]:bg-[#141414] data-[state=active]:text-white text-gray-400 rounded-xl py-3 px-4 font-medium transition-all text-left">
              <Shield className="w-4 h-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="w-full justify-start gap-3 data-[state=active]:bg-[#141414] data-[state=active]:text-white text-gray-400 rounded-xl py-3 px-4 font-medium transition-all text-left">
              <Bell className="w-4 h-4" /> Notifications
            </TabsTrigger>
          </TabsList>

          <div className="flex-1">
            <TabsContent value="profile" className="m-0 focus-visible:outline-none">
              <Card className="border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <CardHeader className="relative z-10 border-b border-white/5 pb-6">
                  <CardTitle className="font-heading text-xl text-white">Personal Information</CardTitle>
                  <CardDescription className="text-gray-400 font-light">Update your name and phone number.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-8">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-500">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input 
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-black/50 border-white/10 rounded-xl h-14 pl-12 text-white placeholder:text-gray-600 focus-visible:ring-white/20" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-gray-500">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input 
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-black/50 border-white/10 rounded-xl h-14 pl-12 text-white placeholder:text-gray-600 focus-visible:ring-white/20" 
                          placeholder="e.g. +91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button type="submit" disabled={isSaving || (name === user?.name && phone === (user as any)?.phone)} className="bg-white text-black hover:bg-gray-200 font-bold tracking-widest uppercase text-xs h-12 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="m-0 focus-visible:outline-none">
              <Card className="border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <CardHeader className="relative z-10 border-b border-white/5 pb-6">
                  <CardTitle className="font-heading text-xl text-white">Security & Access</CardTitle>
                  <CardDescription className="text-gray-400 font-light">Manage your email and password.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-8 space-y-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input 
                        value={user?.email || ""}
                        disabled
                        className="bg-black/20 border-white/5 rounded-xl h-14 pl-12 text-gray-400 cursor-not-allowed" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 font-light mt-2 ml-1">Email address cannot be changed currently.</p>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Change Password</h4>
                      <p className="text-xs text-gray-400 font-light mt-1">To update your password, please contact support or use the forgot password flow on the login page.</p>
                    </div>
                    <Button variant="outline" className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl h-12 px-6 cursor-pointer" onClick={() => toast.info("Password update feature coming soon!")}>
                      Request Password Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 focus-visible:outline-none">
              <Card className="border-white/10 bg-[#141414] shadow-2xl rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                <CardHeader className="relative z-10 border-b border-white/5 pb-6">
                  <CardTitle className="font-heading text-xl text-white">Push Notifications</CardTitle>
                  <CardDescription className="text-gray-400 font-light">Receive real-time updates when your booking status changes.</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-8 space-y-8">
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div>
                      <h4 className="text-white font-bold mb-1">Booking Updates</h4>
                      <p className="text-sm text-gray-400">Get notified when a detailer is on their way, or when your wash is complete.</p>
                    </div>
                    <Button 
                      onClick={handleSubscribeToPush} 
                      disabled={isSubscribing}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide rounded-xl h-12 px-6"
                    >
                      {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                      Enable Push
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
