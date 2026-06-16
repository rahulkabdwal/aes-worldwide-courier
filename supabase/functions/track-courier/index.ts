import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Map your admin dashboard dropdown selections to what TrackCourier expects
function normalizeCourierSlug(carrier: string): string {
  const c = carrier.toLowerCase().trim();
  if (c.includes("blue dart")) return "bluedart";
  if (c.includes("speed post")) return "speedpost";
  if (c.includes("dtdc")) return "dtdc";
  if (c.includes("delhivery")) return "delhivery";
  return c.replace(/\s+/g, ""); // fallback fallback strip spaces
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("TRACKCOURIER_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing TRACKCOURIER_API_KEY inside Supabase Secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const trackingNumber = payload.trackingNumber?.trim();
    const carrierName = payload.carrierName?.trim() || "";

    if (!trackingNumber) {
      return new Response(JSON.stringify({ error: "trackingNumber is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const courierSlug = normalizeCourierSlug(carrierName);
    
    // Exact URL format from your TrackCourier Dashboard
    const apiUrl = `https://api.trackcourier.io/v1/track?courier=${courierSlug}&tracking_number=${encodeURIComponent(trackingNumber)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey, // Exact header from your dashboard screenshot
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});