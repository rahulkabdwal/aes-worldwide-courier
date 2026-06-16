import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { scrollToTop } from "@/lib/scrollToTop";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = location === "/";
  const isServices = location === "/services";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground bg-[#fafafa] selection:bg-primary-dark selection:text-white">
      <nav
        className={cn(
          "fixed top-0 left-0 right-0",
          "z-50 transition-all duration-300 border-b border-transparent",
          scrolled
            ? cn(
                "bg-white/80 backdrop-blur-md border-neutral-200",
                isHome ? "py-3" : "py-2",
              )
            : cn(isHome ? "bg-white border-neutral-200" : "bg-transparent", "py-3"),
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" onClick={scrollToTop} className="flex items-center">
            <img src={logo} alt="AES Worldwide" className="h-14 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <Link href="/" onClick={scrollToTop} className="hover:text-primary-dark transition-colors">
              Home
            </Link>
            <Link href="/services" onClick={scrollToTop} className="hover:text-primary-dark transition-colors">
              Services
            </Link>
            <Link href="/about-us" onClick={scrollToTop} className="hover:text-primary-dark transition-colors">
              About Us
            </Link>
            <Link href="/tracking" onClick={scrollToTop} className="hover:text-primary-dark transition-colors">
              Tracking
            </Link>
            <Link href="/contact" onClick={scrollToTop} className="hover:text-primary-dark transition-colors">
              Contact
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-200 p-6 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-2">
            <Link href="/" onClick={scrollToTop} className="text-lg font-medium py-2">
              Home
            </Link>
            <Link href="/services" onClick={scrollToTop} className="text-lg font-medium py-2">
              Services
            </Link>
            <Link href="/about-us" onClick={scrollToTop} className="text-lg font-medium py-2">
              About Us
            </Link>
            <Link href="/tracking" onClick={scrollToTop} className="text-lg font-medium py-2">
              Tracking
            </Link>
            <Link href="/contact" onClick={scrollToTop} className="text-lg font-medium py-2">
              Contact
            </Link>
          </div>
        )}
      </nav>

      <main
        className={cn(
          "flex-grow",
          isHome && "pt-[80px]",
          isServices && "pt-[80px]",
          !isHome && !isServices && "pt-[80px]",
        )}
      >
        {children}
      </main>

      <footer className="bg-white border-t border-neutral-200 py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4 flex flex-col items-center">
            <Link href="/" onClick={scrollToTop} className="flex items-center">
              <img
                src={logo}
                alt="AES Worldwide"
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-neutral-500 text-sm leading-relaxed text-center max-w-xs">
              Precision logistics for the modern enterprise. We move the world's
              most critical assets with unmatched reliability.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>
                <Link href="/" onClick={scrollToTop} className="hover:text-primary-dark">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" onClick={scrollToTop} className="hover:text-primary-dark">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about-us" onClick={scrollToTop} className="hover:text-primary-dark">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/tracking" onClick={scrollToTop} className="hover:text-primary-dark">
                  Tracking
                </Link>
              </li>
              <li>
                <Link href="/contact" onClick={scrollToTop} className="hover:text-primary-dark">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li>G-8, 252H, Kailash Plaza,<br/>
                    Sant Nagar, East of Kailash,<br/>
                    New Delhi-65</li>
              <li>
                <a href="mailto:aeswwc@gmail.com" className="hover:text-primary-dark">
                  aeswwc@gmail.com
                </a>
              </li>
              <li>+91 9811371018</li>
              <li>+91 7827741901</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Service Standards</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>• Reliable Transit Planning</li>
              <li className="text-xs text-neutral-400 ml-4 -mt-1.5">Carefully coordinated routes and schedules for timely deliveries.</li>
              <li className="mt-2">• Shipment Visibility</li>
              <li className="text-xs text-neutral-400 ml-4 -mt-1.5">Track cargo progress with transparent status updates.</li>
              <li className="mt-2">• Secure Handling Procedures</li>
              <li className="text-xs text-neutral-400 ml-4 -mt-1.5">Professional handling from pickup to final delivery.</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-neutral-100 flex justify-center items-center text-xs text-neutral-400">
          <p>&copy; 2026 AES Worldwide Courier. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
