import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

function setPageMeta(title: string, description: string) {
  document.title = title;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }

  meta.content = description;
}

function LogisticsIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm md:max-w-md">
      <div className="absolute inset-0 rounded-full border border-neutral-100 bg-white shadow-[0_30px_80px_-45px_rgba(0,0,0,0.35)]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 420 420"
        role="img"
        aria-labelledby="not-found-illustration-title"
      >
        <title id="not-found-illustration-title">
          Courier route illustration with package, pin, and delivery vehicle
        </title>
        <defs>
          <linearGradient id="routeFade" x1="70" x2="350" y1="300" y2="120">
            <stop stopColor="#111111" stopOpacity="0.08" />
            <stop offset="1" stopColor="#111111" stopOpacity="0.42" />
          </linearGradient>
        </defs>
        <path
          d="M78 300 C128 238 168 342 218 270 C262 206 282 154 350 120"
          fill="none"
          stroke="url(#routeFade)"
          strokeDasharray="8 12"
          strokeLinecap="round"
          strokeWidth="4"
        />
        <g className="animate-[float_4s_ease-in-out_infinite]">
          <path
            d="M140 168 L218 124 L296 168 L218 214 Z"
            fill="#f5f5f5"
            stroke="#111111"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M140 168 V252 L218 300 V214 Z"
            fill="#ffffff"
            stroke="#111111"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M296 168 V252 L218 300 V214 Z"
            fill="#e5e5e5"
            stroke="#111111"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M180 146 L258 192" stroke="#111111" strokeWidth="3" />
        </g>
        <g className="animate-[routeMove_4s_ease-in-out_infinite]">
          <path
            d="M86 286 h50 l14 16 h34 v24 H86 Z"
            fill="#111111"
            stroke="#111111"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path d="M98 296 h30" stroke="#ffffff" strokeLinecap="round" strokeWidth="4" />
          <circle cx="112" cy="326" r="10" fill="#ffffff" stroke="#111111" strokeWidth="4" />
          <circle cx="166" cy="326" r="10" fill="#ffffff" stroke="#111111" strokeWidth="4" />
        </g>
        <g className="animate-[float_3.5s_ease-in-out_infinite]">
          <path
            d="M334 88 C306 88 284 110 284 138 C284 178 334 226 334 226 C334 226 384 178 384 138 C384 110 362 88 334 88 Z"
            fill="#111111"
          />
          <circle cx="334" cy="138" r="16" fill="#ffffff" />
        </g>
        <path
          className="animate-[planeGlide_5s_ease-in-out_infinite]"
          d="M290 92 L358 66 L330 126 L318 104 L290 92 Z"
          fill="#ffffff"
          stroke="#111111"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </svg>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes routeMove {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(16px, -10px); }
        }
        @keyframes planeGlide {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(10px, -8px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}

export default function NotFound() {
  useEffect(() => {
    setPageMeta(
      "404 - Page Not Found | AES Worldwide Courier",
      "The requested AES Worldwide Courier page could not be located. Return home, track a shipment, or contact support for assistance.",
    );
  }, []);

  return (
    <Layout>
      <main className="min-h-[78vh] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-[1fr_0.9fr] md:gap-16 md:py-24">
          <section className="text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">
              AES Worldwide Courier
            </p>
            <h1 className="mt-4 text-8xl font-semibold tracking-tighter text-black sm:text-9xl">
              404
            </h1>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">
              Shipment Lost?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-500 md:mx-0 md:text-lg">
              The page you're looking for couldn't be located. Let's get you back on track.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Return Home
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/tracking"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Track a Shipment
              </Link>
            </div>

            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-left md:mx-0">
              <p className="text-sm font-semibold text-neutral-950">
                Need immediate assistance?
              </p>
              <div className="mt-3 space-y-2 text-sm text-neutral-600">
                <a
                  href="mailto:contact@aeswwc.com"
                  className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  contact@aeswwc.com
                </a>
                <a
                  href="tel:+919811371018"
                  className="flex items-center gap-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  +91 9811371018
                </a>
              </div>
            </div>
          </section>

          <LogisticsIllustration />
        </div>
      </main>
    </Layout>
  );
}
