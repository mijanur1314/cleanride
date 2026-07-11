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
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r flex flex-col hidden md:flex">
        <div className="p-6 border-b">
          <h2 className="text-xl font-heading font-bold tracking-tight text-primary">
            Admin Portal
          </h2>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
