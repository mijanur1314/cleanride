"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/partner")) {
    return null;
  }

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 pt-20 pb-10 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-20">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="relative w-36 h-24 group block cursor-pointer">
              <Image
                src="/logo.png"
                alt="CleanRide Logo"
                fill
                sizes="150px"
                className="object-contain object-left"
              />
            </Link>
            <p className="text-gray-400 font-light max-w-sm leading-relaxed text-lg">
              Premium vehicle detailing and luxury car care services delivered
              straight to your doorstep.
            </p>
            <div className="flex gap-4 mt-2 relative z-50">
              <SocialIcon icon={<TwitterIcon className="w-4 h-4" />} href="https://x.com/Mijanur1314" />
              <SocialIcon icon={<InstagramIcon className="w-4 h-4" />} href="https://www.instagram.com/mija.nur1314/" />
              <SocialIcon icon={<LinkedinIcon className="w-4 h-4" />} href="https://www.linkedin.com/in/sk-mijanur-rahaman1314/" />
              <SocialIcon icon={<FacebookIcon className="w-4 h-4" />} href="https://www.facebook.com/profile.php?id=100030662590330" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-lg mb-2 text-white">Services</h4>
            <FooterLink href="/services">The Signature</FooterLink>
            <FooterLink href="/services">Showroom Reset</FooterLink>
            <FooterLink href="/services">Express Wash</FooterLink>
            <FooterLink href="/services">Interior Detail</FooterLink>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-lg mb-2 text-white">Company</h4>
            <FooterLink href="/about">About Us</FooterLink>
            <FooterLink href="/careers">Careers</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/partner-with-us">Become a Partner</FooterLink>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-lg mb-2 text-white">Legal</h4>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/cookies">Cookie Policy</FooterLink>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} CleanRide Luxury Care. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-gray-400 font-medium hover:text-white transition-colors flex items-center group w-fit cursor-pointer"
    >
      {children}
      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
    </Link>
  );
}

function SocialIcon({ icon, href = "#" }: { icon: React.ReactNode, href?: string }) {
  return (
    <div 
      onClick={() => {
        if (href !== "#") window.open(href, '_blank', 'noopener,noreferrer');
      }}
      className="relative z-[999] pointer-events-auto w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer shadow-sm"
    >
      <div className="pointer-events-none flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.6l.4-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
