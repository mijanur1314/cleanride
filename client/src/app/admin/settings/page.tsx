"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Save, Bell, Shield, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: "",
    supportEmail: "",
    contactPhone: "",
    taxRate: 0,
    enableNotifications: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.data.settings);
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.patch('/settings', settings);
      toast.success("Platform settings have been successfully updated!");
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your global platform configurations</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general"><Globe className="w-4 h-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" /> Alerts</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" /> Security</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSave}>
          <TabsContent value="general">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update the basic details of your CleanRide platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Platform Name</Label>
                    <Input 
                      id="siteName" 
                      value={settings.siteName} 
                      onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="supportEmail" 
                        type="email"
                        className="pl-9"
                        value={settings.supportEmail} 
                        onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone Number</Label>
                    <Input 
                      id="contactPhone" 
                      value={settings.contactPhone} 
                      onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input 
                      id="taxRate" 
                      type="number"
                      step="0.1"
                      value={settings.taxRate} 
                      onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                  {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how the platform sends automated alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive real-time alerts when a new booking is created.</p>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="notifToggle"
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={settings.enableNotifications}
                      onChange={(e) => setSettings({...settings, enableNotifications: e.target.checked})}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                  {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Preferences</>}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-border/50 shadow-sm border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>Critical platform settings that affect all users.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-red-100 dark:border-red-900/30 rounded-lg bg-red-50/50 dark:bg-red-900/10 gap-4">
                  <div className="space-y-1">
                    <Label className="text-base text-red-700 dark:text-red-400 font-semibold">Maintenance Mode</Label>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80">
                      Temporarily disable new bookings and show a maintenance screen to customers.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant={settings.maintenanceMode ? "default" : "destructive"}
                    onClick={async () => {
                      const newMaintenanceMode = !settings.maintenanceMode;
                      setSettings({...settings, maintenanceMode: newMaintenanceMode});
                      try {
                        await api.patch('/settings', { maintenanceMode: newMaintenanceMode });
                        toast(newMaintenanceMode ? "Maintenance mode activated" : "Maintenance mode disabled", {
                          style: { backgroundColor: newMaintenanceMode ? '#ef4444' : '#10b981', color: 'white', border: 'none' }
                        });
                      } catch (error) {
                        toast.error('Failed to update maintenance mode');
                        setSettings({...settings, maintenanceMode: !newMaintenanceMode}); // revert
                      }
                    }}
                  >
                    {settings.maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}
