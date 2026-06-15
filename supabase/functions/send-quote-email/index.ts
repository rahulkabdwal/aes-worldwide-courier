import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type QuoteEmailPayload = {
  name?: string;
  email?: string;
  phone?: string;
  shipment_type?: string;
  origin_city?: string;
  origin_country?: string | null;
  destination_city?: string;
  destination_country?: string | null;
  service?: string;
  weight_kg?: number | null;
  preferred_contact?: string;
  message?: string;
  created_at?: string;
};

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function escapeHtml(value: string | number | null | undefined) {
  return formatValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!Deno.env.get("RESEND_API_KEY")) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as QuoteEmailPayload;
    const createdAt = payload.created_at ?? new Date().toISOString();

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["rahulkabdwal60@gmail.com"],
      subject: "New Quote Request - AES Worldwide Courier",
      html: `
        <h2>New Quote Request - AES Worldwide Courier</h2>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(payload.name)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(payload.email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escapeHtml(payload.phone)}</td></tr>
          <tr><td><strong>Shipment Type</strong></td><td>${escapeHtml(payload.shipment_type)}</td></tr>
          <tr><td><strong>Origin City</strong></td><td>${escapeHtml(payload.origin_city)}</td></tr>
          <tr><td><strong>Origin Country</strong></td><td>${escapeHtml(payload.origin_country)}</td></tr>
          <tr><td><strong>Destination City</strong></td><td>${escapeHtml(payload.destination_city)}</td></tr>
          <tr><td><strong>Destination Country</strong></td><td>${escapeHtml(payload.destination_country)}</td></tr>
          <tr><td><strong>Service</strong></td><td>${escapeHtml(payload.service)}</td></tr>
          <tr><td><strong>Weight</strong></td><td>${escapeHtml(payload.weight_kg)}</td></tr>
          <tr><td><strong>Preferred Contact Method</strong></td><td>${escapeHtml(payload.preferred_contact)}</td></tr>
          <tr><td><strong>Message</strong></td><td>${escapeHtml(payload.message)}</td></tr>
          <tr><td><strong>Created Time</strong></td><td>${escapeHtml(createdAt)}</td></tr>
        </table>
      `,
      text: [
        `Name: ${formatValue(payload.name)}`,
        `Email: ${formatValue(payload.email)}`,
        `Phone: ${formatValue(payload.phone)}`,
        `Shipment Type: ${formatValue(payload.shipment_type)}`,
        `Origin City: ${formatValue(payload.origin_city)}`,
        `Origin Country: ${formatValue(payload.origin_country)}`,
        `Destination City: ${formatValue(payload.destination_city)}`,
        `Destination Country: ${formatValue(payload.destination_country)}`,
        `Service: ${formatValue(payload.service)}`,
        `Weight: ${formatValue(payload.weight_kg)}`,
        `Preferred Contact Method: ${formatValue(payload.preferred_contact)}`,
        `Message: ${formatValue(payload.message)}`,
        `Created Time: ${createdAt}`,
      ].join("\n"),
    });

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
