"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from './ui/button';
import { Menu, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data.data.notifications);
        } catch (error) {}
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(`/notifications/read-all`);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {}
  };

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10 py-2' : 'bg-transparent py-4'}`}>
      <div className="container flex items-center justify-between mx-auto px-6">
        <Link href="/" className="block group">
          <div className="relative w-24 h-16 md:w-32 md:h-20 transition-all">
            <Image src="/logo.png" alt="CleanRide Logo" fill className="object-contain object-left drop-shadow-xl" priority />
          </div>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10 text-sm font-semibold tracking-wide text-gray-300 uppercase">
          <Link href="/services" className="hover:text-white transition-colors">Packages</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Locations</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="relative p-2 rounded-full hover:bg-white/10 text-white">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-sm rounded-md mb-1 cursor-pointer transition-colors ${n.isRead ? 'bg-transparent hover:bg-muted' : 'bg-blue-50/50 dark:bg-blue-900/20'}`}
                          onClick={() => !n.isRead && markAsRead(n.id)}
                        >
                          <p className={`${!n.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{n.message}</p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Link href={user.role === 'ADMIN' ? '/admin' : user.role === 'PARTNER' ? '/partner' : '/dashboard'}>
                <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10 rounded-full px-6 font-semibold hidden md:inline-flex">Dashboard</Button>
              </Link>
              <Button onClick={logout} className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-bold shadow-xl hidden md:inline-flex">Logout</Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white rounded-full px-6 font-semibold">Log in</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-11 font-bold transition-transform hover:scale-105 shadow-xl">Sign Up</Button>
              </Link>
            </div>
          )}
          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
