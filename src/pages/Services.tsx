import { Layout } from "@/components/layout/Layout";
import { ArrowRight, Plane, Truck, Ship, Package, Thermometer, Lock } from "lucide-react";
import { Link } from "wouter";
import texture from "@/assets/service-texture.png";
import { scrollToTop } from "@/lib/scrollToTop";
import customLogisticsImage from "../assets/custom-logistics.jpg";

const services = [
  {
    icon: Plane,
    title: "Next Flight Out (NFO)",
    description: "The fastest possible delivery method. Your shipment is placed on the next available commercial flight and hand-delivered at destination."
  },
  {
    icon: Truck,
    title: "Dedicated Drive",
    description: "Exclusive vehicle use for regional deliveries. No stops, no transfers, just direct point-to-point transportation."
  },
  {
    icon: Lock,
    title: "Secure Diplomatic",
    description: "For highly sensitive materials. Chain of custody is maintained by a single vetted courier from pickup to delivery."
  },
  {
    icon: Thermometer,
    title: "Cold Chain",
    description: "Temperature-controlled solutions for biotech and pharmaceutical needs. Validated packaging from -80°C to +25°C."
  },
  {
    icon: Package,
    title: "On Board Courier (OBC)",
    description: "A dedicated courier physically accompanies your shipment on the flight, managing customs clearance personally."
  },
  {
    icon: Ship,
    title: "Project Cargo",
    description: "Oversized or complex movements requiring specialized equipment, charter flights, or multi-modal coordination."
  }
];

export default function Services() {
  return (
    <Layout>
      <div className="bg-neutral-900 text-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-6 text-primary">Our Services</h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Bespoke logistics solutions designed for speed, security, and specialized handling requirements.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {services.map((service, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="mb-6 p-4 bg-neutral-50 rounded-2xl w-fit group-hover:bg-neutral-100 transition-colors">
                <service.icon className="w-8 h-8 text-neutral-900" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-neutral-600 transition-colors">{service.title}</h3>
              <p className="text-neutral-500 leading-relaxed mb-4">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#f5f5f5] py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-6">Custom Logistics Solutions</h2>
            <p className="text-neutral-600 mb-8 leading-relaxed">
              Don't see exactly what you need? Our team of logistics architects can design a custom supply chain solution tailored to your specific operational constraints.
            </p>
            <Link
              href="/contact"
              onClick={scrollToTop}
              className="inline-block bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-neutral-800 transition-colors"
            >
              Consult with an Expert
            </Link>
          </div>
          <div className="relative h-[300px] rounded-xl overflow-hidden grayscale opacity-80">
            <img
  src={customLogisticsImage}
  alt="Custom Logistics Solutions"
  className="absolute inset-0 w-full h-full object-cover"
/>
          </div>
        </div>
      </div>
    </Layout>
  );
}
