import { Layout } from "@/components/layout/Layout";
import { ArrowRight, Globe, Shield, Clock, Package, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import logisticsImage from "@/assets/logistics-control-center.jpg";;
import heroImage from "../assets/hero-image.jpg";
import { scrollToTop } from "@/lib/scrollToTop";


export default function Home() {
  const adjectives = ["Precision", "Speed", "Security", "Reliability"];
  const [currentAdjectiveIndex, setCurrentAdjectiveIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentAdjective = adjectives[currentAdjectiveIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseSpeed = 2000;

    let timeout;

    if (!isDeleting && displayedText === currentAdjective) {
      timeout = setTimeout(() => setIsDeleting(true), pauseSpeed);
    } else if (isDeleting && displayedText === "") {
      setIsDeleting(false);
      setCurrentAdjectiveIndex((prev) => (prev + 1) % adjectives.length);
    } else {
      timeout = setTimeout(() => {
        if (isDeleting) {
          setDisplayedText((prev) => prev.slice(0, -1));
        } else {
          setDisplayedText((prev) =>
            currentAdjective.slice(0, prev.length + 1)
          );
        }
      }, typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentAdjectiveIndex]);

  return (
    <Layout>
      {/* Hero Section */}
      <section 
        className="relative w-full min-h-[75vh] md:min-h-[80vh] flex items-center justify-center bg-cover bg-scroll md:bg-fixed [background-position:25%_62%] md:bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-black/65"></div>
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-8 text-center animate-in fade-in duration-700 sm:px-6 md:py-10">
          <h1 className="mb-6 w-full whitespace-normal text-center text-4xl font-black leading-tight tracking-tight text-white sm:whitespace-nowrap sm:text-4xl md:mb-8 md:text-5xl lg:text-7xl xl:text-8xl">
            <span className="text-primary">AES</span>{" "}
            <span>World Wide Courier</span>
          </h1>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium text-gray-200 mt-4 mb-10 text-center">
            Worldwide Delivery with Absolute{" "}
            <span className="text-primary">{displayedText}</span>
            <span className="animate-pulse">|</span>.
          </h2>
          <div className="flex flex-col justify-center gap-3 sm:flex-row md:gap-4">
            <Link
              href="/tracking"
              onClick={scrollToTop}
              className="bg-black text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
            >
              Track Shipment
            </Link>
            <Link
              href="/services"
              onClick={scrollToTop}
              className="bg-white text-black border border-white px-6 md:px-8 py-3 md:py-4 rounded-full font-medium hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="border-y border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
            {/* Stat 1: Years */}
            <div className="py-4 md:py-3 md:px-5 text-center flex flex-col items-center justify-center first:pt-0 md:first:pt-3 md:first:pl-0">
              <Clock className="w-7 h-7 text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-primary">30+</div>
              <div className="text-[11px] font-medium text-neutral-500 mt-1.5 tracking-wide uppercase">Years in Business</div>
            </div>
            
            {/* Stat 2: Shipments */}
            <div className="py-4 md:py-3 md:px-5 text-center flex flex-col items-center justify-center">
              <Package className="w-7 h-7 text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-primary">10,000+</div>
              <div className="text-[11px] font-medium text-neutral-500 mt-1.5 tracking-wide uppercase">Shipments Delivered</div>
            </div>
            
            {/* Stat 3: Countries */}
            <div className="py-4 md:py-3 md:px-5 text-center flex flex-col items-center justify-center">
              <Globe className="w-7 h-7 text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-primary">150+</div>
              <div className="text-[11px] font-medium text-neutral-500 mt-1.5 tracking-wide uppercase">Countries Covered</div>
            </div>
            
            {/* Stat 4: Clients */}
            <div className="py-4 md:py-3 md:px-5 text-center flex flex-col items-center justify-center last:pb-0 md:last:pb-3 md:last:pr-0">
              <Building2 className="w-7 h-7 text-primary mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
              <div className="text-[11px] font-medium text-neutral-500 mt-1.5 tracking-wide uppercase">Business Clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-6 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6 text-neutral-800" />
              </div>
              <h3 className="text-xl font-semibold">Time-Critical Delivery</h3>
              <p className="text-neutral-500 leading-relaxed">
                When "tomorrow" isn't fast enough. We specialize in NFO (Next Flight Out) and same-day dedicated drives across continents.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm">
                <Shield className="w-6 h-6 text-neutral-800" />
              </div>
              <h3 className="text-xl font-semibold">Secure Chain of Custody</h3>
              <p className="text-neutral-500 leading-relaxed">
                From diplomatic pouches to high-value prototypes. Real-time GPS monitoring and dedicated onboard couriers available.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white rounded-xl border border-neutral-200 flex items-center justify-center shadow-sm">
                <Globe className="w-6 h-6 text-neutral-800" />
              </div>
              <h3 className="text-xl font-semibold">Global Compliance</h3>
              <p className="text-neutral-500 leading-relaxed">
                Navigating customs complexities so you don't have to. We handle all documentation for seamless cross-border movement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute -inset-4 bg-neutral-100 rounded-full blur-3xl opacity-50"></div>
            <img
  src={logisticsImage}
  alt="Logistics Operations Center"
  className="relative rounded-lg shadow-xl grayscale opacity-90"
/>
          </div>
          <div className="order-1 md:order-2 space-y-8">
            <h2 className="text-4xl font-semibold tracking-tight">More Than Just Delivery</h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-black mt-2.5"></div>
                <div>
                  <h4 className="font-medium text-lg">On-Time Performance</h4>
                  <p className="text-neutral-500 mt-1">Consistent delivery schedules you can depend on.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-black mt-2.5"></div>
                <div>
                  <h4 className="font-medium text-lg">Real-Time Visibility</h4>
                  <p className="text-neutral-500 mt-1">Stay informed with tracking updates throughout the journey.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-black mt-2.5"></div>
                <div>
                  <h4 className="font-medium text-lg">Trusted Cargo Handling</h4>
                  <p className="text-neutral-500 mt-1">Secure transportation for documents, parcels, and commercial freight.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6 bg-neutral-900 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter">Ready to move?</h2>
          <p className="text-neutral-400 text-lg md:text-xl">
            Experience the new standard in global logistics today.
          </p>
          <div className="flex justify-center pt-4">
            <Link
              href="/contact"
              onClick={scrollToTop}
              className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2"
            >
              Start a Shipment <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
