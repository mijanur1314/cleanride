"use client";

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Define routes where the footer should be hidden (app-like pages)
  const hideFooterRoutes = ['/book', '/dashboard', '/partner', '/login', '/signup'];
  
  // Check if current path matches any of the hidden routes
  const shouldHide = hideFooterRoutes.some(route => pathname?.startsWith(route));
  
  if (shouldHide) {
    return null;
  }
  
  return <Footer />;
}
