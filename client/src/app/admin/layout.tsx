"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Settings,
  Car,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { name: "Users & Partners", href: "/admin/users", icon: Users },
  { name: "Services", href: "/admin/services", icon: Car },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push("/");
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#050505] text-gray-100 selection:bg-white/20 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A]/80 backdrop-blur-xl border-r border-white/10 flex flex-col hidden md:flex z-10">
        <div className="p-6 border-b border-white/5">
          <Link href="/admin">
            <h2 className="text-2xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Admin Portal
            </h2>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                  isActive 
                    ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300 transition-colors")} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
