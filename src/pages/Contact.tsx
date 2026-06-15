import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";

const serviceOptions = [
  "Next Flight Out (NFO)",
  "Dedicated Drive",
  "Secure Diplomatic",
  "Cold Chain",
  "On Board Courier (OBC)",
  "Project Cargo",
  "Customs Documentation",
  "General Logistics Inquiry",
] as const;

const formSchema = z
  .object({
    shipment_type: z.enum(["Domestic", "International"]),
    origin_city: z.string().min(1, "Origin city is required"),
    origin_country: z.string().optional(),
    destination_city: z.string().min(1, "Destination city is required"),
    destination_country: z.string().optional(),
    service_required: z.enum(serviceOptions),
    approximate_weight: z
      .string()
      .refine((value) => value === "" || Number(value) > 0, "Weight must be a positive number"),
    name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    preferred_contact_method: z.enum(["Email", "Phone", "WhatsApp"]),
    message: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.shipment_type !== "International") {
      return;
    }

    if (!values.origin_country?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Origin country is required",
        path: ["origin_country"],
      });
    }

    if (!values.destination_country?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination country is required",
        path: ["destination_country"],
      });
    }
  });

export default function Contact() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      shipment_type: "Domestic",
      origin_city: "",
      origin_country: "",
      destination_city: "",
      destination_country: "",
      service_required: "Next Flight Out (NFO)",
      approximate_weight: "",
      phone: "",
      preferred_contact_method: "Email",
      message: "",
    },
  });
  const shipmentType = form.watch("shipment_type");

  async function handleNextStep() {
    const stepFields: Array<keyof z.infer<typeof formSchema>> = [
      "shipment_type",
      "service_required",
      "origin_city",
      "destination_city",
      "approximate_weight",
    ];

    if (shipmentType === "International") {
      stepFields.push("origin_country", "destination_country");
    }

    const isValid = await form.trigger(stepFields);

    if (isValid) {
      setCurrentStep(2);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const approximateWeight = values.approximate_weight
        ? Number(values.approximate_weight)
        : null;
        console.log("Submitting from device");
console.log("User agent:", navigator.userAgent);

      const { error } = await supabase
        .from("contact_inquiries")
        .insert({
          name: values.name,
          email: values.email,
          phone: values.phone,
          preferred_contact: values.preferred_contact_method.toLowerCase(),
          shipment_type: values.shipment_type.toLowerCase(),
          origin_city: values.origin_city,
          origin_country:
            values.shipment_type === "International" ? values.origin_country || null : null,
          destination_city: values.destination_city,
          destination_country:
            values.shipment_type === "International" ? values.destination_country || null : null,
          service: values.service_required,
          weight_kg: approximateWeight,
          message: values.message,
          status: "new",
        })


      if (error) {
        throw error;
      }

      const { error: emailError } = await supabase.functions.invoke("send-quote-email", {
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          preferred_contact: values.preferred_contact_method,
          shipment_type: values.shipment_type,
          origin_city: values.origin_city,
          origin_country:
            values.shipment_type === "International" ? values.origin_country || null : null,
          destination_city: values.destination_city,
          destination_country:
            values.shipment_type === "International" ? values.destination_country || null : null,
          service: values.service_required,
          weight_kg: approximateWeight,
          message: values.message,

        },
      });

      if (emailError) {
        console.error("Failed to send quote notification email:", emailError);
      }

      toast({
        title: "Quote request received",
        description: "Thank you. Our logistics team will review your shipment details and contact you shortly.",
      });
      form.reset();
      setCurrentStep(1);
      setIsSubmitted(true);
    } catch (error) {
  console.error("CONTACT FORM ERROR:", error);

  toast({
    title: "Failed to send message",
    description:
      error instanceof Error
        ? error.message
        : JSON.stringify(error),
    variant: "destructive",
  });
}
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] gap-12 lg:gap-20 items-start">
          
          {/* Info Side */}
          <div className="order-2 space-y-12 lg:pt-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-6">Get in touch</h1>
              <p className="text-lg text-neutral-500 max-w-md">
                Have a complex shipment or need a custom quote? Our logistics experts are ready to assist.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">Email</h4>
                  <p className="text-neutral-500">aeswwc@gmail.com</p>
                  <p className="text-neutral-500"></p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">Phone</h4>
                  <p className="text-neutral-500">+91 9811371018</p>
                  <p className="text-neutral-500">+91 XXXXXXXXXX</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">Address</h4>
                  <p className="text-neutral-500 max-w-xs">
                    G-8, 252H, Kailash Plaza,<br/>
                    Sant Nagar, East of Kailash,<br/>
                    New Delhi-65
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="order-1 bg-white p-8 md:p-10 rounded-3xl shadow-[0_18px_60px_-24px_rgba(0,0,0,0.18)] border border-neutral-100">
            {isSubmitted ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5 text-center py-10">
                <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Thank you for your quote request</h2>
                  <p className="text-neutral-500 mt-3">
                    AES Worldwide Courier has received your shipment details and will respond shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all"
                >
                  Send Another Request
                </button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex items-center gap-3 text-sm">
                    {[
                      { step: 1, label: "Shipment Details" },
                      { step: 2, label: "Contact Information" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-3 flex-1">
                        <div
                          className={`flex items-center gap-2 ${
                            currentStep === item.step ? "text-black" : "text-neutral-400"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                              currentStep === item.step
                                ? "bg-black text-white border-black"
                                : "bg-white text-neutral-400 border-neutral-200"
                            }`}
                          >
                            {item.step}
                          </span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.step === 1 && <div className="h-px bg-neutral-200 flex-1" />}
                      </div>
                    ))}
                  </div>

                  {currentStep === 1 ? (
                    <div key="shipment-step" className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                      <FormField
                        control={form.control}
                        name="shipment_type"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-neutral-500">Shipment Type *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                              >
                                {["Domestic", "International"].map((type) => (
                                  <FormItem
                                    key={type}
                                    className="flex items-center space-x-3 space-y-0 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3"
                                  >
                                    <FormControl>
                                      <RadioGroupItem value={type} />
                                    </FormControl>
                                    <FormLabel className="font-medium text-neutral-700">{type}</FormLabel>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="service_required"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-500">Service Required *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl">
                                  <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {serviceOptions.map((service) => (
                                  <SelectItem key={service} value={service}>
                                    {service}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="origin_city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-500">Origin City *</FormLabel>
                              <FormControl>
                                <Input placeholder="New Delhi" {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="destination_city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-500">Destination City *</FormLabel>
                              <FormControl>
                                <Input placeholder="Mumbai" {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {shipmentType === "International" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-1 duration-200">
                          <FormField
                            control={form.control}
                            name="origin_country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-neutral-500">Origin Country *</FormLabel>
                                <FormControl>
                                  <Input placeholder="India" {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="destination_country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-neutral-500">Destination Country *</FormLabel>
                                <FormControl>
                                  <Input placeholder="United Kingdom" {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="approximate_weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-500">Approximate Weight (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" placeholder="25" {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 group"
                      >
                        Next Step <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div key="contact-step" className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-500">Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-neutral-500">Email Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="john@example.com" {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-500">Phone Number *</FormLabel>
                              <FormControl>
                              <Input {...field} className="bg-neutral-50 border-neutral-200 focus:bg-white transition-all py-6 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferred_contact_method"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-neutral-500">Preferred Contact Method</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                              >
                                {["Email", "Phone", "WhatsApp"].map((method) => (
                                  <FormItem
                                    key={method}
                                    className="flex items-center space-x-3 space-y-0 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3"
                                  >
                                    <FormControl>
                                      <RadioGroupItem value={method} />
                                    </FormControl>
                                    <FormLabel className="font-medium text-neutral-700">{method}</FormLabel>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-500">Shipment Description / Message *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your shipment, timing, handling needs, and any special instructions..." 
                                {...field} 
                                className="min-h-37.5 bg-neutral-50 border-neutral-200 focus:bg-white transition-all rounded-xl resize-none" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-[0.8fr_1.2fr] gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="w-full bg-white text-black py-4 rounded-xl font-bold border border-neutral-200 hover:bg-neutral-50 transition-all"
                        >
                          Back
                        </button>
                        <button 
                          type="submit" 
                          disabled={form.formState.isSubmitting}
                          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 group"
                        >
                          {form.formState.isSubmitting ? (
                            "Sending..."
                          ) : (
                            <>
                              Submit Quote Request <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
