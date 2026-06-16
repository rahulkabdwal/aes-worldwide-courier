import { Layout } from "@/components/layout/Layout";

export default function AboutUs() {
  return (
    <Layout>
      <section className="bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary mb-5">
              About Us
            </p>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-none mb-8">
              Built in India for dependable worldwide delivery.
            </h1>
            <p className="text-lg md:text-2xl text-neutral-300 leading-relaxed max-w-3xl">
              AES Worldwide Courier was started in India to help businesses,
              families, and institutions move shipments across borders with
              clarity, care, and consistent communication.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-neutral-200 pb-16">
            <div className="md:col-span-4">
              <p className="text-sm font-mono uppercase tracking-widest text-neutral-400">
                Our Story
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-4">
                Indian roots. Global reach.
              </h2>
            </div>
            <div className="md:col-span-8 space-y-6 text-lg text-neutral-600 leading-relaxed">
              <p>
                AES Worldwide Courier began with a simple belief: international
                logistics should feel transparent, responsive, and accountable
                from pickup to final delivery.
              </p>
              <p>
                From our base in India, we coordinate domestic and international
                courier movements for documents, parcels, commercial shipments,
                and time-sensitive cargo. Every shipment is handled with a focus
                on secure processing, practical routing, and clear tracking
                updates.
              </p>
              <p>
                We combine local operating knowledge with global courier
                partnerships, helping customers ship confidently across cities,
                countries, and supply chains.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 border-b border-neutral-200">
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-8">
              <p className="text-4xl font-semibold tracking-tight text-neutral-900">
                30+
              </p>
              <p className="text-sm uppercase tracking-wide text-neutral-500 mt-2">
                Years in Business
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-8">
              <p className="text-4xl font-semibold tracking-tight text-neutral-900">
                150+
              </p>
              <p className="text-sm uppercase tracking-wide text-neutral-500 mt-2">
                Countries Covered
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-8">
              <p className="text-4xl font-semibold tracking-tight text-neutral-900">
                10,000+
              </p>
              <p className="text-sm uppercase tracking-wide text-neutral-500 mt-2">
                Shipments Delivered
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Reliable Planning</h3>
              <p className="text-neutral-500 leading-relaxed">
                We plan shipments around realistic transit windows, route
                options, documentation needs, and destination requirements.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Shipment Visibility</h3>
              <p className="text-neutral-500 leading-relaxed">
                Customers receive clear status updates so they know where their
                shipment stands and what happens next.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Secure Handling</h3>
              <p className="text-neutral-500 leading-relaxed">
                From documents to commercial cargo, we focus on careful
                handling, accurate details, and dependable delivery
                coordination.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
