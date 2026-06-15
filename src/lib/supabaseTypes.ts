export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contact_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          company: string | null;
          phone: string | null;
          preferred_contact_method: string | null;
          shipment_type: string | null;
          origin_city: string | null;
          origin_country: string | null;
          destination_city: string | null;
          destination_country: string | null;
          service_required: string | null;
          approximate_weight: number | null;
          message: string;
          created_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          company?: string | null;
          phone?: string | null;
          preferred_contact_method?: string | null;
          shipment_type?: string | null;
          origin_city?: string | null;
          origin_country?: string | null;
          destination_city?: string | null;
          destination_country?: string | null;
          service_required?: string | null;
          approximate_weight?: number | null;
          message: string;
          created_at?: string;
          status?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          phone?: string | null;
          preferred_contact_method?: string | null;
          shipment_type?: string | null;
          origin_city?: string | null;
          origin_country?: string | null;
          destination_city?: string | null;
          destination_country?: string | null;
          service_required?: string | null;
          approximate_weight?: number | null;
          message?: string;
          created_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string;
          tracking_id: string | null;
          status: string | null;
          origin_city: string | null;
          origin_country: string | null;
          destination_city: string | null;
          destination_country: string | null;
          booking_date: string | null;
          estimated_delivery: string | null;
          actual_delivery: string | null;
          pieces: number | null;
          weight: number | null;
          service_mode: string | null;
          network_carrier: string | null;
          network_tracking_id: string | null;
          consignor_name: string | null;
          consignee_name: string | null;
          pod_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tracking_id?: string | null;
          status?: string | null;
          origin_city?: string | null;
          origin_country?: string | null;
          destination_city?: string | null;
          destination_country?: string | null;
          booking_date?: string | null;
          estimated_delivery?: string | null;
          actual_delivery?: string | null;
          pieces?: number | null;
          weight?: number | null;
          service_mode?: string | null;
          network_carrier?: string | null;
          network_tracking_id?: string | null;
          consignor_name?: string | null;
          consignee_name?: string | null;
          pod_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tracking_id?: string | null;
          status?: string | null;
          origin_city?: string | null;
          origin_country?: string | null;
          destination_city?: string | null;
          destination_country?: string | null;
          booking_date?: string | null;
          estimated_delivery?: string | null;
          actual_delivery?: string | null;
          pieces?: number | null;
          weight?: number | null;
          service_mode?: string | null;
          network_carrier?: string | null;
          network_tracking_id?: string | null;
          consignor_name?: string | null;
          consignee_name?: string | null;
          pod_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tracking_events: {
        Row: {
          id: string;
          shipment_id: string;
          event_title: string | null;
          event_description: string | null;
          location_city: string | null;
          location_country: string | null;
          event_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          event_title?: string | null;
          event_description?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          event_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          event_title?: string | null;
          event_description?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          event_time?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_events_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
